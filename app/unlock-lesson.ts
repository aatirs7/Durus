"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cards, lessons, settings } from "@/db/schema";
import { TOTAL_LESSONS } from "@/lib/constants";
import { getSettingsFor, requireProfileId } from "@/lib/session";

/*
  Vocabulary lives in the repository, seeded lesson by lesson as class
  covers them. Every seeded card is in the database from the start, but
  the queue only ever draws from lessons up to settings.currentLesson,
  so nothing from a lesson that has not been taught can appear.

  Advancing the gate is therefore the only thing this has to do.
*/

export type NextLesson =
  | { state: "ready"; number: number; titleEn: string; cardCount: number }
  /* The lesson exists in the book but its words are not written yet. */
  | { state: "coming-soon"; number: number }
  /* Lesson 23 is the end of Book 1. */
  | { state: "finished" }
  | null;

/*
  The next lesson, but only once its cards have actually been seeded.
  Offering to unlock an empty lesson would just produce a silent
  no-change, which reads as a broken button.
*/
export async function getNextLesson(): Promise<NextLesson> {
  const profileId = await requireProfileId();
  const config = await getSettingsFor(profileId);
  const number = config.currentLesson + 1;

  if (number > TOTAL_LESSONS) return { state: "finished" };

  const [row] = await db
    .select({
      number: lessons.number,
      titleEn: lessons.titleEn,
      cardCount: sql<number>`count(${cards.id})::int`,
    })
    .from(lessons)
    .leftJoin(cards, eq(cards.lessonId, lessons.id))
    .where(eq(lessons.number, number))
    .groupBy(lessons.number, lessons.titleEn);

  /*
    A lesson with no cards has not been typed up yet. Say so rather than
    offering a button that would open an empty lesson.
  */
  if (!row || row.cardCount === 0) return { state: "coming-soon", number };

  return {
    state: "ready",
    number: row.number,
    titleEn: row.titleEn,
    cardCount: row.cardCount,
  };
}

export async function unlockNextLesson() {
  const profileId = await requireProfileId();

  const next = await getNextLesson();
  if (!next || next.state !== "ready") {
    return { ok: false as const, message: "No lesson is ready yet." };
  }

  const now = new Date();

  /*
    currentLessonSince restamps here, because the three day interval cap
    on the current lesson runs for 14 days from this moment. Forgetting
    it would silently stop the cap applying to the new lesson.
  */
  await db
    .update(settings)
    .set({ currentLesson: next.number, currentLessonSince: now })
    .where(eq(settings.profileId, profileId));

  await db
    .update(lessons)
    .set({ unlockedAt: now })
    .where(and(eq(lessons.number, next.number)));

  revalidatePath("/");
  revalidatePath("/lessons");

  return {
    ok: true as const,
    message: `Lesson ${next.number} is open, ${next.cardCount} cards.`,
  };
}
