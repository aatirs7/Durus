import { and, asc, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cardStates, cards, lessons } from "@/db/schema";
import { tilesFor, type Tile } from "./letters";
import { modeFor, type Mode } from "./modes";
import { getSettingsFor, requireProfileId } from "./session";

export type QueueItem = {
  cardId: number;
  direction: "recognition" | "production";
  lessonNumber: number;
  arabic: string;
  english: string;
  transliteration: string | null;
  type: "vocab" | "phrase";
  gender: "m" | "f" | null;
  plural: string | null;
  note: string | null;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  isNew: boolean;
};

/*
  Everything the session needs to ask one question, assembled on the
  server so the client never has to fetch mid drill. Distractors come
  from the same lessons, so a wrong option is always a word that could
  plausibly have been the answer.
*/
export type Question = QueueItem & {
  mode: Mode;
  /* Four options for choice mode, already shuffled, one of them right.
     Empty for the other modes. */
  options: { arabic: string; english: string }[];
  /* Shuffled letters for assemble mode. Empty otherwise. */
  tiles: Tile[];
};

/* Settings for whoever is signed in. */
export async function getSettings() {
  return getSettingsFor(await requireProfileId());
}

/* Shuffle within a bucket. Never across buckets. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function countDue(now = new Date()): Promise<number> {
  const profileId = await requireProfileId();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cardStates)
    .where(
      and(
        eq(cardStates.profileId, profileId),
        lte(cardStates.dueAt, now),
        eq(cardStates.suspended, false),
      ),
    );
  return row?.count ?? 0;
}

export async function countNewAvailable(currentLesson: number): Promise<number> {
  const profileId = await requireProfileId();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cards)
    .innerJoin(lessons, eq(cards.lessonId, lessons.id))
    .leftJoin(
      cardStates,
      and(
        eq(cardStates.cardId, cards.id),
        eq(cardStates.direction, "recognition"),
        eq(cardStates.profileId, profileId),
      ),
    )
    .where(and(lte(lessons.number, currentLesson), isNull(cardStates.cardId)));
  return row?.count ?? 0;
}

/*
  Bucket order, per the spec:
    1. lapsed cards from earlier this session, handled in the client
    2. cards where dueAt <= now, oldest first, capped at maxReviews
    3. new cards from lessons 1..currentLesson with no state row,
       capped at newPerDay

  The relearn bucket lives in the session component rather than here,
  because "earlier this session" is not a database fact.
*/
export async function buildQueue(
  options: { lessonNumber?: number; now?: Date } = {},
): Promise<QueueItem[]> {
  const now = options.now ?? new Date();
  const profileId = await requireProfileId();
  const config = await getSettingsFor(profileId);

  const lessonFilter = options.lessonNumber
    ? eq(lessons.number, options.lessonNumber)
    : lte(lessons.number, config.currentLesson);

  const dueRows = await db
    .select({
      cardId: cards.id,
      direction: cardStates.direction,
      lessonNumber: lessons.number,
      arabic: cards.arabic,
      english: cards.english,
      transliteration: cards.transliteration,
      type: cards.type,
      gender: cards.gender,
      plural: cards.plural,
      note: cards.note,
      ease: cardStates.ease,
      intervalDays: cardStates.intervalDays,
      repetitions: cardStates.repetitions,
      lapses: cardStates.lapses,
      dueAt: cardStates.dueAt,
    })
    .from(cardStates)
    .innerJoin(cards, eq(cardStates.cardId, cards.id))
    .innerJoin(lessons, eq(cards.lessonId, lessons.id))
    .where(
      and(
        eq(cardStates.profileId, profileId),
        lte(cardStates.dueAt, now),
        eq(cardStates.suspended, false),
        lessonFilter,
      ),
    )
    .orderBy(asc(cardStates.dueAt))
    .limit(config.maxReviews);

  const newRows = await db
    .select({
      cardId: cards.id,
      lessonNumber: lessons.number,
      arabic: cards.arabic,
      english: cards.english,
      transliteration: cards.transliteration,
      type: cards.type,
      gender: cards.gender,
      plural: cards.plural,
      note: cards.note,
    })
    .from(cards)
    .innerJoin(lessons, eq(cards.lessonId, lessons.id))
    .leftJoin(
      cardStates,
      and(
        eq(cardStates.cardId, cards.id),
        eq(cardStates.direction, "recognition"),
        eq(cardStates.profileId, profileId),
      ),
    )
    .where(and(lessonFilter, isNull(cardStates.cardId)))
    .orderBy(asc(cards.id))
    .limit(config.newPerDay);

  const due: QueueItem[] = dueRows.map((r) => ({
    cardId: r.cardId,
    direction: r.direction,
    lessonNumber: r.lessonNumber,
    arabic: r.arabic,
    english: r.english,
    transliteration: r.transliteration,
    type: r.type,
    gender: r.gender,
    plural: r.plural,
    note: r.note,
    ease: r.ease,
    intervalDays: r.intervalDays,
    repetitions: r.repetitions,
    lapses: r.lapses,
    isNew: false,
  }));

  const fresh: QueueItem[] = newRows.map((r) => ({
    cardId: r.cardId,
    direction: "recognition" as const,
    lessonNumber: r.lessonNumber,
    arabic: r.arabic,
    english: r.english,
    transliteration: r.transliteration,
    type: r.type,
    gender: r.gender,
    plural: r.plural,
    note: r.note,
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    isNew: true,
  }));

  return [...shuffle(due), ...shuffle(fresh)];
}

/*
  Turns a queue into questions. One extra read for the distractor pool,
  rather than one per card.
*/
export async function buildQuestions(
  queue: QueueItem[],
  lessonNumbers: number[],
): Promise<Question[]> {
  if (queue.length === 0) return [];

  const pool = await db
    .select({ arabic: cards.arabic, english: cards.english, type: cards.type })
    .from(cards)
    .innerJoin(lessons, eq(cards.lessonId, lessons.id))
    .where(inArray(lessons.number, lessonNumbers));

  return queue.map((item) => {
    const mode = modeFor(
      { type: item.type, repetitions: item.repetitions },
      item.direction,
    );

    if (mode === "assemble") {
      return { ...item, mode, options: [], tiles: tilesFor(item.arabic) };
    }

    if (mode !== "choice") return { ...item, mode, options: [], tiles: [] };

    /*
      Distractors match the card's own type. Offering a single word
      against three full sentences gives the answer away by shape alone.
    */
    const candidates = pool.filter(
      (c) => c.type === item.type && c.english !== item.english,
    );

    const picked: typeof candidates = [];
    const seen = new Set<string>();
    for (const c of shuffle(candidates)) {
      if (seen.has(c.english)) continue;
      seen.add(c.english);
      picked.push(c);
      if (picked.length === 3) break;
    }

    const options = shuffle([
      { arabic: item.arabic, english: item.english },
      ...picked.map((c) => ({ arabic: c.arabic, english: c.english })),
    ]);

    return { ...item, mode, options, tiles: [] };
  });
}
