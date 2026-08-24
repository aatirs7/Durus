"use server";

import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, lessons } from "@/db/schema";
import { getSettingsFor, requireProfileId } from "@/lib/session";
import { buildCaseQuestion, type CaseQuestion } from "@/lib/case-drill";
import { CASE_RUN_LENGTH } from "@/lib/speed";

/*
  Draws from phrase cards in lessons up to the current one. Lesson 4 is
  where case first appears, and almost every lesson after adds another
  case context, so this widens on its own as the course goes.
*/
export async function getCaseQuestions(): Promise<CaseQuestion[]> {
  const config = await getSettingsFor(await requireProfileId());

  const rows = await db
    .select({
      id: cards.id,
      arabic: cards.arabic,
      english: cards.english,
    })
    .from(cards)
    .innerJoin(lessons, eq(cards.lessonId, lessons.id))
    .where(
      and(eq(cards.type, "phrase"), lte(lessons.number, config.currentLesson)),
    )
    .orderBy(sql`random()`)
    .limit(CASE_RUN_LENGTH * 3);

  const questions: CaseQuestion[] = [];
  for (const row of rows) {
    const q = buildCaseQuestion(row);
    if (q) questions.push(q);
    if (questions.length >= CASE_RUN_LENGTH) break;
  }

  return questions;
}
