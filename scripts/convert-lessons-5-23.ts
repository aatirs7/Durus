/*
  Turns the lessons 5 to 23 markdown into the seed's own block format, and
  checks it before anybody trusts it.

  The markdown is written five fields wide:

      arabic | english | gender or phrase | plural | note

  and lib/parse-cards.ts reads six, with the transliteration THIRD:

      arabic | english | transliteration | gender or phrase | plural | note

  Fed in as-is every card would take "m" as its transliteration and shift the
  gender, plural and note along by one - and it would do that silently, because
  every field is optional and none of them would fail validation. So the
  conversion is the point of this script, and the checks below are what stop it
  being trusted without evidence.

  Run with: npx tsx scripts/convert-lessons-5-23.ts <path-to-md>

  Writes nothing. It prints the converted blocks and a report; inserting is a
  separate, deliberate step.
*/

import { readFileSync } from "node:fs";
import { parseCards } from "../lib/parse-cards";

const source = process.argv[2];
if (!source) {
  console.error("usage: npx tsx scripts/convert-lessons-5-23.ts <path-to-md>");
  process.exit(1);
}

const md = readFileSync(source, "utf8");

/* Harakat and the letters they may sit on. Used by the checks, not the
   conversion - the conversion is purely structural. */
const HARAKAH = /[ً-ْٰ]/;
const TANWIN = /[ً-ٍ]/;
const ARABIC_LETTER = /[ء-غف-ي]/;
const LATIN = /[A-Za-z]/;

type Card = { line: number; lesson: number; raw: string; converted: string };

const cards: Card[] = [];
const lessons = new Map<number, { grammar: string[]; blocks: string[] }>();

let lesson = 0;
let inBlock = false;
let collectingGrammar = false;

md.split(/\r?\n/).forEach((raw, i) => {
  const line = raw.trim();

  const heading = line.match(/^##\s+Lesson\s+(\d+)/i);
  if (heading) {
    /* "Lesson 4, additional" folds into lesson 4, which already exists in the
       seed - so its cards are appended to that lesson rather than creating a
       twenty-fourth. */
    lesson = Number(heading[1]);
    if (!lessons.has(lesson)) lessons.set(lesson, { grammar: [], blocks: [] });
    collectingGrammar = false;
    return;
  }

  if (line.startsWith("```")) {
    inBlock = !inBlock;
    collectingGrammar = false;
    return;
  }

  if (!inBlock) {
    if (/^Grammar:/i.test(line)) {
      collectingGrammar = true;
      lessons.get(lesson)?.grammar.push(line.replace(/^Grammar:\s*/i, ""));
      return;
    }
    if (collectingGrammar && line !== "" && !line.startsWith("#") && !line.startsWith("---")) {
      lessons.get(lesson)?.grammar.push(line);
      return;
    }
    collectingGrammar = false;
    return;
  }

  if (line === "" || !line.includes("|")) return;

  const f = line.split("|").map((x) => x.trim());
  const [arabic = "", english = "", third = "", fourth = "", fifth = ""] = f;

  /* The whole conversion: an empty transliteration slotted into third place. */
  const converted = [arabic, english, "", third, fourth, fifth]
    .join(" | ")
    .replace(/\s+\|\s+$/, "")
    .replace(/(\s\|\s*)+$/, "");

  cards.push({ line: i + 1, lesson, raw: line, converted });
  lessons.get(lesson)?.blocks.push(converted);
});

/* ------------------------------------------------------------------ checks */

const problems: string[] = [];

for (const c of cards) {
  const f = c.raw.split("|").map((x) => x.trim());
  const [arabic = "", english = "", third = "", fourth = ""] = f;

  if (!arabic) problems.push(`L${c.line}: no Arabic`);
  if (!english) problems.push(`L${c.line}: no English`);
  if (LATIN.test(arabic)) problems.push(`L${c.line}: Latin letters in the Arabic field: ${arabic}`);

  /* Field three must be a gender or the word "phrase". Anything else means the
     source drifted from the format and the conversion would be wrong. */
  if (third && !["m", "f", "phrase"].includes(third)) {
    problems.push(`L${c.line}: field 3 is "${third}", expected m, f or phrase`);
  }

  /* The plural, when present, has to be Arabic. */
  if (fourth && !ARABIC_LETTER.test(fourth) && fourth !== "") {
    problems.push(`L${c.line}: plural field is not Arabic: "${fourth}"`);
  }

  if (!HARAKAH.test(arabic)) {
    problems.push(`L${c.line}: no harakat at all in "${arabic}" - unvowelled card`);
  }

  /* Two harakat in a row is the classic scan artifact. Shaddah followed by a
     vowel is legitimate and excluded. */
  const doubled = arabic.match(/[ً-ِْ]{2,}/);
  if (doubled) problems.push(`L${c.line}: stacked harakat in "${arabic}"`);

  /*
    Tanwin anywhere but the end of a WORD is almost always a scan error.

    Checked per word rather than per entry: a phrase is several words and every
    one of them may carry its own ending, so scanning the whole string flagged
    every sentence in the book. The unit is the word, which is what tanwin
    attaches to.
  */
  for (const word of arabic.split(/\s+/)) {
    const at = [...word].findIndex((ch) => TANWIN.test(ch));
    if (at >= 0 && at < word.length - 2) {
      problems.push(`L${c.line}: tanwin mid-word in "${word}" (${arabic})`);
    }
  }
}

/* ------------------------------------------------ the parser's own verdict */

let parserErrors = 0;
for (const [n, l] of [...lessons.entries()].sort((a, b) => a[0] - b[0])) {
  if (l.blocks.length === 0) continue;
  const result = parseCards(l.blocks.join("\n"));
  if (result.errors.length) {
    parserErrors += result.errors.length;
    console.log(`\nlesson ${n}: ${result.errors.length} parser errors`);
    for (const e of result.errors.slice(0, 5)) console.log(`  ${e.message}`);
  }
}

/* ---------------------------------------------------------------- the report */

console.log("\n=== converted ===");
for (const [n, l] of [...lessons.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`lesson ${String(n).padStart(2)}  ${String(l.blocks.length).padStart(3)} cards`);
}
console.log(`\ntotal cards: ${cards.length}`);
console.log(`parser errors: ${parserErrors}`);
console.log(`content warnings: ${problems.length}`);

if (problems.length) {
  console.log("\n=== warnings ===");
  for (const p of problems.slice(0, 40)) console.log("  " + p);
  if (problems.length > 40) console.log(`  ... and ${problems.length - 40} more`);
}
