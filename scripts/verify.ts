/*
  End to end check against the real database. Not a test suite, a
  scratch verifier for the things unit tests cannot see.

  Run with: npx tsx --env-file=.env.local scripts/verify.ts
*/

import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { cardStates, cards, lessons, reviews } from "../db/schema";
import { submitGrade } from "../app/review/actions";

async function main() {
  const [card] = await db
    .select({ id: cards.id, arabic: cards.arabic, lesson: lessons.number })
    .from(cards)
    .innerJoin(lessons, eq(cards.lessonId, lessons.id))
    .where(eq(lessons.number, 1))
    .limit(1);

  console.log(`using card ${card.id} from lesson ${card.lesson}`);

  const before = await db
    .select()
    .from(cardStates)
    .where(eq(cardStates.cardId, card.id));
  console.log("states before:", before.map((s) => s.direction).join(", "));

  // Two good grades take recognition to repetitions 2, which is the
  // trigger for the lazy production row.
  await submitGrade({
    cardId: card.id,
    direction: "recognition",
    grade: "good",
    msToAnswer: 1200,
  });
  await submitGrade({
    cardId: card.id,
    direction: "recognition",
    grade: "good",
    msToAnswer: 900,
  });

  const after = await db
    .select()
    .from(cardStates)
    .where(eq(cardStates.cardId, card.id));

  for (const s of after) {
    console.log(
      `  ${s.direction}: reps=${s.repetitions} interval=${s.intervalDays.toFixed(2)}d ease=${s.ease} due=${s.dueAt.toISOString()}`,
    );
  }

  const hasProduction = after.some((s) => s.direction === "production");
  console.log(
    hasProduction
      ? "PASS: production row created at repetitions >= 2"
      : "FAIL: production row missing",
  );

  const rec = after.find((s) => s.direction === "recognition");
  const capped = rec ? rec.intervalDays <= 3.0001 : false;
  console.log(
    card.lesson === 4
      ? `lesson 4 is current, cap applies: ${capped}`
      : `lesson ${card.lesson} is not current, no cap expected`,
  );

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.cardId, card.id));
  console.log(`reviews logged for this card: ${count}`);

  const [{ dueNow }] = await db
    .select({ dueNow: sql<number>`count(*)::int` })
    .from(cardStates)
    .where(
      and(
        sql`${cardStates.dueAt} <= now()`,
        eq(cardStates.suspended, false),
      ),
    );
  console.log(`due right now across the deck: ${dueNow}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
