/*
  Seeds the numbers trainer's foundation stages.

  Separate from db/seed.ts on purpose. That one owns the book: it walks
  TOTAL_LESSONS, sets unlockedAt from CURRENT_LESSON, and would have to grow a
  set of exceptions to also handle stages that are not book lessons and are not
  gated on the class. Two scripts with one job each beats one with a mode.

  Idempotent. Lessons upsert on number; cards insert on conflict do nothing
  against uniqueIndex(lessonId, arabic), so running it twice does not double
  the deck.

  Run with: npx tsx --env-file=.env.local scripts/seed-numbers-trainer.ts
*/

import { eq } from "drizzle-orm";

import { db } from "../db";
import { cards, lessons } from "../db/schema";
import { NUMBER_STAGES } from "../db/seed-data/numbers-trainer";
import { transliterate } from "../lib/transliterate";

async function main() {
  let insertedCards = 0;
  let skippedCards = 0;

  for (const stage of NUMBER_STAGES) {
    await db
      .insert(lessons)
      .values({
        number: stage.number,
        titleAr: stage.titleAr,
        titleEn: stage.titleEn,
        grammarNote: stage.grammarNote,
        deck: "numbers",
        /*
          Unlocked on sight. The trainer sits outside lesson gating - number
          content is scattered across Book 1 Lesson 20 and Book 2, so gating it
          to currentLesson would leave it half taught for most of the course.
          Its own stage unlocking is what orders it.
        */
        unlockedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: lessons.number,
        set: {
          titleAr: stage.titleAr,
          titleEn: stage.titleEn,
          grammarNote: stage.grammarNote,
          deck: "numbers",
        },
      });

    const [row] = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.number, stage.number));

    if (!row) throw new Error(`stage ${stage.stage} lesson row missing after upsert`);

    for (const item of stage.items) {
      const result = await db
        .insert(cards)
        .values({
          lessonId: row.id,
          type: "vocab",
          arabic: item.arabic,
          english: item.english,
          /* Derived from the vowelled Arabic, like lessons 5 to 23. */
          transliteration: transliterate(item.arabic),
          note: item.note ?? null,
        })
        .onConflictDoNothing()
        .returning({ id: cards.id });

      if (result.length > 0) insertedCards += 1;
      else skippedCards += 1;
    }

    console.log(
      `stage ${stage.stage}  lesson ${stage.number}  ${stage.items.length} items  ${stage.titleEn}`,
    );
  }

  const total = NUMBER_STAGES.reduce((n, s) => n + s.items.length, 0);
  console.log(`\ncards: ${insertedCards} inserted, ${skippedCards} already present`);
  console.log(`foundation items across stages 1 to 3: ${total}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
