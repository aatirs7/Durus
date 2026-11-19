/*
  Seeds the iOS app's Quranic Words track into Neon: one lesson per stage
  (deck "words") and one card per lemma, under the SAME fixed ids the app
  seeds on the device (lessons 1000 and up, cards 100000 + frequency rank),
  so reviews made on a phone sync against rows that already exist.

  The data is db/seed-data/quranic-words.json, copied from DurusIOS
  assets/content/quranic-words.json (stage, ids, face, Quran Foundation
  word-by-word gloss). Glosses are Quran Foundation text, verbatim.

  Separate from db/seed.ts and the numbers trainer seed: one job each.
  Idempotent: lessons and cards upsert on id.

  Run with: npx tsx --env-file=.env.local scripts/seed-quranic-words.ts
*/

import { sql } from "drizzle-orm";

import { db } from "../db";
import { cards, lessons } from "../db/schema";
import content from "../db/seed-data/quranic-words.json";

type Stage = { stage: number; lessonId: number; number: number; titleEn: string };
type Lemma = { cardId: number; stage: number; face: string; gloss: string };

async function main() {
  const stages = content.stages as Stage[];
  const lemmas = content.lemmas as Lemma[];
  const now = new Date();

  for (const st of stages) {
    await db
      .insert(lessons)
      .values({ id: st.lessonId, number: st.number, titleAr: "", titleEn: st.titleEn, grammarNote: null, deck: "words", unlockedAt: now })
      .onConflictDoUpdate({ target: lessons.id, set: { number: st.number, titleEn: st.titleEn, deck: "words" } });
  }

  const lessonOf = new Map(stages.map((s) => [s.stage, s.lessonId]));
  const rows = lemmas.map((l) => ({
    id: l.cardId,
    lessonId: lessonOf.get(l.stage)!,
    type: "vocab" as const,
    arabic: l.face,
    english: l.gloss,
  }));
  for (let i = 0; i < rows.length; i += 100) {
    await db
      .insert(cards)
      .values(rows.slice(i, i + 100))
      .onConflictDoUpdate({
        target: cards.id,
        set: { lessonId: sql`excluded.lesson_id`, arabic: sql`excluded.arabic`, english: sql`excluded.english` },
      });
  }

  /* Explicit ids do not move the serial sequences. That is fine: the book and
     trainer are a few dozen lessons and a few thousand cards, far below 1000
     and 100000, so an ordinary insert cannot reach these ids. */
  console.log(`stages ${stages.length}, cards ${rows.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
