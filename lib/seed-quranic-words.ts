import { sql } from "drizzle-orm";

import { db } from "@/db";
import { cards, lessons } from "@/db/schema";
import content from "@/db/seed-data/quranic-words.json";

/*
  The iOS app's Quranic Words track, seeded into Neon under the SAME fixed ids
  the app seeds on the device (lessons 1000 and up, cards 100000 + frequency
  rank), so reviews made on a phone sync against rows that already exist.
  Data: db/seed-data/quranic-words.json, copied from DurusIOS. Glosses are
  Quran Foundation word-by-word text, verbatim.

  Idempotent: the enum value is added only if missing, lessons and cards
  upsert on id. Explicit ids do not move the serial sequences, which is fine:
  the book and trainer are far below 1000 lessons and 100000 cards.
*/

type Stage = { stage: number; lessonId: number; number: number; titleEn: string };
type Lemma = { cardId: number; stage: number; face: string; gloss: string };

export async function seedQuranicWords(): Promise<{ stages: number; cards: number }> {
  await db.execute(sql`ALTER TYPE "public"."deck" ADD VALUE IF NOT EXISTS 'words'`);

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
  const rows = lemmas.map((l) => ({ id: l.cardId, lessonId: lessonOf.get(l.stage)!, type: "vocab" as const, arabic: l.face, english: l.gloss }));
  for (let i = 0; i < rows.length; i += 100) {
    await db
      .insert(cards)
      .values(rows.slice(i, i + 100))
      .onConflictDoUpdate({
        target: cards.id,
        set: { lessonId: sql`excluded.lesson_id`, arabic: sql`excluded.arabic`, english: sql`excluded.english` },
      });
  }
  return { stages: stages.length, cards: rows.length };
}
