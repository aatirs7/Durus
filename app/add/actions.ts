"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cardStates, cards, lessons } from "@/db/schema";
import { parseCards } from "@/lib/parse-cards";

export type AddResult = {
  ok: boolean;
  message: string;
};

export async function addCards(
  lessonNumber: number,
  text: string,
): Promise<AddResult> {
  const { cards: parsed, errors } = parseCards(text);

  if (errors.length > 0) {
    return {
      ok: false,
      message: "Fix the flagged lines first, nothing was added.",
    };
  }

  if (parsed.length === 0) {
    return { ok: false, message: "There is nothing to add." };
  }

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.number, lessonNumber));

  if (!lesson) {
    return { ok: false, message: `Lesson ${lessonNumber} does not exist.` };
  }

  const now = new Date();
  let inserted = 0;
  let duplicates = 0;

  for (const card of parsed) {
    const rows = await db
      .insert(cards)
      .values({
        lessonId: lesson.id,
        type: card.type,
        arabic: card.arabic,
        english: card.english,
        gender: card.gender,
        plural: card.plural,
        note: card.note,
      })
      .onConflictDoNothing()
      .returning({ id: cards.id });

    if (rows.length === 0) {
      duplicates += 1;
      continue;
    }

    // Recognition is seeded active and due now. Production appears later,
    // once recognition reaches repetitions >= 2.
    await db
      .insert(cardStates)
      .values({ cardId: rows[0].id, direction: "recognition", dueAt: now })
      .onConflictDoNothing();

    inserted += 1;
  }

  if (lesson.unlockedAt === null) {
    await db
      .update(lessons)
      .set({ unlockedAt: now })
      .where(eq(lessons.id, lesson.id));
  }

  revalidatePath("/");

  const dupNote =
    duplicates > 0
      ? `, ${duplicates} already in lesson ${lessonNumber}`
      : "";

  return {
    ok: true,
    message: `Added ${inserted} to lesson ${lessonNumber}${dupNote}.`,
  };
}
