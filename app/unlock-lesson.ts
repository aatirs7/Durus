"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cards, lessons, settings } from "@/db/schema";

/*
  Vocabulary lives in the repository, seeded lesson by lesson as class
  covers them. Every seeded card is in the database from the start, but
  the queue only ever draws from lessons up to settings.currentLesson,
  so nothing from a lesson that has not been taught can appear.

  Advancing the gate is therefore the only thing this has to do.
*/

export type NextLesson = {
  number: number;
  titleEn: string;
  cardCount: number;
} | null;

/*
  The next lesson, but only once its cards have actually been seeded.
  Offering to unlock an empty lesson would just produce a silent
  no-change, which reads as a broken button.
*/
export async function getNextLesson(): Promise<NextLesson> {
  const [config] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!config) throw new Error("settings row is missing, run the seed");

  const [row] = await db
    .select({
      number: lessons.number,
      titleEn: lessons.titleEn,
      cardCount: sql<number>`count(${cards.id})::int`,
    })
    .from(lessons)
    .leftJoin(cards, eq(cards.lessonId, lessons.id))
    .where(gt(lessons.number, config.currentLesson))
    .groupBy(lessons.number, lessons.titleEn)
    .orderBy(lessons.number)
    .limit(1);

  if (!row || row.cardCount === 0) return null;
  return row;
}

export async function unlockNextLesson() {
  const [config] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!config) throw new Error("settings row is missing, run the seed");

  const next = await getNextLesson();
  if (!next) return { ok: false as const, message: "No lesson is ready yet." };

  const now = new Date();

  /*
    currentLessonSince restamps here, because the three day interval cap
    on the current lesson runs for 14 days from this moment. Forgetting
    it would silently stop the cap applying to the new lesson.
  */
  await db
    .update(settings)
    .set({ currentLesson: next.number, currentLessonSince: now })
    .where(eq(settings.id, 1));

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
