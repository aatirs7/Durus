/*
  Writes db/seed-data/lessons-5-23.ts from the transcribed markdown.

  Two things happen here that are not a straight copy:

    the sixth field   the markdown is five fields wide and the parser reads six,
                      with the transliteration THIRD. An empty column in the
                      wrong place would silently shift gender, plural and note.

    the reading       every card gets a transliteration derived from its own
                      fully vowelled Arabic, by lib/transliterate.ts, which is
                      checked against the hand written ones in lessons 1 to 4.

  Run with: npx tsx scripts/emit-lessons-5-23.ts <path-to-md>
*/

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCards } from "../lib/parse-cards";
import { transliterate } from "../lib/transliterate";

const source = process.argv[2];
if (!source) {
  console.error("usage: npx tsx scripts/emit-lessons-5-23.ts <path-to-md>");
  process.exit(1);
}

const md = readFileSync(source, "utf8");

type Lesson = { number: number; grammar: string[]; lines: string[] };
const lessons = new Map<number, Lesson>();

let current = 0;
let inBlock = false;
let collectingGrammar = false;

for (const raw of md.split(/\r?\n/)) {
  const line = raw.trim();

  const heading = line.match(/^##\s+Lesson\s+(\d+)/i);
  if (heading) {
    current = Number(heading[1]);
    if (!lessons.has(current)) lessons.set(current, { number: current, grammar: [], lines: [] });
    collectingGrammar = false;
    continue;
  }

  if (line.startsWith("```")) {
    inBlock = !inBlock;
    collectingGrammar = false;
    continue;
  }

  if (!inBlock) {
    if (/^Grammar:/i.test(line)) {
      collectingGrammar = true;
      lessons.get(current)?.grammar.push(line.replace(/^Grammar:\s*/i, ""));
      continue;
    }
    if (collectingGrammar && line && !line.startsWith("#") && !line.startsWith("---")) {
      lessons.get(current)?.grammar.push(line);
      continue;
    }
    collectingGrammar = false;
    continue;
  }

  if (!line || !line.includes("|")) continue;

  const f = line.split("|").map((x) => x.trim());
  const [arabic = "", english = "", third = "", fourth = "", fifth = ""] = f;

  const fields = [arabic, english, transliterate(arabic), third, fourth, fifth];
  /* Trailing empties are dropped so the file reads like the one a person wrote. */
  while (fields.length > 2 && fields[fields.length - 1] === "") fields.pop();

  lessons.get(current)?.lines.push(fields.join(" | "));
}

const ordered = [...lessons.values()].sort((a, b) => a.number - b.number);

/* Every block goes through the real parser before it is written. A seed that
   does not parse stops the whole seed run, and finding that out here is much
   cheaper than finding it out against the database. */
let bad = 0;
for (const l of ordered) {
  const { errors } = parseCards(l.lines.join("\n"));
  for (const e of errors) {
    bad += 1;
    console.error(`lesson ${l.number}: ${e.message}`);
  }
}
if (bad > 0) {
  console.error(`\n${bad} bad lines, nothing written`);
  process.exit(1);
}

const body = ordered
  .map((l) => {
    const note = l.grammar.join(" ").replace(/\s+/g, " ").trim();
    return `  {
    number: ${l.number},
    grammarNote: ${JSON.stringify(note)},
    block: \`
${l.lines.join("\n")}
\`,
  },`;
  })
  .join("\n");

const file = `import type { SeedLesson } from "./lessons-1-4";

/*
  Lessons 5 to 23, completing Book 1. GENERATED - see
  scripts/emit-lessons-5-23.ts, and edit the markdown rather than this file.

  Transcribed from the English Key to Durus al-lughat al-arabiyyah Part 1, and
  transcribed from a SCAN, which is worth knowing before trusting a harakah.
  What has been checked mechanically: every card parses, every Arabic field is
  Arabic and carries harakat, no stacked marks, tanwin only where a word ends.
  What has NOT been checked is whether any individual vowel matches the printed
  page - that needs eyes on the book.

  The transliterations are derived from the vowelled Arabic by
  lib/transliterate.ts rather than typed. That is only sound because the source
  is fully vowelled: the reading is determined by the text. The generator is
  measured against the hand written transliterations in lessons 1 to 4, which
  are the spec, in lib/transliterate.test.ts.

  Lesson 4 appears here with an EMPTY grammar note and extra cards. Those are
  the Key's "Lesson 4a", folded in because the app has exactly 23 lessons. The
  empty note is deliberate and db/seed.ts ignores empty notes when it builds
  its map, so lesson 4 keeps the note it already has.
*/
export const SEED_LESSONS_5_23: SeedLesson[] = [
${body}
];
`;

const out = join(__dirname, "..", "db", "seed-data", "lessons-5-23.ts");
writeFileSync(out, file, "utf8");

const total = ordered.reduce((n, l) => n + l.lines.length, 0);
console.log(`wrote ${out}`);
console.log(`lessons ${ordered[0].number} to ${ordered[ordered.length - 1].number}, ${total} cards`);
