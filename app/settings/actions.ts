"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cardStates, cards, lessons, reviews, settings } from "@/db/schema";
import { getSettingsFor, requireProfileId } from "@/lib/session";

export type SettingsPatch = Partial<{
  currentLesson: number;
  newPerDay: number;
  maxReviews: number;
  showHarakat: boolean;
  speedWindowMs: number;
  remindersOn: boolean;
  reminderHour: number;
  secondReminderOn: boolean;
  reminderHour2: number;
  classDayReminder: boolean;
}>;

export async function updateSettings(patch: SettingsPatch) {
  const profileId = await requireProfileId();
  const current = await getSettingsFor(profileId);

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
    .where(eq(settings.profileId, profileId));

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
/* Only this account's progress. Lessons and cards are shared. */
export async function exportAll() {
  const profileId = await requireProfileId();

  return {
    exportedAt: new Date().toISOString(),
    settings: await getSettingsFor(profileId),
    lessons: await db.select().from(lessons),
    cards: await db.select().from(cards),
    cardStates: await db
      .select()
      .from(cardStates)
      .where(eq(cardStates.profileId, profileId)),
    reviews: await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.profileId, profileId), isNull(reviews.retractedAt))),
  };
}
