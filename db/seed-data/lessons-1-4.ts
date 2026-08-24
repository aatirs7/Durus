/*
  Raw paste blocks for lessons 1 to 4, copied verbatim from the notes.
  These go through lib/parse-cards.ts, the same parser /add uses, so
  loading the seed proves the parser against real Arabic.

  Spec section 8 says the repository ships with no vocabulary. This is a
  deliberate exception, so that /review has real words to be built
  against rather than lorem. Everything from lesson 5 on is entered
  through /add after class.
*/

export type SeedLesson = {
  number: number;
  grammarNote: string;
  block: string;
};

export const SEED_LESSONS: SeedLesson[] = [
  {
    number: 1,
    grammarNote:
      'هٰذَا "this". Arabic has no copula, so هٰذَا بَيْتٌ is a complete sentence. Tanwin (the -n ending) is the indefinite article. The particle أ at the front turns a statement into a question.',
    block: `
بَيْتٌ | house | m
مَسْجِدٌ | mosque | m
بَابٌ | door | m
كِتَابٌ | book | m
قَلَمٌ | pen | m
مِفْتَاحٌ | key | m
مَكْتَبٌ | writing table | m
سَرِيرٌ | bed | m
كُرْسِيٌّ | chair | m
نَجْمٌ | star | m
قَمِيصٌ | shirt | m
طَبِيبٌ | doctor | m
وَلَدٌ | boy | m
طَالِبٌ | student | m
رَجُلٌ | man | m
تَاجِرٌ | merchant | m
كَلْبٌ | dog | m
قِطٌّ | cat | m
حِمَارٌ | donkey | m
حِصَانٌ | horse | m
جَمَلٌ | camel | m
دِيكٌ | rooster | m
مُدَرِّسٌ | teacher | m
مِنْدِيلٌ | kerchief | m
هٰذَا | this | phrase | | written without the first alif, pronounced hadha
مَا هٰذَا؟ | what is this? | phrase | | used for things
مَنْ هٰذَا؟ | who is this? | phrase | | used for people
أَهٰذَا بَيْتٌ؟ | is this a house? | phrase | | the alif turns a statement into a question
نَعَمْ | yes | phrase
لَا | no | phrase
هٰذَا كِتَابٌ | this is a book | phrase | | no word for "is" and no word for "a"
لَا، هٰذَا مَسْجِدٌ | no, this is a mosque | phrase
`,
  },
  {
    number: 2,
    grammarNote:
      'ذٰلِكَ "that", and وَ "and". ذٰلِكَ is pronounced dhalika but written without the alif, same pattern as هٰذَا. The وَ is written joined to the word that follows it.',
    block: `
إِمَامٌ | imam | m
حَجَرٌ | stone | m
سُكَّرٌ | sugar | m
لَبَنٌ | milk | m
ذٰلِكَ | that | phrase | | written without the alif, pronounced dhalika
مَا ذٰلِكَ؟ | what is that? | phrase
وَ | and | phrase | | written joined to the following word
هٰذَا بَيْتٌ وَذٰلِكَ مَسْجِدٌ | this is a house and that is a mosque | phrase
أَذٰلِكَ كَلْبٌ؟ لَا، ذٰلِكَ قِطٌّ | is that a dog? no, that is a cat | phrase
`,
  },
  {
    number: 3,
    grammarNote:
      "The definite article ال. When ال is prefixed, the tanwin drops: بَيْتٌ becomes البَيْتُ. Of the 28 letters, 14 are Solar and 14 are Lunar. Before a Solar letter the ل assimilates in pronunciation, marked by shadda on the following letter, so الشَّمْسُ is read ash-shamsu. Lunar letters do not assimilate, so القَمَرُ is read al-qamaru. The alif of ال is dropped in pronunciation when preceded by another word, marked with wasla, so وَالبَيْتُ is read wa l-baitu. Adjectives with tanwin are not translated with \"a\", so مَفْتُوحٌ is just \"open\".",
    block: `
غَنِيٌّ | rich | | | opposite of poor
فَقِيرٌ | poor | | | opposite of rich
طَوِيلٌ | tall | | | opposite of short
قَصِيرٌ | short | | | opposite of tall
بَارِدٌ | cold | | | opposite of hot
حَارٌّ | hot | | | opposite of cold
جَالِسٌ | sitting | | | opposite of standing
وَاقِفٌ | standing | | | opposite of sitting
جَدِيدٌ | new | | | opposite of old
قَدِيمٌ | old | | | opposite of new
قَرِيبٌ | near | | | opposite of far
بَعِيدٌ | far away | | | opposite of near
نَظِيفٌ | clean | | | opposite of dirty
وَسِخٌ | dirty | | | opposite of clean
صَغِيرٌ | small | | | opposite of big
كَبِيرٌ | big | | | opposite of small
خَفِيفٌ | light | | | opposite of heavy
ثَقِيلٌ | heavy | | | opposite of light
جَمِيلٌ | beautiful
حُلْوٌ | sweet
مَرِيضٌ | sick
مَفْتُوحٌ | open | | | adjective, the tanwin here is not "a"
مَكْسُورٌ | broken | | | adjective, the tanwin here is not "a"
الوَرَقُ | paper | m
المَاءُ | water | m
التُّفَّاحُ | apple | m | | solar letter, read at-tuffahu
الدُّكَّانُ | shop | m | | solar letter, read ad-dukkanu
الشَّمْسُ | the sun | f | | solar letter, read ash-shamsu
القَمَرُ | the moon | m | | lunar letter, read al-qamaru
البَيْتُ نَظِيفٌ | the house is clean | phrase
البَابُ مَفْتُوحٌ | the door is open | phrase
القَلَمُ مَكْسُورٌ | the pen is broken | phrase
وَالبَيْتُ | and the house | phrase | | read wa l-baitu, the alif of al drops
`,
  },
  {
    number: 4,
    grammarNote:
      "Prepositions and case. The normal noun ending is -u, called مَرْفُوعٌ (nominative). After a preposition it changes to -i, called مَجْرُورٌ (genitive). So البَيْتُ becomes فِي البَيْتِ. Also the pronouns هُوَ and هِيَ. Every noun is masculine or feminine, and هُوَ or هِيَ is used regardless of whether the noun is a person, animal, or thing. Most feminine nouns end in ة but not all. Proper nouns take no tanwin, and feminine proper nouns never do.",
    block: `
أَيْنَ | where | phrase
عَلَى | on | phrase | | preposition, puts the next noun in genitive
فِي | in | phrase | | preposition, puts the next noun in genitive
غُرْفَةٌ | room | f | | ends in round ta
السَّمَاءُ | sky | f | | solar letter, read as-sama'u
الحَمَّامُ | bathroom | m
الفَصْلُ | classroom | m
المَطْبَخُ | kitchen | m
المِرْحَاضُ | toilet | m
هُوَ | he, it | phrase | | used for any masculine noun
هِيَ | she, it | phrase | | used for any feminine noun
أَيْنَ الوَلَدُ؟ هُوَ فِي المَسْجِدِ | where is the boy? he is in the mosque | phrase
أَيْنَ الكِتَابُ؟ هُوَ عَلَى المَكْتَبِ | where is the book? it is on the table | phrase
أَيْنَ آمِنَةُ؟ هِيَ فِي البَيْتِ | where is Aminah? she is in the house | phrase | | feminine proper noun, no tanwin
أَيْنَ السَّاعَةُ؟ هِيَ عَلَى السَّرِيرِ | where is the watch? it is on the bed | phrase
البَيْتُ جَدِيدٌ | the house is new | phrase | | al-baitu is marfu
فِي البَيْتِ | in the house | phrase | | al-baiti is majrur after the preposition
عَلَى المَكْتَبِ | on the table | phrase
`,
  },
];

