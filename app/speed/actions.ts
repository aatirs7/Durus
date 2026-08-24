"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardStates, cards, reviews, settings } from "@/db/schema";
import { requireProfileId } from "@/lib/session";
import { SPEED_FLOOR_MS, SPEED_RUN_LENGTH, type SpeedWord } from "@/lib/speed";


/*
  Draws only from cards that are already known in recognition, so the
  drill is not speed testing something that was never learned.
*/
export async function getSpeedWords(): Promise<SpeedWord[]> {
  const profileId = await requireProfileId();
  const rows = await db
    .select({
      cardId: cards.id,
      arabic: cards.arabic,
      english: cards.english,
    })
    .from(cardStates)
    .innerJoin(cards, eq(cardStates.cardId, cards.id))
    .where(
      and(
        eq(cardStates.profileId, profileId),
        eq(cardStates.direction, "recognition"),
        gte(cardStates.repetitions, 2),
        eq(cardStates.suspended, false),
      ),
    )
    .orderBy(sql`random()`)
    .limit(SPEED_RUN_LENGTH);

  return rows;
}

/*
  Speed runs write to reviews with direction speed but never touch
  cardStates. They measure, they do not schedule.
*/
export async function recordSpeedRun(
  results: { cardId: number; knew: boolean; windowMs: number }[],
) {
  if (results.length === 0) return { ok: true as const };
  const profileId = await requireProfileId();

  await db.insert(reviews).values(
    results.map((r) => ({
      profileId,
      cardId: r.cardId,
      direction: "speed" as const,
      // Knew it maps to good, missed it to again, so the accuracy maths
      // on the stats page does not need a special case for speed.
      grade: r.knew ? ("good" as const) : ("again" as const),
      msToAnswer: r.windowMs,
    })),
  );

  return { ok: true as const };
}

/* The one adaptive thing in the app. */
export async function tightenSpeedWindow(nextMs: number) {
  const clamped = Math.max(SPEED_FLOOR_MS, Math.round(nextMs));
  await db
    .update(settings)
    .set({ speedWindowMs: clamped })
    .where(eq(settings.profileId, await requireProfileId()));
  return { speedWindowMs: clamped };
}
