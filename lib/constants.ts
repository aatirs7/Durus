/*
  Pure values with no database import, so a client component can reach
  them without dragging the Neon client into the browser bundle.

  This is not a style preference. db/index.ts throws at module scope
  when DATABASE_URL is missing, which it always is in a browser, so a
  single value imported from a db backed module takes the whole page
  down at hydration with an error that names the wrong culprit.

  Anything a "use client" file needs belongs here, not in lib/lessons.
*/

export const TOTAL_LESSONS = 23;

/* Interval over 21 days counts as mature, per the stats spec. */
export const MATURE_DAYS = 21;

export type Maturity = "unseen" | "learning" | "mature";

export const MATURITY_COLOR: Record<Maturity, string> = {
  unseen: "var(--rule)",
  learning: "var(--saffron)",
  mature: "var(--verdigris)",
};

export function maturityOf(intervalDays: number | null): Maturity {
  if (intervalDays === null) return "unseen";
  return intervalDays > MATURE_DAYS ? "mature" : "learning";
}
