import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardStates, cards, lessons } from "@/db/schema";

export const TOTAL_LESSONS = 23;

/* Interval over 21 days counts as mature, per the stats spec. */
export const MATURE_DAYS = 21;

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

export type Maturity = "unseen" | "learning" | "mature";

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

export function maturityOf(intervalDays: number | null): Maturity {
  if (intervalDays === null) return "unseen";
  return intervalDays > MATURE_DAYS ? "mature" : "learning";
}

export const MATURITY_COLOR: Record<Maturity, string> = {
  unseen: "var(--rule)",
  learning: "var(--saffron)",
  mature: "var(--verdigris)",
};
