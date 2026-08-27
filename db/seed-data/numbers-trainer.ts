/*
  The numbers trainer's foundation content: the number words themselves.

  These become ordinary `cards` rows under ordinary `lessons` rows, which is
  what buys one scheduler, one fold and one sync path. What keeps them out of
  the book is `lessons.deck`, not a parallel table.

  STAGES ARE LESSONS. They are ordered, gated, taught once and full of cards,
  which is what a lesson is. Numbering them from 101 rather than continuing 24,
  25, 26 is deliberate: anything that reads a lesson number and forgets the deck
  filter produces an obviously wrong answer rather than a plausible one.

  Only stages 1 to 3 are here. Stage 4 adds no words - it drills these in two
  further directions - and stages 5 upward are rules, which are generated rather
  than authored.

  TWO DISCREPANCIES WITH THE SPEC, both resolved in favour of the arithmetic:

    Stage 3 is NINE items, not eight. The spec lists twenty through ninety, a
    hundred and a thousand - ten values - and says to drop twenty because Stage
    2 has it, which leaves nine.

    That makes 48 foundation items, not 47.

  Forms follow the spec's tables verbatim, including اثْنَانِ written without the
  kasrah on its alif, which is hamzatu l-wasl and conventionally left bare.
*/

export type NumberStageSeed = {
  /* lessons.number. Offset so a stage can never be mistaken for a book lesson. */
  number: number;
  stage: number;
  titleAr: string;
  titleEn: string;
  grammarNote: string;
  items: NumberItemSeed[];
};

export type NumberItemSeed = {
  value: number;
  arabic: string;
  /*
    The English has to DISTINGUISH the two forms, because both mean "seven" and
    a drill whose four options include two correct answers is not a drill.

    Worded as what the form is FOR rather than what it looks like: the form used
    with masculine nouns is the one carrying the ta, so calling it "the
    masculine form" would teach the mistake the trainer exists to prevent.
  */
  english: string;
  note?: string;
};

const STAGE_OFFSET = 100;

/* One to ten, in both counting forms. */
const stageOne: NumberItemSeed[] = [
  { value: 1, arabic: "وَاحِدٌ", english: "one (with masculine nouns)" },
  { value: 1, arabic: "وَاحِدَةٌ", english: "one (with feminine nouns)" },
  { value: 2, arabic: "اثْنَانِ", english: "two (with masculine nouns)" },
  { value: 2, arabic: "اثْنَتَانِ", english: "two (with feminine nouns)" },
  { value: 3, arabic: "ثَلَاثَةٌ", english: "three (with masculine nouns)" },
  { value: 3, arabic: "ثَلَاثٌ", english: "three (with feminine nouns)" },
  { value: 4, arabic: "أَرْبَعَةٌ", english: "four (with masculine nouns)" },
  { value: 4, arabic: "أَرْبَعٌ", english: "four (with feminine nouns)" },
  { value: 5, arabic: "خَمْسَةٌ", english: "five (with masculine nouns)" },
  { value: 5, arabic: "خَمْسٌ", english: "five (with feminine nouns)" },
  { value: 6, arabic: "سِتَّةٌ", english: "six (with masculine nouns)" },
  { value: 6, arabic: "سِتٌّ", english: "six (with feminine nouns)" },
  { value: 7, arabic: "سَبْعَةٌ", english: "seven (with masculine nouns)" },
  { value: 7, arabic: "سَبْعٌ", english: "seven (with feminine nouns)" },
  {
    value: 8,
    arabic: "ثَمَانِيَةٌ",
    english: "eight (with masculine nouns)",
    note: "Irregular. See the feminine form.",
  },
  {
    value: 8,
    arabic: "ثَمَانٍ",
    english: "eight (with feminine nouns)",
    /* Two notes on one item, not a third card: the trap the spec flags. */
    note: "Irregular, in the same class as غَالٍ. In the teens it is written ثَمَانِي with sukun.",
  },
  { value: 9, arabic: "تِسْعَةٌ", english: "nine (with masculine nouns)" },
  { value: 9, arabic: "تِسْعٌ", english: "nine (with feminine nouns)" },
  { value: 10, arabic: "عَشَرَةٌ", english: "ten (with masculine nouns)" },
  { value: 10, arabic: "عَشْرٌ", english: "ten (with feminine nouns)" },
];

