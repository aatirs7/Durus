import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardStates, cards, lessons } from "@/db/schema";
import { MATURE_DAYS, maturityOf, type Maturity } from "./constants";

/*
  Re-exported so existing server side callers keep working. A client
  component must import these from lib/constants directly, because this
  module pulls in the Neon client.
*/
export {
  TOTAL_LESSONS,
  MATURE_DAYS,
  MATURITY_COLOR,
  maturityOf,
  type Maturity,
} from "./constants";

export type LessonRow = {
  number: number;
  titleAr: string;
  titleEn: string;
  cardCount: number;
};

export async function listLessons(): Promise<LessonRow[]> {
  const rows = await db
    .select({
      number: lessons.number,
      titleAr: lessons.titleAr,
      titleEn: lessons.titleEn,
      cardCount: sql<number>`count(${cards.id})::int`,
    })
    .from(lessons)
    .leftJoin(cards, eq(cards.lessonId, lessons.id))
    .groupBy(lessons.number, lessons.titleAr, lessons.titleEn)
    .orderBy(asc(lessons.number));

  return rows;
}

export type LessonCard = {
  id: number;
  arabic: string;
  english: string;
  type: "vocab" | "phrase";
  gender: "m" | "f" | null;
  plural: string | null;
  note: string | null;
  maturity: Maturity;
};

export async function getLesson(number: number) {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.number, number));
  if (!lesson) return null;

  const rows = await db
    .select({
      id: cards.id,
      arabic: cards.arabic,
      english: cards.english,
      type: cards.type,
      gender: cards.gender,
      plural: cards.plural,
      note: cards.note,
      intervalDays: cardStates.intervalDays,
    })
    .from(cards)
    .leftJoin(
      cardStates,
      and(
        eq(cardStates.cardId, cards.id),
        eq(cardStates.direction, "recognition"),
      ),
    )
    .where(eq(cards.lessonId, lesson.id))
    .orderBy(asc(cards.id));

  const items: LessonCard[] = rows.map((r) => ({
    id: r.id,
    arabic: r.arabic,
    english: r.english,
    type: r.type,
    gender: r.gender,
    plural: r.plural,
    note: r.note,
    maturity: maturityOf(r.intervalDays),
  }));

  return { lesson, cards: items };
}

