/*
  Idempotent. Safe to run more than once.

  Run with: npm run db:seed
*/

import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { cards, lessons } from "./schema";
import { LESSON_TITLES, SEED_LESSONS } from "./seed-data/lessons-1-4";
import { SEED_LESSONS_5_23 } from "./seed-data/lessons-5-23";
import { parseCards } from "../lib/parse-cards";

const TOTAL_LESSONS = 23;
/*
  Which lesson the gate starts at. Cards for every lesson in the seed
  data are inserted regardless, because the queue only ever draws from
  lessons up to settings.currentLesson. Lessons past the gate sit in the
  database, seeded and waiting, until Add Lesson N is tapped on Today.
*/
const CURRENT_LESSON = 2;

async function main() {
  const now = new Date();

  /*
    Every lesson's cards, in one list.

    Lesson 4 appears TWICE: once in lessons-1-4 with its note, and again in
    lessons-5-23 carrying the Key's "Lesson 4a" cards with an empty note. Both
    insert into the same lesson, which is what is wanted - the cards are keyed
    on (lessonId, arabic) and the second pass simply adds the ones the first
    did not have.
  */
  const allLessons = [...SEED_LESSONS, ...SEED_LESSONS_5_23];

  /*
    Empty notes are SKIPPED rather than stored.

    Built as a plain Map from every entry, the second lesson 4 would overwrite
    the first one's note with "" - a lesson losing its grammar because more
    vocabulary was added to it.
  */
  const grammarNotes = new Map<number, string>();
  for (const l of allLessons) {
    if (l.grammarNote.trim()) grammarNotes.set(l.number, l.grammarNote);
  }

  for (let number = 1; number <= TOTAL_LESSONS; number += 1) {
    const title = LESSON_TITLES[number - 1];
    await db
      .insert(lessons)
      .values({
        number,
        titleAr: title.ar,
        titleEn: title.en,
        grammarNote: grammarNotes.get(number) ?? null,
        unlockedAt: number <= CURRENT_LESSON ? now : null,
      })
      .onConflictDoUpdate({
        target: lessons.number,
        set: {
          titleAr: title.ar,
          titleEn: title.en,
          grammarNote: grammarNotes.get(number) ?? null,
        },
      });
  }
  console.log(`lessons: ${TOTAL_LESSONS} rows present`);

  const lessonRows = await db.select().from(lessons);
  const lessonIdByNumber = new Map(lessonRows.map((l) => [l.number, l.id]));

  let inserted = 0;
  let skipped = 0;

  for (const seed of allLessons) {
    const lessonId = lessonIdByNumber.get(seed.number);
    if (!lessonId) throw new Error(`lesson ${seed.number} is missing`);

    const { cards: parsed, errors } = parseCards(seed.block);
    if (errors.length > 0) {
      // The seed uses the same parser as /add, so a parse error here is a
      // real problem with the data and should stop the run.
      for (const e of errors) console.error(`lesson ${seed.number}: ${e.message}`);
      throw new Error(`lesson ${seed.number} has ${errors.length} bad lines`);
    }

    for (const card of parsed) {
      if (card.warning) console.warn(`lesson ${seed.number}: ${card.warning}`);

      const rows = await db
        .insert(cards)
        .values({
          lessonId,
          type: card.type,
          arabic: card.arabic,
          english: card.english,
          transliteration: card.transliteration,
          gender: card.gender,
          plural: card.plural,
          note: card.note,
        })
        .onConflictDoNothing()
        .returning({ id: cards.id });

      if (rows.length === 0) {
        skipped += 1;
        continue;
      }

      /*
        No cardStates row is created here on purpose. A card with no
        state is what the queue treats as new, so seeded words flow in
        at newPerDay rather than all landing as due on day one.
      */
      inserted += 1;
    }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cards);

  console.log(`cards: ${inserted} inserted, ${skipped} already present`);
  console.log(`cards total: ${count}`);

  const [current] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.number, CURRENT_LESSON));
  console.log(`current lesson: ${current.number} ${current.titleEn}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
