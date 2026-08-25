import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardStates, cards, reviews } from "@/db/schema";
import { MATURE_DAYS } from "./lessons";

export type Stats = {
  medianMs: number | null;
  bestMs: number | null;
  perDay: { day: string; count: number }[];
  maturity: { unseen: number; learning: number; mature: number };
  leeches: {
    cardId: number;
    arabic: string;
    english: string;
    lapses: number;
    suspended: boolean;
  }[];
};

/*
  Every query here takes profileId, and every one of them filters on it.

  It used to take none and filter on none. That was invisible while a
  browser session could only ever be one profile, and it stops being
  invisible the moment two accounts exist - which is now, because sign-in
  is Clerk and one database serves the web and the phone. Two people
  would have seen each other's medians, each other's day counts and each
  other's leeches.

  Retracted reviews are excluded everywhere they are counted. An undo is
  a tombstone rather than a delete, so without the filter the stats keep
  counting answers the user explicitly took back.
*/
export async function getStats(profileId: number): Promise<Stats> {
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const since7 = new Date(Date.now() - 7 * 86_400_000);

  // Current median recognition time, over the last 7 days.
  const [current] = await db
    .select({
      median: sql<
        number | null
      >`percentile_cont(0.5) within group (order by ${reviews.msToAnswer})`,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.profileId, profileId),
        eq(reviews.direction, "recognition"),
        gte(reviews.reviewedAt, since7),
        isNull(reviews.retractedAt),
      ),
    );

  /*
    The 30 day best is the best single day median, not the best single
    answer. One lucky fast card is not a personal best.
  */
  const [best] = await db
    .select({
      best: sql<number | null>`min(day_median)`,
    })
    .from(
      db
        .select({
          dayMedian: sql<number>`percentile_cont(0.5) within group (order by ${reviews.msToAnswer})`.as(
            "day_median",
          ),
        })
        .from(reviews)
        .where(
          and(
            eq(reviews.profileId, profileId),
            eq(reviews.direction, "recognition"),
            gte(reviews.reviewedAt, since30),
            isNull(reviews.retractedAt),
          ),
        )
        .groupBy(sql`date_trunc('day', ${reviews.reviewedAt})`)
        .as("daily"),
    );

  const perDayRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${reviews.reviewedAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.profileId, profileId),
        gte(reviews.reviewedAt, since30),
        isNull(reviews.retractedAt),
      ),
    )
    .groupBy(sql`date_trunc('day', ${reviews.reviewedAt})`)
    .orderBy(sql`date_trunc('day', ${reviews.reviewedAt})`);

  const [maturityRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      learning: sql<number>`count(${cardStates.cardId}) filter (where ${cardStates.intervalDays} <= ${MATURE_DAYS})::int`,
      mature: sql<number>`count(${cardStates.cardId}) filter (where ${cardStates.intervalDays} > ${MATURE_DAYS})::int`,
    })
    .from(cards)
    .leftJoin(
      cardStates,
      and(
        eq(cardStates.cardId, cards.id),
        eq(cardStates.direction, "recognition"),
        eq(cardStates.profileId, profileId),
      ),
    );

  const leeches = await db
    .select({
      cardId: cards.id,
      arabic: cards.arabic,
      english: cards.english,
      lapses: cardStates.lapses,
      suspended: cardStates.suspended,
    })
    .from(cardStates)
    .innerJoin(cards, eq(cardStates.cardId, cards.id))
    .where(
      and(
        eq(cardStates.profileId, profileId),
        eq(cardStates.direction, "recognition"),
        gte(cardStates.lapses, 1),
      ),
    )
    .orderBy(desc(cardStates.lapses))
    .limit(5);

  const total = maturityRow?.total ?? 0;
  const learning = maturityRow?.learning ?? 0;
  const mature = maturityRow?.mature ?? 0;

  return {
    medianMs: current?.median ?? null,
    bestMs: best?.best ?? null,
    perDay: perDayRows,
    maturity: {
      unseen: Math.max(0, total - learning - mature),
      learning,
      mature,
    },
    leeches,
  };
}

/* Fills in the days with no reviews, so the sparkline has a real shape. */
export function fillDays(
  rows: { day: string; count: number }[],
  days = 30,
): number[] {
  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86_400_000);
    out.push(byDay.get(d.toISOString().slice(0, 10)) ?? 0);
  }
  return out;
}