/* Eleven to twenty. Twenty has one form for both genders, so it is one item. */
const stageTwo: NumberItemSeed[] = [
  { value: 11, arabic: "أَحَدَ عَشَرَ", english: "eleven (with masculine nouns)" },
  { value: 11, arabic: "إِحْدَى عَشْرَةَ", english: "eleven (with feminine nouns)" },
  { value: 12, arabic: "اثْنَا عَشَرَ", english: "twelve (with masculine nouns)" },
  { value: 12, arabic: "اثْنَتَا عَشْرَةَ", english: "twelve (with feminine nouns)" },
  { value: 13, arabic: "ثَلَاثَةَ عَشَرَ", english: "thirteen (with masculine nouns)" },
  { value: 13, arabic: "ثَلَاثَ عَشْرَةَ", english: "thirteen (with feminine nouns)" },
  { value: 14, arabic: "أَرْبَعَةَ عَشَرَ", english: "fourteen (with masculine nouns)" },
  { value: 14, arabic: "أَرْبَعَ عَشْرَةَ", english: "fourteen (with feminine nouns)" },
  { value: 15, arabic: "خَمْسَةَ عَشَرَ", english: "fifteen (with masculine nouns)" },
  { value: 15, arabic: "خَمْسَ عَشْرَةَ", english: "fifteen (with feminine nouns)" },
  { value: 16, arabic: "سِتَّةَ عَشَرَ", english: "sixteen (with masculine nouns)" },
  { value: 16, arabic: "سِتَّ عَشْرَةَ", english: "sixteen (with feminine nouns)" },
  { value: 17, arabic: "سَبْعَةَ عَشَرَ", english: "seventeen (with masculine nouns)" },
  { value: 17, arabic: "سَبْعَ عَشْرَةَ", english: "seventeen (with feminine nouns)" },
  {
    value: 18,
    arabic: "ثَمَانِيَةَ عَشَرَ",
    english: "eighteen (with masculine nouns)",
  },
  {
    value: 18,
    arabic: "ثَمَانِيَ عَشْرَةَ",
    english: "eighteen (with feminine nouns)",
    note: "The ya keeps its sukun here, unlike the standalone ثَمَانٍ.",
  },
  { value: 19, arabic: "تِسْعَةَ عَشَرَ", english: "nineteen (with masculine nouns)" },
  { value: 19, arabic: "تِسْعَ عَشْرَةَ", english: "nineteen (with feminine nouns)" },
  {
    value: 20,
    arabic: "عِشْرُونَ",
    english: "twenty",
    note: "One form for both genders, like all the tens.",
  },
];

/*
  The tens, a hundred and a thousand. Every one of these has a single form for
  both genders, which is the first thing worth noticing about them and the
  reason they are a stage of their own.
*/
const stageThree: NumberItemSeed[] = [
  { value: 30, arabic: "ثَلَاثُونَ", english: "thirty" },
  { value: 40, arabic: "أَرْبَعُونَ", english: "forty" },
  { value: 50, arabic: "خَمْسُونَ", english: "fifty" },
  { value: 60, arabic: "سِتُّونَ", english: "sixty" },
  { value: 70, arabic: "سَبْعُونَ", english: "seventy" },
  { value: 80, arabic: "ثَمَانُونَ", english: "eighty" },
  { value: 90, arabic: "تِسْعُونَ", english: "ninety" },
  { value: 100, arabic: "مِائَةٌ", english: "a hundred", note: "The alif is silent. Some printings write مِئَة." },
  { value: 1000, arabic: "أَلْفٌ", english: "a thousand" },
];

export const NUMBER_STAGES: NumberStageSeed[] = [
  {
    number: STAGE_OFFSET + 1,
    stage: 1,
    titleAr: "المَرْحَلَةُ الأُولَى",
    titleEn: "One to ten",
    grammarNote:
      "The numbers one to ten, in the two forms they take when counting. Both are learnt here as vocabulary; why they swap is Stage 6.",
    items: stageOne,
  },
  {
    number: STAGE_OFFSET + 2,
    stage: 2,
    titleAr: "المَرْحَلَةُ الثَّانِيَةُ",
    titleEn: "Eleven to twenty",
    grammarNote:
      "Eleven to nineteen are two words and both parts move. Twenty has one form for both genders.",
    items: stageTwo,
  },
  {
    number: STAGE_OFFSET + 3,
    stage: 3,
    titleAr: "المَرْحَلَةُ الثَّالِثَةُ",
    titleEn: "Tens, hundreds and thousands",
    grammarNote:
      "The tens, a hundred and a thousand. None of these change for gender, which is the first thing to notice about them.",
    items: stageThree,
  },
];
