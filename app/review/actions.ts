"use server";

import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardStates, cards, lessons, reviews } from "@/db/schema";
import { getSettingsFor, requireProfileId } from "@/lib/session";
import { isCurrentLessonCapped, schedule, type Grade } from "@/lib/srs";

export type GradePayload = {
  cardId: number;
  direction: "recognition" | "production";
  grade: Grade;
  msToAnswer: number;
  /*
    Answered in a practice session, drawn because nothing was due. The
    review is still logged, so speed and accuracy remain honest, but a
    correct answer leaves the schedule where it was.
  */
  practice?: boolean;
};

/*
  The one device that is not a phone.

  Every review this writes has to be foldable, because card_states is a
  deterministic replay of this table computed independently here and on
  each device. A row missing any input schedule() consumed cannot be
  replayed - and "cannot be replayed" does not fail loudly, it produces
  a different interval on the phone from the one the web just showed.

  So the three inputs that used to be thrown away are now stored:

    capped  depends on currentLesson and currentLessonSince AS THEY WERE
            at this moment, and that history exists nowhere else
    fuzz    is sampled HERE and passed in, rather than letting schedule()
            reach for Math.random, so the value that produced this
            interval is recoverable
    practice  records that the answer came from the nothing-is-due
            fallback, where a correct answer must not move the schedule

  clientId is the idempotency key the sync protocol dedupes on, and
  deviceId is a constant because the browser is one logical device: the
  fold breaks ties on it, and every row written here came from the same
  place.
*/
const WEB_DEVICE_ID = "web";
export async function submitGrade(payload: GradePayload) {
  const now = new Date();
  const profileId = await requireProfileId();

  const [row] = await db
    .select({
      lessonNumber: lessons.number,
      ease: cardStates.ease,
      intervalDays: cardStates.intervalDays,
      repetitions: cardStates.repetitions,
      lapses: cardStates.lapses,
    })
    .from(cards)
    .innerJoin(lessons, eq(cards.lessonId, lessons.id))
    .leftJoin(
      cardStates,
      and(
        eq(cardStates.cardId, cards.id),
        eq(cardStates.direction, payload.direction),
        eq(cardStates.profileId, profileId),
      ),
    )
    .where(eq(cards.id, payload.cardId));

  if (!row) throw new Error(`card ${payload.cardId} not found`);

  const config = await getSettingsFor(profileId);

  const state = {
    ease: row.ease ?? 2.5,
    intervalDays: row.intervalDays ?? 0,
    repetitions: row.repetitions ?? 0,
    lapses: row.lapses ?? 0,
  };

  const capped = isCurrentLessonCapped(
    row.lessonNumber,
    config.currentLesson,
    config.currentLessonSince,
    now,
  );

  /*
    Sampled here and handed to schedule(), rather than letting it call
    Math.random itself. That is the whole difference between an interval
    that can be recomputed and one that can only be believed.
  */
  const fuzz = Math.random();

  const next = schedule(state, payload.grade, {
    now,
    capToCurrentLesson: capped,
    random: () => fuzz,
  });

  /*
    Practice never extends an interval. Acing a word the scheduler did
    not ask for should not push it a month further out, or a quiet
    evening of revision would empty the next fortnight. Getting one
    wrong still counts, because a word you have just failed needs to
    come back sooner however you found that out.
  */
  const skipSchedule = payload.practice === true && payload.grade !== "again";

  if (!skipSchedule) {
  await db
    .insert(cardStates)
    .values({
      profileId,
      cardId: payload.cardId,
      direction: payload.direction,
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueAt: next.dueAt,
    })
    .onConflictDoUpdate({
      target: [cardStates.profileId, cardStates.cardId, cardStates.direction],
      set: {
        ease: next.ease,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        lapses: next.lapses,
        dueAt: next.dueAt,
      },
    });
  }

  await db.insert(reviews).values({
    profileId,
    cardId: payload.cardId,
    direction: payload.direction,
    grade: payload.grade,
    msToAnswer: payload.msToAnswer,
    reviewedAt: now,
    practice: payload.practice === true,
    capped,
    fuzz,
    clientId: crypto.randomUUID(),
    deviceId: WEB_DEVICE_ID,
  });

  /*
    Production is created lazily, only once recognition for this card
    reaches repetitions >= 2. Otherwise production drills swamp the first
    week of every new lesson.
  */
  if (!skipSchedule && payload.direction === "recognition" && next.repetitions >= 2) {
    await db
      .insert(cardStates)
      .values({
        profileId,
        cardId: payload.cardId,
        direction: "production",
        dueAt: now,
      })
      .onConflictDoNothing();
  }

  return { ok: true as const };
}

/*
  Undo. The reviews table is append only in normal operation and this is
  the one documented exception.
*/
export async function undoGrade(payload: {
  cardId: number;
  direction: "recognition" | "production";
  previous: {
    ease: number;
    intervalDays: number;
    repetitions: number;
    lapses: number;
    dueAt: string;
    existed: boolean;
  };
}) {
  const profileId = await requireProfileId();
  /*
    The most recent review that has not already been undone. Without the
    retractedAt filter, undoing twice in a row would retract the same row
    twice and leave the one before it standing.
  */
  const [last] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.profileId, profileId),
        eq(reviews.cardId, payload.cardId),
        eq(reviews.direction, payload.direction),
        isNull(reviews.retractedAt),
      ),
    )
    .orderBy(desc(reviews.id))
    .limit(1);

  /*
    A tombstone, not a delete.

    An append only log with a tombstone can be replayed; one with a hole in
    it cannot - the other device never learns the row went away and folds a
    review the user took back. Retracting is also one way, which is exactly
    what the UI offers: there is no undoing an undo.
  */
  if (last) {
    await db
      .update(reviews)
      .set({ retractedAt: new Date() })
      .where(eq(reviews.id, last.id));
  }

  if (!payload.previous.existed) {
    await db
      .delete(cardStates)
      .where(
        and(
          eq(cardStates.profileId, profileId),
          eq(cardStates.cardId, payload.cardId),
          eq(cardStates.direction, payload.direction),
        ),
      );
    return { ok: true as const };
  }

  await db
    .update(cardStates)
    .set({
      ease: payload.previous.ease,
      intervalDays: payload.previous.intervalDays,
      repetitions: payload.previous.repetitions,
      lapses: payload.previous.lapses,
      dueAt: new Date(payload.previous.dueAt),
    })
    .where(
      and(
        eq(cardStates.profileId, profileId),
        eq(cardStates.cardId, payload.cardId),
        eq(cardStates.direction, payload.direction),
      ),
    );

  return { ok: true as const };
}

/*
  Median seconds to reveal over the last 7 days, excluding today, so the
  session end line has something honest to compare against.
*/
export async function getWeekMedianMs(): Promise<number | null> {
  const since = new Date(Date.now() - 7 * 86_400_000);
  const [row] = await db
    .select({
      median: sql<
        number | null
      >`percentile_cont(0.5) within group (order by ${reviews.msToAnswer})`,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.profileId, await requireProfileId()),
        gte(reviews.reviewedAt, since),
      ),
    );
  return row?.median ?? null;
}