/* Arabic ordinals do not follow a clean rule past ten, so these are
   written out rather than generated. */
export const LESSON_TITLES: { ar: string; en: string }[] = [
  { ar: "الدَّرْسُ الأَوَّلُ", en: "Lesson one" },
  { ar: "الدَّرْسُ الثَّانِي", en: "Lesson two" },
  { ar: "الدَّرْسُ الثَّالِثُ", en: "Lesson three" },
  { ar: "الدَّرْسُ الرَّابِعُ", en: "Lesson four" },
  { ar: "الدَّرْسُ الخَامِسُ", en: "Lesson five" },
  { ar: "الدَّرْسُ السَّادِسُ", en: "Lesson six" },
  { ar: "الدَّرْسُ السَّابِعُ", en: "Lesson seven" },
  { ar: "الدَّرْسُ الثَّامِنُ", en: "Lesson eight" },
  { ar: "الدَّرْسُ التَّاسِعُ", en: "Lesson nine" },
  { ar: "الدَّرْسُ العَاشِرُ", en: "Lesson ten" },
  { ar: "الدَّرْسُ الحَادِيَ عَشَرَ", en: "Lesson eleven" },
  { ar: "الدَّرْسُ الثَّانِيَ عَشَرَ", en: "Lesson twelve" },
  { ar: "الدَّرْسُ الثَّالِثَ عَشَرَ", en: "Lesson thirteen" },
  { ar: "الدَّرْسُ الرَّابِعَ عَشَرَ", en: "Lesson fourteen" },
  { ar: "الدَّرْسُ الخَامِسَ عَشَرَ", en: "Lesson fifteen" },
  { ar: "الدَّرْسُ السَّادِسَ عَشَرَ", en: "Lesson sixteen" },
  { ar: "الدَّرْسُ السَّابِعَ عَشَرَ", en: "Lesson seventeen" },
  { ar: "الدَّرْسُ الثَّامِنَ عَشَرَ", en: "Lesson eighteen" },
  { ar: "الدَّرْسُ التَّاسِعَ عَشَرَ", en: "Lesson nineteen" },
  { ar: "الدَّرْسُ العِشْرُونَ", en: "Lesson twenty" },
  { ar: "الدَّرْسُ الحَادِي وَالعِشْرُونَ", en: "Lesson twenty one" },
  { ar: "الدَّرْسُ الثَّانِي وَالعِشْرُونَ", en: "Lesson twenty two" },
  { ar: "الدَّرْسُ الثَّالِثُ وَالعِشْرُونَ", en: "Lesson twenty three" },
];
