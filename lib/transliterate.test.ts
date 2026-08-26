import { describe, expect, it } from "vitest";
import { SEED_LESSONS } from "@/db/seed-data/lessons-1-4";
import { transliterate } from "./transliterate";

/*
  The hand written transliterations in lessons 1 to 4 are the spec.

  They were typed by a person reading the book, so they are what the generated
  ones have to look like - not a romanisation standard, and not this
  implementation's own opinion. Anything that disagrees with them is either a
  bug here or a typo there, and the point of running the whole corpus is that
  both get found.
*/
type Card = { arabic: string; expected: string };

const corpus: Card[] = SEED_LESSONS.flatMap((lesson) =>
  lesson.block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes("|"))
    .map((line) => line.split("|").map((f) => f.trim()))
    .filter((f) => f[0] && f[2])
    .map((f) => ({ arabic: f[0], expected: f[2] })),
);

/*
  Four entries where the corpus writes a prefix as its own word - "a hadha" for
  أَهٰذَا, "wa dhalika" for وَذٰلِكَ - and one where the corpus itself is wrong.

  The prefixes cannot be split by rule: the same fathah-carrying waw that is a
  conjunction in وَذٰلِكَ is the first letter of the word in وَلَدٌ, and the same
  hamzah that asks a question in أَذٰلِكَ is the first letter of أَيْنَ. Guessing
  would corrupt ordinary vocabulary to tidy up four phrases, so both readings
  are allowed to stand and this list records why.
*/
const PREFIX_CONVENTION = new Set(["أَهٰذَا بَيْتٌ؟", "هٰذَا بَيْتٌ وَذٰلِكَ مَسْجِدٌ", "أَذٰلِكَ كَلْبٌ؟ لَا، ذٰلِكَ قِطٌّ", "وَالبَيْتُ"]);

/*
  A typo in the book's own key, kept as a test so nobody "fixes" the generator
  to reproduce it. سَرِير is sarir, so the phrase is "ala s-sariri"; the corpus
  has "s-siriri".
*/
const CORPUS_TYPO = new Set(["أَيْنَ السَّاعَةُ؟ هِيَ عَلَى السَّرِيرِ"]);

describe("transliterate", () => {
  it("has a corpus to check against", () => {
    expect(corpus.length).toBeGreaterThan(80);
  });

  for (const card of corpus) {
    if (PREFIX_CONVENTION.has(card.arabic) || CORPUS_TYPO.has(card.arabic)) continue;
    it(`reads ${card.arabic} as ${card.expected}`, () => {
      expect(transliterate(card.arabic)).toBe(card.expected);
    });
  }

  it("reads the mistyped corpus entry correctly rather than reproducing it", () => {
    expect(transliterate("أَيْنَ السَّاعَةُ؟ هِيَ عَلَى السَّرِيرِ")).toBe(
      "ayna s-saatu? hiya ala s-sariri",
    );
  });

  describe("the rules, one at a time", () => {
    it("assimilates the article into a sun letter", () => {
      expect(transliterate("الشَّمْسُ")).toBe("ash-shamsu");
      expect(transliterate("التُّفَّاحُ")).toBe("at-tuffahu");
    });

    it("keeps the lam before a moon letter", () => {
      expect(transliterate("القَمَرُ")).toBe("al-qamaru");
    });

    /* Hamzatu l-wasl: the article's vowel exists to start the word and goes
       the moment anything precedes it. */
    it("elides the article's vowel after another word", () => {
      expect(transliterate("فِي البَيْتِ")).toBe("fi l-bayti");
      expect(transliterate("عَلَى المَكْتَبِ")).toBe("ala l-maktabi");
    });

    it("reads a dagger alif as a long a", () => {
      expect(transliterate("هٰذَا")).toBe("hadha");
    });

    it("reads ta marbutah as t when it carries a vowel", () => {
      expect(transliterate("غُرْفَةٌ")).toBe("ghurfatun");
    });

    it("does not write ayn or hamzah", () => {
      expect(transliterate("نَعَمْ")).toBe("naam");
      expect(transliterate("إِمَامٌ")).toBe("imamun");
    });

    it("drops a trailing question mark but keeps an interior one", () => {
      expect(transliterate("مَا هٰذَا؟")).toBe("ma hadha");
      expect(transliterate("أَذٰلِكَ كَلْبٌ؟ لَا، ذٰلِكَ قِطٌّ")).toContain("kalbun? la,");
    });

    it("doubles a shaddah", () => {
      expect(transliterate("قِطٌّ")).toBe("qittun");
    });
  });
});
