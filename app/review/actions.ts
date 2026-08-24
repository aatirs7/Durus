"use server";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardStates, cards, lessons, reviews, settings } from "@/db/schema";
import { isCurrentLessonCapped, schedule, type Grade } from "@/lib/srs";

export type GradePayload = {
  cardId: number;
  direction: "recognition" | "production";
  grade: Grade;
  msToAnswer: number;
};

/*
  One card, one call. The session does not block on the response, which
  keeps the flip instant and makes the offline outbox a small change
  later rather than a rewrite.
*/
export async function submitGrade(payload: GradePayload) {
  const now = new Date();

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
      ),
    )
    .where(eq(cards.id, payload.cardId));

  if (!row) throw new Error(`card ${payload.cardId} not found`);

  const config = await getConfig();

  const state = {
    ease: row.ease ?? 2.5,
    intervalDays: row.intervalDays ?? 0,
    repetitions: row.repetitions ?? 0,
    lapses: row.lapses ?? 0,
  };

  const next = schedule(state, payload.grade, {
    now,
    capToCurrentLesson: isCurrentLessonCapped(
      row.lessonNumber,
      config.currentLesson,
      config.currentLessonSince,
      now,
    ),
  });

  await db
    .insert(cardStates)
    .values({
      cardId: payload.cardId,
      direction: payload.direction,
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueAt: next.dueAt,
    })
    .onConflictDoUpdate({
      target: [cardStates.cardId, cardStates.direction],
      set: {
        ease: next.ease,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        lapses: next.lapses,
        dueAt: next.dueAt,
      },
    });

  await db.insert(reviews).values({
    cardId: payload.cardId,
    direction: payload.direction,
    grade: payload.grade,
    msToAnswer: payload.msToAnswer,
    reviewedAt: now,
  });

  /*
    Production is created lazily, only once recognition for this card
    reaches repetitions >= 2. Otherwise production drills swamp the first
    week of every new lesson.
  */
  if (payload.direction === "recognition" && next.repetitions >= 2) {
    await db
      .insert(cardStates)
      .values({
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
  const [last] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.cardId, payload.cardId),
        eq(reviews.direction, payload.direction),
      ),
    )
    .orderBy(desc(reviews.id))
    .limit(1);

  if (last) await db.delete(reviews).where(eq(reviews.id, last.id));

  if (!payload.previous.existed) {
    await db
      .delete(cardStates)
      .where(
        and(
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
        eq(cardStates.cardId, payload.cardId),
        eq(cardStates.direction, payload.direction),
      ),
    );

  return { ok: true as const };
}

async function getConfig() {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!row) throw new Error("settings row is missing, run the seed");
  return row;
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
    .where(gte(reviews.reviewedAt, since));
  return row?.median ?? null;
}
