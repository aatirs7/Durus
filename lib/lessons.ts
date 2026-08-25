import { and, asc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardStates, cards, lessons } from "@/db/schema";
import { MATURE_DAYS, maturityOf, type Maturity } from "./constants";
import { requireProfileId } from "./session";

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
  const profileId = await requireProfileId();
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
        eq(cardStates.profileId, profileId),
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


export type StudyCard = {
  id: number;
  arabic: string;
  english: string;
  transliteration: string | null;
  type: "vocab" | "phrase";
  gender: "m" | "f" | null;
  plural: string | null;
  note: string | null;
  lessonNumber: number;
};

/*
  Cards to page through, in book order.

  Deliberately not the review queue. This is first exposure, before a
  word has any schedule attached, so it draws every card in the lessons
  that are open rather than only what happens to be due.
*/
export async function getStudyDeck(
  currentLesson: number,
  lessonNumber?: number,
): Promise<StudyCard[]> {
  const rows = await db
    .select({
      id: cards.id,
      arabic: cards.arabic,
      english: cards.english,
      transliteration: cards.transliteration,
      type: cards.type,
      gender: cards.gender,
      plural: cards.plural,
      note: cards.note,
      lessonNumber: lessons.number,
    })
    .from(cards)
    .innerJoin(lessons, eq(cards.lessonId, lessons.id))
    .where(
      lessonNumber
        ? eq(lessons.number, lessonNumber)
        : lte(lessons.number, currentLesson),
    )
    .orderBy(asc(lessons.number), asc(cards.id));

  return rows;
}
