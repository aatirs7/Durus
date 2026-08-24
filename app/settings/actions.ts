"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  cardStates,
  cards,
  lessons,
  reviews,
  settings,
} from "@/db/schema";

export type SettingsPatch = Partial<{
  currentLesson: number;
  newPerDay: number;
  maxReviews: number;
  showHarakat: boolean;
  speedWindowMs: number;
  remindersOn: boolean;
  reminderHour: number;
  classDayReminder: boolean;
}>;

export async function updateSettings(patch: SettingsPatch) {
  const [current] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!current) throw new Error("settings row is missing, run the seed");

  /*
    The three day cap on the current lesson runs for 14 days from the
    moment the lesson becomes current, so moving the lesson has to
    restamp the clock. Getting this wrong silently disables the cap.
  */
  const movedLesson =
    patch.currentLesson !== undefined &&
    patch.currentLesson !== current.currentLesson;

  await db
    .update(settings)
    .set({
      ...patch,
      ...(movedLesson ? { currentLessonSince: new Date() } : {}),
    })
    .where(eq(settings.id, 1));

  // Unlock the lesson if it has not been opened before.
  if (movedLesson && patch.currentLesson !== undefined) {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.number, patch.currentLesson));
    if (lesson && lesson.unlockedAt === null) {
      await db
        .update(lessons)
        .set({ unlockedAt: new Date() })
        .where(eq(lessons.id, lesson.id));
    }
  }

  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true as const };
}

/* Everything, as one JSON blob. No filtering, no pagination. */
export async function exportAll() {
  const [config] = await db.select().from(settings).where(eq(settings.id, 1));

  return {
    exportedAt: new Date().toISOString(),
    settings: config,
    lessons: await db.select().from(lessons),
    cards: await db.select().from(cards),
    cardStates: await db.select().from(cardStates),
    reviews: await db.select().from(reviews),
  };
}
