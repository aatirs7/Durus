import { and, asc, eq, gt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { poolDb } from "@/db/pool";
import {
  cardHearts,
  cardStates,
  cardSuspensions,
  cards,
  profiles,
  reviews,
  settings,
} from "@/db/schema";
import { authenticate } from "@/lib/api-auth";
import { foldStates, type FoldReview } from "@/lib/sync/fold";

export const runtime = "nodejs";

const PAGE = 500;

/* Clock sanity. A device whose clock is years out would otherwise poison the
   fold's ordering for every card it touched. */
const FUTURE_SLACK_MS = 24 * 60 * 60 * 1000;
const EPOCH_FLOOR = Date.UTC(2024, 0, 1);

/*
  Settings fields the phone owns locally and must never overwrite server side.
  haptics and reduceMotion belong to a handset, not to an account.
*/
const LOCAL_ONLY = new Set(["profileId", "dirty", "fieldUpdatedAt", "updatedAt"]);

type WireReview = {
  clientId: string;
  deviceId: string;
  cardId: number;
  direction: "recognition" | "production" | "speed";
  grade: "again" | "hard" | "good" | "easy";
  msToAnswer: number;
  reviewedAt: number;
  practice: boolean;
  capped: boolean;
  fuzz: number | null;
  retractedAt: number | null;
  seq?: number;
};

type WireSetRow = {
  cardId: number;
  deletedAt: number | null;
  updatedAt: number;
  deviceId: string;
  seq?: number;
};

export async function POST(request: Request) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const { profileId } = auth;

  const body = (await request.json()) as {
    deviceId: string;
    since: number;
    reviews: WireReview[];
    hearts: WireSetRow[];
    suspensions: WireSetRow[];
    settings: { values: Record<string, unknown>; fieldUpdatedAt: Record<string, number> } | null;
  };

  const rejected: { kind: string; clientId?: string; cardId?: number; reason: string }[] = [];
  const touched = new Set<string>();

  /* Cards are content and are the server's to define; a review naming one that
     does not exist is unfoldable and would vanish from stats rather than fail
     loudly, so it is refused instead. */
  const known = new Set(
    (await poolDb.select({ id: cards.id }).from(cards)).map((c) => c.id),
  );

  const now = Date.now();

  const acceptable = (r: WireReview) => {
    if (!known.has(r.cardId)) {
      rejected.push({ kind: "review", clientId: r.clientId, reason: "unknown_card" });
      return false;
    }
    if (r.reviewedAt > now + FUTURE_SLACK_MS || r.reviewedAt < EPOCH_FLOOR) {
      rejected.push({ kind: "review", clientId: r.clientId, reason: "bad_reviewed_at" });
      return false;
    }
    return true;
  };

  const incomingReviews = (body.reviews ?? []).filter(acceptable);
  const incomingHearts = (body.hearts ?? []).filter((h) => known.has(h.cardId));
  const incomingSuspensions = (body.suspensions ?? []).filter((s) => known.has(s.cardId));

  /*
    Everything below happens inside ONE transaction holding a row lock on
    profile.sync_seq.

    The lock is what makes the cursor gapless. A bigserial would be simpler and
    wrong: sequence values are handed out before commit, so a transaction that
    takes 6 and commits first lets a client store cursor 6 and never see the row
    that took 5. Allocating under a held lock makes sequence order and commit
    order the same thing.

    Contention is one user's own two or three devices, so the lock costs
    nothing here.
  */
  await poolDb.transaction(async (tx) => {
    /* execute() returns a QueryResult, not an array - the rows are on .rows. */
    const locked = await tx.execute<{ sync_seq: string }>(
      sql`select sync_seq from profile where id = ${profileId} for update`,
    );
    let seq = Number(locked.rows[0]?.sync_seq ?? 0);
    const nextSeq = () => (seq += 1);

    for (const r of incomingReviews) {
      await tx
        .insert(reviews)
        .values({
          profileId,
          cardId: r.cardId,
          direction: r.direction,
          grade: r.grade,
          msToAnswer: r.msToAnswer,
          reviewedAt: new Date(r.reviewedAt),
          practice: r.practice,
          capped: r.capped,
          fuzz: r.fuzz,
          retractedAt: r.retractedAt ? new Date(r.retractedAt) : null,
          clientId: r.clientId,
          deviceId: r.deviceId,
          seq: nextSeq(),
        })
        /*
          The whole idempotency story. A retry whose response was lost inserts
          once; a duplicated batch inserts once. A retraction arriving later is
          the one field allowed to change, because a retract cannot be undone.
        */
        .onConflictDoUpdate({
          target: reviews.clientId,
          set: { retractedAt: r.retractedAt ? new Date(r.retractedAt) : null },
        });

      if (r.direction !== "speed") touched.add(`${r.cardId}:${r.direction}`);
    }

    for (const [table, rows] of [
      [cardHearts, incomingHearts],
      [cardSuspensions, incomingSuspensions],
    ] as const) {
      for (const row of rows) {
        /* Last write wins per key over {present, deleted}. The where clause is
           what makes an older row a no-op rather than a revert. */
        await tx
          .insert(table)
          .values({
            profileId,
            cardId: row.cardId,
            updatedAt: new Date(row.updatedAt),
            deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
            deviceId: row.deviceId,
            seq: nextSeq(),
          })
          .onConflictDoUpdate({
            target: [table.profileId, table.cardId],
            set: {
              updatedAt: new Date(row.updatedAt),
              deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
              deviceId: row.deviceId,
              seq: sql`excluded.seq`,
            },
            where: sql`${table.updatedAt} < ${new Date(row.updatedAt)}`,
          });
      }
    }

    if (body.settings) {
      const [mine] = await tx
        .select()
        .from(settings)
        .where(eq(settings.profileId, profileId));

      const stamps = { ...((mine?.fieldUpdatedAt as Record<string, number>) ?? {}) };
      const next: Record<string, unknown> = {};

      for (const [k, at] of Object.entries(body.settings.fieldUpdatedAt)) {
        if (LOCAL_ONLY.has(k)) continue;
        if ((stamps[k] ?? 0) >= at) continue;
        const v = body.settings.values[k];
        next[k] = k === "currentLessonSince" && typeof v === "number" ? new Date(v) : v;
        stamps[k] = at;
      }

      if (Object.keys(next).length > 0) {
        await tx
          .update(settings)
          .set({ ...next, fieldUpdatedAt: stamps })
          .where(eq(settings.profileId, profileId));
      }
    }

    /*
      Recompute card_states for every touched key from the merged log.

      The server keeps this table for the web app's benefit, not the phone's -
      the phone folds its own. Because both run the same pure schedule() over
      the same log in the same order, they agree without either being told.
    */
    for (const key of touched) {
      const [cardIdRaw, direction] = key.split(":");
      const cardId = Number(cardIdRaw);

      const log = await tx
        .select({
          cardId: reviews.cardId,
          direction: reviews.direction,
          grade: reviews.grade,
          reviewedAt: reviews.reviewedAt,
          practice: reviews.practice,
          capped: reviews.capped,
          fuzz: reviews.fuzz,
          retractedAt: reviews.retractedAt,
          deviceId: reviews.deviceId,
          clientId: reviews.clientId,
        })
        .from(reviews)
        .where(
          and(
            eq(reviews.profileId, profileId),
            eq(reviews.cardId, cardId),
            eq(reviews.direction, direction as "recognition" | "production"),
          ),
        );

      const folded = foldStates(
        log.map((r) => ({
          ...r,
          deviceId: r.deviceId ?? "legacy",
          clientId: r.clientId ?? "",
        })) as FoldReview[],
      );

      await tx
        .delete(cardStates)
        .where(
          and(
            eq(cardStates.profileId, profileId),
            eq(cardStates.cardId, cardId),
            eq(cardStates.direction, direction as "recognition" | "production"),
          ),
        );

      if (folded) {
        await tx.insert(cardStates).values({
          profileId,
          cardId,
          direction: direction as "recognition" | "production",
          ease: folded.ease,
          intervalDays: folded.intervalDays,
          repetitions: folded.repetitions,
          lapses: folded.lapses,
          dueAt: folded.dueAt,
        });
      }
    }

    await tx.update(profiles).set({ syncSeq: seq }).where(eq(profiles.id, profileId));
  });

  /*
    The pull runs AFTER the push has committed, so a device sees its own rows
    echoed back with their assigned seq. That echo is the acknowledgement.
  */
  const since = Number(body.since ?? 0);

  const outReviews = await poolDb
    .select()
    .from(reviews)
    .where(and(eq(reviews.profileId, profileId), gt(reviews.seq, since)))
    .orderBy(asc(reviews.seq))
    .limit(PAGE);

  const outHearts = await poolDb
    .select()
    .from(cardHearts)
    .where(and(eq(cardHearts.profileId, profileId), gt(cardHearts.seq, since)))
    .orderBy(asc(cardHearts.seq))
    .limit(PAGE);

  const outSuspensions = await poolDb
    .select()
    .from(cardSuspensions)
    .where(and(eq(cardSuspensions.profileId, profileId), gt(cardSuspensions.seq, since)))
    .orderBy(asc(cardSuspensions.seq))
    .limit(PAGE);

  const [config] = await poolDb
    .select()
    .from(settings)
    .where(eq(settings.profileId, profileId));

  const highest = Math.max(
    since,
    ...outReviews.map((r) => Number(r.seq ?? 0)),
    ...outHearts.map((r) => Number(r.seq ?? 0)),
    ...outSuspensions.map((r) => Number(r.seq ?? 0)),
  );

  const hasMore =
    outReviews.length === PAGE ||
    outHearts.length === PAGE ||
    outSuspensions.length === PAGE;

  return NextResponse.json({
    cursor: highest,
    hasMore,
    accepted: {
      reviews: incomingReviews.length,
      hearts: incomingHearts.length,
      suspensions: incomingSuspensions.length,
      settings: !!body.settings,
    },
    rejected,
    reviews: outReviews.map((r) => ({
      clientId: r.clientId,
      deviceId: r.deviceId,
      cardId: r.cardId,
      direction: r.direction,
      grade: r.grade,
      msToAnswer: r.msToAnswer,
      reviewedAt: r.reviewedAt.getTime(),
      practice: r.practice,
      capped: r.capped,
      fuzz: r.fuzz,
      retractedAt: r.retractedAt ? r.retractedAt.getTime() : null,
      seq: Number(r.seq ?? 0),
    })),
    hearts: outHearts.map(toWireSet),
    suspensions: outSuspensions.map(toWireSet),
    settings: config
      ? {
          values: Object.fromEntries(
            Object.entries(config)
              .filter(([k]) => !LOCAL_ONLY.has(k))
              .map(([k, v]) => [k, v instanceof Date ? v.getTime() : v]),
          ),
          fieldUpdatedAt: (config.fieldUpdatedAt as Record<string, number>) ?? {},
        }
      : null,
  });
}

function toWireSet(r: {
  cardId: number;
  deletedAt: Date | null;
  updatedAt: Date;
  deviceId: string | null;
  seq: number | null;
}) {
  return {
    cardId: r.cardId,
    deletedAt: r.deletedAt ? r.deletedAt.getTime() : null,
    updatedAt: r.updatedAt.getTime(),
    deviceId: r.deviceId ?? "legacy",
    seq: Number(r.seq ?? 0),
  };
}
