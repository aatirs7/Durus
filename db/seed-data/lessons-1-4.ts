/*
  Vocabulary lives here, added lesson by lesson as class covers them.
  These blocks go through lib/parse-cards.ts, so the seed proves the
  parser against real Arabic on every run.

  Format, pipe delimited:
    arabic | english | transliteration | gender or the word phrase | plural | note

  Cards for every lesson below are inserted regardless of the gate. The
  queue only ever draws from lessons up to settings.currentLesson, so a
  lesson sits here seeded and invisible until Add Lesson N is tapped.
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
بَيْتٌ | house | baytun | m
مَسْجِدٌ | mosque | masjidun | m
بَابٌ | door | babun | m
كِتَابٌ | book | kitabun | m
قَلَمٌ | pen | qalamun | m
مِفْتَاحٌ | key | miftahun | m
مَكْتَبٌ | writing table | maktabun | m
سَرِيرٌ | bed | sarirun | m
كُرْسِيٌّ | chair | kursiyyun | m
نَجْمٌ | star | najmun | m
قَمِيصٌ | shirt | qamisun | m
طَبِيبٌ | doctor | tabibun | m
وَلَدٌ | boy | waladun | m
طَالِبٌ | student | talibun | m
رَجُلٌ | man | rajulun | m
تَاجِرٌ | merchant | tajirun | m
كَلْبٌ | dog | kalbun | m
قِطٌّ | cat | qittun | m
حِمَارٌ | donkey | himarun | m
حِصَانٌ | horse | hisanun | m
جَمَلٌ | camel | jamalun | m
دِيكٌ | rooster | dikun | m
مُدَرِّسٌ | teacher | mudarrisun | m
مِنْدِيلٌ | kerchief | mindilun | m
هٰذَا | this | hadha | phrase | | written without the first alif
مَا هٰذَا؟ | what is this? | ma hadha | phrase | | used for things
مَنْ هٰذَا؟ | who is this? | man hadha | phrase | | used for people
أَهٰذَا بَيْتٌ؟ | is this a house? | a hadha baytun | phrase | | the alif turns a statement into a question
نَعَمْ | yes | naam | phrase
لَا | no | la | phrase
هٰذَا كِتَابٌ | this is a book | hadha kitabun | phrase | | no word for "is" and no word for "a"
لَا، هٰذَا مَسْجِدٌ | no, this is a mosque | la, hadha masjidun | phrase
`,
  },
  {
    number: 2,
    grammarNote:
      'ذٰلِكَ "that", and وَ "and". ذٰلِكَ is pronounced dhalika but written without the alif, same pattern as هٰذَا. The وَ is written joined to the word that follows it.',
    block: `
إِمَامٌ | imam | imamun | m
حَجَرٌ | stone | hajarun | m
سُكَّرٌ | sugar | sukkarun | m
لَبَنٌ | milk | labanun | m
ذٰلِكَ | that | dhalika | phrase | | written without the alif
مَا ذٰلِكَ؟ | what is that? | ma dhalika | phrase
وَ | and | wa | phrase | | written joined to the following word
هٰذَا بَيْتٌ وَذٰلِكَ مَسْجِدٌ | this is a house and that is a mosque | hadha baytun wa dhalika masjidun | phrase
أَذٰلِكَ كَلْبٌ؟ لَا، ذٰلِكَ قِطٌّ | is that a dog? no, that is a cat | a dhalika kalbun? la, dhalika qittun | phrase
`,
  },
  {
    number: 3,
    grammarNote:
      "The definite article ال. When ال is prefixed, the tanwin drops: بَيْتٌ becomes البَيْتُ. Of the 28 letters, 14 are Solar and 14 are Lunar. Before a Solar letter the ل assimilates in pronunciation, marked by shadda on the following letter, so الشَّمْسُ is read ash-shamsu. Lunar letters do not assimilate, so القَمَرُ is read al-qamaru. The alif of ال is dropped in pronunciation when preceded by another word, marked with wasla, so وَالبَيْتُ is read wa l-baitu. Adjectives with tanwin are not translated with \"a\", so مَفْتُوحٌ is just \"open\".",
    block: `
غَنِيٌّ | rich | ghaniyyun | | | opposite of poor
فَقِيرٌ | poor | faqirun | | | opposite of rich
طَوِيلٌ | tall | tawilun | | | opposite of short
قَصِيرٌ | short | qasirun | | | opposite of tall
بَارِدٌ | cold | baridun | | | opposite of hot
حَارٌّ | hot | harrun | | | opposite of cold
جَالِسٌ | sitting | jalisun | | | opposite of standing
وَاقِفٌ | standing | waqifun | | | opposite of sitting
جَدِيدٌ | new | jadidun | | | opposite of old
قَدِيمٌ | old | qadimun | | | opposite of new
قَرِيبٌ | near | qaribun | | | opposite of far
بَعِيدٌ | far away | baidun | | | opposite of near
نَظِيفٌ | clean | nazifun | | | opposite of dirty
وَسِخٌ | dirty | wasikhun | | | opposite of clean
صَغِيرٌ | small | saghirun | | | opposite of big
كَبِيرٌ | big | kabirun | | | opposite of small
خَفِيفٌ | light | khafifun | | | opposite of heavy
ثَقِيلٌ | heavy | thaqilun | | | opposite of light
جَمِيلٌ | beautiful | jamilun
حُلْوٌ | sweet | hulwun
مَرِيضٌ | sick | maridun
مَفْتُوحٌ | open | maftuhun | | | adjective, the tanwin here is not "a"
مَكْسُورٌ | broken | maksurun | | | adjective, the tanwin here is not "a"
الوَرَقُ | paper | al-waraqu | m
المَاءُ | water | al-mau | m
التُّفَّاحُ | apple | at-tuffahu | m | | solar letter
الدُّكَّانُ | shop | ad-dukkanu | m | | solar letter
الشَّمْسُ | the sun | ash-shamsu | f | | solar letter
القَمَرُ | the moon | al-qamaru | m | | lunar letter
البَيْتُ نَظِيفٌ | the house is clean | al-baytu nazifun | phrase
البَابُ مَفْتُوحٌ | the door is open | al-babu maftuhun | phrase
القَلَمُ مَكْسُورٌ | the pen is broken | al-qalamu maksurun | phrase
وَالبَيْتُ | and the house | wa l-baytu | phrase | | the alif of al drops
`,
  },
  {
    number: 4,
    grammarNote:
      "Prepositions and case. The normal noun ending is -u, called مَرْفُوعٌ (nominative). After a preposition it changes to -i, called مَجْرُورٌ (genitive). So البَيْتُ becomes فِي البَيْتِ. Also the pronouns هُوَ and هِيَ. Every noun is masculine or feminine, and هُوَ or هِيَ is used regardless of whether the noun is a person, animal, or thing. Most feminine nouns end in ة but not all. Proper nouns take no tanwin, and feminine proper nouns never do.",
    block: `
أَيْنَ | where | ayna | phrase
عَلَى | on | ala | phrase | | preposition, puts the next noun in genitive
فِي | in | fi | phrase | | preposition, puts the next noun in genitive
غُرْفَةٌ | room | ghurfatun | f | | ends in round ta
السَّمَاءُ | sky | as-samau | f | | solar letter
الحَمَّامُ | bathroom | al-hammamu | m
الفَصْلُ | classroom | al-faslu | m
المَطْبَخُ | kitchen | al-matbakhu | m
المِرْحَاضُ | toilet | al-mirhadu | m
هُوَ | he, it | huwa | phrase | | used for any masculine noun
هِيَ | she, it | hiya | phrase | | used for any feminine noun
أَيْنَ الوَلَدُ؟ هُوَ فِي المَسْجِدِ | where is the boy? he is in the mosque | ayna l-waladu? huwa fi l-masjidi | phrase
أَيْنَ الكِتَابُ؟ هُوَ عَلَى المَكْتَبِ | where is the book? it is on the table | ayna l-kitabu? huwa ala l-maktabi | phrase
أَيْنَ آمِنَةُ؟ هِيَ فِي البَيْتِ | where is Aminah? she is in the house | ayna aminatu? hiya fi l-bayti | phrase | | feminine proper noun, no tanwin
أَيْنَ السَّاعَةُ؟ هِيَ عَلَى السَّرِيرِ | where is the watch? it is on the bed | ayna s-saatu? hiya ala s-siriri | phrase
البَيْتُ جَدِيدٌ | the house is new | al-baytu jadidun | phrase | | al-baytu is marfu
فِي البَيْتِ | in the house | fi l-bayti | phrase | | al-bayti is majrur after the preposition
عَلَى المَكْتَبِ | on the table | ala l-maktabi | phrase
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
