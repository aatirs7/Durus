import type { SeedLesson } from "./lessons-1-4";

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
  {
    number: 4,
    grammarNote: "",
    block: `
مِنْ | from | min | phrase |  | becomes مِنَ before ال
إِلَى | to | ila | phrase |  | preposition
أَنَا | I | ana | phrase |  | masculine and feminine
أَنْتَ | you | anta | phrase |  | masculine singular only
ذَهَبَ | he went | dhahaba | phrase |  | verb
خَرَجَ | he went out | kharaja | phrase |  | verb
اليَابَانُ | Japan | al-yabanu | f
الصِّينُ | China | as-sinu | f
الهِنْدُ | India | al-hindu | f
الفِلِبِّينُ | The Philippines | al-filibbinu | f
المَدْرَسَةُ | school | al-madrasatu | f
السُّوقُ | market | as-suqu | f |  | feminine in this book
الجَامِعَةُ | university | al-jamiatu | f
المُدِيرُ | headmaster | al-mudiru | m
أَيْنَ بِلَالٌ؟ ذَهَبَ إِلَى المَسْجِدِ | where is Bilal? he went to the mosque | ayna bilalun? dhahaba ila l-masjidi | phrase
ذَهَبَ بِلَالٌ إِلَى المَسْجِدِ | Bilal went to the mosque | dhahaba bilalun ila l-masjidi | phrase |  | with a noun subject the pronoun he is dropped
`,
  },
  {
    number: 5,
    grammarNote: "idafah. The mudaf takes neither ال nor tanwin and is definite by position. The mudaf ilaihi is genitive, with tanwin or with ال. يَا is the vocative particle and the noun after it has only one dammah. اِسْم and اِبْن begin with hamzatu l-wasl.",
    block: `
الرَّسُولُ | the Messenger | ar-rasulu | m
العَمُّ | paternal uncle | al-ammu | m
الشَّارِعُ | street | ash-shariu | m
الكَعْبَةُ | the Kabah | al-kabatu | f
الخَالُ | maternal uncle | al-khalu | m
مُغْلَقٌ | closed, shut | mughlaqun
الاسْمُ | name | al-smu | m |  | begins with hamzatu l-wasl
الحَقِيبَةُ | bag, case | al-haqibatu | f
تَحْتَ | under, beneath | tahta | phrase |  | the noun after it is genitive, mudaf ilaihi
الابْنُ | son | al-bnu | m |  | begins with hamzatu l-wasl
السَّيَّارَةُ | car | as-sayyaratu | f
هُنَا | here | huna | phrase
هُنَاكَ | there | hunaka | phrase
البِنْتُ | daughter, girl | al-bintu | f
كِتَابُ بِلَالٍ | Bilal's book | kitabu bilalin | phrase |  | mudaf has no al and no tanwin
بَيْتُ الإِمَامِ | the imam's house | baytu l-imami | phrase
كِتَابُ مَنْ؟ | whose book? | kitabu man | phrase |  | من is indeclinable
يَا بِلَالُ | O Bilal | ya bilalu | phrase |  | one dammah after يا, no tanwin
عَلَى مَكْتَبِ المُدَرِّسِ | on the teacher's desk | ala maktabi l-mudarrisi | phrase |  | genitive twice: preposition then idafah
`,
  },
  {
    number: 6,
    grammarNote: "هٰذِهِ feminine of هٰذَا. Feminine formed with ة, the letter before it taking fathah. Double body parts are feminine, single ones masculine. لِ means belongs to. لِمَنْ whose. أَيْضًا also. جِدًّا very. اللّٰهِ drops its alif after لِ giving لِلّٰهِ.",
    block: `
هٰذِهِ | this (feminine) | hadhihi | phrase |  | pronounced haadhihi, alif omitted in writing
المِكْوَاةُ | iron (for ironing) | al-mikwatu | f
البَقَرَةُ | cow | al-baqaratu | f
الدَّرَّاجَةُ | bicycle | ad-darrajatu | f
المِلْعَقَةُ | spoon | al-milaqatu | f
الفَلَّاحُ | farmer | al-fallahu | m
الأُمُّ | mother | al-ummu | f
الأَبُ | father | al-abu | m
الثَّلَّاجَةُ | fridge | ath-thallajatu | f
الشَّايُ | tea | ash-shayu | m
المَغْرِبُ | west | al-maghribu | m
القَهْوَةُ | coffee | al-qahwatu | f
الأَنْفُ | nose | al-anfu | m
الفَمُ | mouth | al-famu | m
القِدْرُ | cooking pot | al-qidru | f
الأُذُنُ | ear | al-udhunu | f
العَيْنُ | eye | al-aynu | f
اليَدُ | hand | al-yadu | f
الرِّجْلُ | leg | ar-rijlu | f
سَرِيعٌ | fast | sariun
النَّافِذَةُ | window | an-nafidhatu | f
الشَّرْقُ | east | ash-sharqu | m
رَأْسٌ | head | rasun | m
وَجْهٌ | face | wajhun | m
اِبْنٌ | son | ibnun | m |  | separate feminine form: بِنْتٌ
أَخٌ | brother | akhun | m |  | separate feminine form: أُخْتٌ
أُخْتٌ | sister | ukhtun | f
لِ | belongs to, for | li | phrase |  | preposition
لِمَنْ | whose, belonging to whom | liman | phrase
أَيْضًا | also | aydan | phrase
جِدًّا | very | jiddan | phrase
هٰذَا وَلَدٌ وَهٰذِهِ بِنْتٌ | this is a boy and this is a girl | hadha waladun wahadhihi bintun | phrase
الحَمْدُ لِلّٰهِ | praise belongs to Allah | al-hamdu lillahi | phrase |  | the alif of الله drops after لِ
لِمَنْ هٰذَا؟ | whose is this? | liman hadha | phrase
هٰذَا كَبِيرٌ جِدًّا | this is very big | hadha kabirun jiddan | phrase
`,
  },
  {
    number: 7,
    grammarNote: "تِلْكَ, feminine of ذٰلِكَ.",
    block: `
تِلْكَ | that (feminine) | tilka | phrase
النَّاقَةُ | she-camel | an-naqatu | f
البَطَّةُ | duck | al-battatu | f
المُمَرِّضَةُ | nurse | al-mumarridatu | f
البَيْضَةُ | egg | al-baydatu | f
المُؤَذِّنُ | muadhdhin | al-muadhdhinu | m
الدَّجَاجَةُ | hen | ad-dajajatu | f
هٰذِهِ آمِنَةُ، وَتِلْكَ مَرْيَمُ | this is Aminah and that is Maryam | hadhihi aminatu, watilka maryamu | phrase
`,
  },
  {
    number: 8,
    grammarNote: "هٰذَا الكِتَابُ means this book, not a sentence by itself. Nouns ending in long alif (أَمْرِيكَا, المُسْتَشْفَى) never change ending. خَلْفَ behind and أَمَامَ in front of take genitive. جَلَسَ he sat.",
    block: `
خَلْفَ | behind | khalfa | phrase |  | the noun after it is genitive
أَمَامَ | in front of | amama | phrase |  | the noun after it is genitive
جَلَسَ | he sat | jalasa | phrase |  | verb
أَمْرِيكَا | America | amrika | f |  | ends in long alif, never changes
السِّكِّينُ | knife | as-sikkinu | f
أَلْمَانِيَا | Germany | almaniya | f
العِرَاقُ | Iraq | al-iraqu | m
إِنْكَلْتَرَا | England | inkaltara | f
سُوِيسْرَا | Switzerland | suwisra | f
المُسْتَشْفَى | hospital | al-mustashfa | m |  | final ya pronounced alif, no dots
هٰذَا الكِتَابُ جَدِيدٌ | this book is new | hadha l-kitabu jadidun | phrase |  | demonstrative plus definite noun plus predicate
البَيْتُ خَلْفَ المَسْجِدِ | the house is behind the mosque | al-baytu khalfa l-masjidi | phrase
أَيْنَ جَلَسَ مُحَمَّدٌ؟ جَلَسَ أَمَامَ المُدَرِّسِ | where did Muhammad sit? he sat in front of the teacher | ayna jalasa muhammadun? jalasa amama l-mudarrisi | phrase
`,
  },
  {
    number: 9,
    grammarNote: "the adjective (na't) follows its noun and agrees in gender, definiteness, and case. Adjectives ending in -aan (جَوْعَانُ) have no tanwin. Part B: relative pronoun الَّذِي. لِ plus ال noun drops the alif (لِلْإِمَامِ). عِنْدَ with, genitive after it.",
    block: `
الفَاكِهَةُ | fruit | al-fakihatu | f
العُصْفُورُ | sparrow | al-usfuru | m
الطَّائِرُ | bird | at-tairu | m
العَرَبِيَّةُ | Arabic | al-arabiyyatu | f
اللُّغَةُ | language | al-lughatu | f
سَهْلٌ | easy | sahlun
مُجْتَهِدٌ | hardworking | mujtahidun
شَهِيرٌ | famous | shahirun
الإِنْكِلِيزِيَّةُ | English (language) | al-inkiliziyyatu | f
صَعْبٌ | difficult | sabun
المَدِينَةُ | city | al-madinatu | f
القَاهِرَةُ | Cairo | al-qahiratu | f
اليَوْمَ | today | al-yawma | phrase
لِمَاذَا | why | limadha | phrase
الكُوبُ | cup | al-kubu | m
كَسْلَانُ | lazy | kaslanu |  |  | no tanwin, faalaan pattern
جَوْعَانُ | hungry | jawanu |  |  | no tanwin
عَطْشَانُ | thirsty | atshanu |  |  | no tanwin
غَضْبَانُ | angry | ghadbanu |  |  | no tanwin
مَلْآنُ | full | malanu |  |  | no tanwin
المَكْتَبَةُ | library | al-maktabatu | f
الآنَ | now, just now | al-ana | phrase
المُسْتَوْصَفُ | clinic, small hospital | al-mustawsafu | m
المِرْوَحَةُ | fan | al-mirwahatu | f
الكُوَيْتُ | Kuwait | al-kuwaytu | f
الثَّانَوِيَّةُ | secondary school | ath-thanawiyyatu | f
الوَزِيرُ | minister | al-waziru | m
حَادٌّ | sharp | haddun
السُّوقُ | market | as-suqu | f
إِنْدُونِيسِيَا | Indonesia | indunisiya | f
الَّذِي | who, which (masculine) | al-dhi | phrase |  | relative pronoun
عِنْدَ | with, at | inda | phrase |  | the noun after it is genitive
بَيْتٌ جَدِيدٌ | a new house | baytun jadidun | phrase |  | adjective follows the noun
المُدَرِّسُ الجَدِيدُ فِي الفَصْلِ | the new teacher is in the class | al-mudarrisu l-jadidu fi l-fasli | phrase |  | definite noun takes definite adjective
لِلْإِمَامِ | belonging to the imam | lilimami | phrase |  | لِ plus ال drops the alif
المُدَرِّسُ عِنْدَ المُدِيرِ | the teacher is with the headmaster | al-mudarrisu inda l-mudiri | phrase
`,
  },
  {
    number: 10,
    grammarNote: "possessive pronoun suffixes. كِتَابُكَ your book, كِتَابُهُ his, كِتَابُهَا her, كِتَابِي my. أَبٌ and أَخٌ take a waw as mudaf: أَبُوكَ, أَخُوكَ, but أَبِي and أَخِي with no waw. عِنْدَ conveys to have. لِ with pronouns takes fathah (لَكَ, لَهُ, لَهَا) except لِي. مَعَ with, genitive after it. مَا as negative: مَا عِنْدِي no I do not have. Masculine proper nouns ending in ة (حَمْزَةُ) have no tanwin.",
    block: `
الزَّمِيلُ | colleague, classmate | az-zamilu | m
الزَّوْجُ | husband | az-zawju | m
الطِّفْلُ | child | at-tiflu | m
الفَتَى | young man | al-fata | m |  | ends in alif maqsurah, never changes
وَاحِدٌ | one | wahidun |  |  | follows the noun as an adjective
مَعَ | with | maa | phrase |  | the noun after it is genitive
بِ | at, in | bi | phrase |  | preposition, attached to the word
ذَهَبْتُ | I went | dhahabtu | phrase |  | verb
ذَهَبْتَ | you went | dhahabta | phrase |  | masculine singular
كِتَابُكَ | your book | kitabuka | phrase |  | -ka masculine singular
كِتَابُهُ | his book | kitabuhu | phrase
كِتَابُهَا | her book | kitabuha | phrase
كِتَابِي | my book | kitabi | phrase |  | case ending drops before -i
أَبُوكَ | your father | abuka | phrase |  | extra waw when mudaf
أَخُوكَ | your brother | akhuka | phrase |  | extra waw when mudaf
أَبِي | my father | abi | phrase |  | no waw with my
أَعِنْدَكَ قَلَمٌ؟ | have you a pen? | aindaka qalamun | phrase |  | literally is a pen with you
لِي أَخٌ | I have a brother | li akhun | phrase |  | relations use لِ not عِنْدَ
مَا عِنْدِي سَيَّارَةٌ | I do not have a car | ma indi sayyaratun | phrase |  | ما as negative
بِالجَامِعَةِ | at the university | biljamiati | phrase
`,
  },
  {
    number: 11,
    grammarNote: "revision lesson. The object of a verb is accusative (mansub), taking -a, but it does not appear before the first person possessive.",
    block: `
فِيهِ | in it (masculine) | fihi | phrase
فِيهَا | in it, in her (feminine) | fiha | phrase
أُحِبُّ | I love, I like | uhibbu | phrase |  | verb
تُحِبُّ | you love | tuhibbu | phrase |  | masculine singular
أُحِبُّ اللّٰهَ | I love Allah | uhibbu l-laha | phrase |  | object is accusative, -a ending
أُحِبُّ اللُّغَةَ العَرَبِيَّةَ | I love the Arabic language | uhibbu l-lughata l-arabiyyata | phrase |  | adjective agrees in case
مَنْ فِي البَيْتِ؟ فِيهِ أَبِي وَأُمِّي | who is in the house? my father and mother are in it | man fi l-bayti? fihi abi waummi | phrase
مَاذَا تُحِبُّ؟ | what do you love? | madha tuhibbu | phrase
`,
  },
  {
    number: 12,
    grammarNote: "أَنْتِ you feminine singular, possessive كِ. ذَهَبَتْ she went, sukun on the ت, becoming kasrah before ال. الَّتِي feminine relative.",
    block: `
أَنْتِ | you (feminine singular) | anti | phrase
ذَهَبَتْ | she went | dhahabat | phrase |  | verb, final ta has sukun
الَّتِي | who, which (feminine) | al-ti | phrase
العَمَّةُ | paternal aunt | al-ammatu | f
الخَالَةُ | maternal aunt | al-khalatu | f
مُسْتَشْفَى الوِلَادَةِ | maternity hospital | mustashfa l-wiladati | phrase
يَا سَيِّدِي | sir! | ya sayyidi | phrase
يَا سَيِّدَتِي | madam! | ya sayyidati | phrase
كَيْفَ حَالُكَ؟ | how are you? | kayfa haluka | phrase
أَنَا بِخَيْرٍ | I am fine | ana bikhayrin | phrase
الشَّجَرَةُ | tree | ash-shajaratu | f
سُورِيَا | Syria | suriya | f
المَدْرَسَةُ المُتَوَسِّطَةُ | middle school | al-madrasatu l-mutawassitatu | phrase
المُفَتِّشُ | inspector | al-mufattishu | m
الفَتَاةُ | young lady | al-fatatu | f
الدَّفْتَرُ | notebook | ad-daftaru | m
مَالِيزِيَا | Malaysia | maliziya | f
أُمَّهَاتٌ | mothers | ummahatun | f |  | plural of أُمٌّ
آبَاءٌ | fathers | abaun | m |  | plural of أَبٌ
عُلَمَاءُ | scholars | ulamau | m |  | plural of عَالِمٌ, no tanwin
وُزَرَاءُ | ministers | wuzarau | m |  | plural of وَزِيرٌ, no tanwin
أَقْوِيَاءُ | strong (plural) | aqwiyau |  |  | plural of قَوِيٌّ, no tanwin
ضِعَافٌ | weak (plural) | diafun |  |  | plural of ضَعِيفٌ
بَعْدَ | after | bada | phrase |  | the noun after it is genitive
المَمْلَكَةُ العَرَبِيَّةُ السَّعُودِيَّةُ | Kingdom of Saudi Arabia | al-mamlakatu l-arabiyyatu s-saudiyyatu | phrase
مِنْ أَيْنَ أَنْتِ يَا آمِنَةُ؟ | where are you from, Aminah? | min ayna anti ya aminatu | phrase
أَيْنَ بَيْتُكِ يَا مَرْيَمُ؟ | where is your house, Maryam? | ayna baytuki ya maryamu | phrase |  | -ki feminine
ذَهَبَتْ مَرْيَمُ إِلَى المَدْرَسَةِ | Maryam went to school | dhahabat maryamu ila l-madrasati | phrase |  | with a subject the she pronoun drops
ذَهَبَتِ البِنْتُ | the girl went | dhahabati l-bintu | phrase |  | sukun becomes kasrah before ال
`,
  },
  {
    number: 13,
    grammarNote: "plurals. Sound masculine -uuna, sound feminine -aatun. Broken plurals follow many patterns and each noun's plural must be memorized. هٰؤُلَاءِ plural of هٰذَا and هٰذِهِ, mostly for humans. هُمْ they and their (masculine), هُنَّ (feminine). ذَهَبُوا they went, ذَهَبْنَ feminine. بَعْضٌ some.",
    block: `
هٰؤُلَاءِ | these | haulai | phrase |  | pronounced haaulaai, mostly for human beings
هُمْ | they, their (masculine) | hum | phrase
هُنَّ | they, their (feminine) | hunna | phrase
ذَهَبُوا | they went (masculine) | dhahabu | phrase |  | final alif not pronounced
ذَهَبْنَ | they went (feminine) | dhahabna | phrase
بَعْضٌ | some | badun | phrase
مُسْلِمُونَ | Muslims | muslimuna | m |  | sound plural of مُسْلِمٌ
مُدَرِّسُونَ | teachers | mudarrisuna | m |  | sound plural of مُدَرِّسٌ
مُسْلِمَاتٌ | Muslim women | muslimatun | f |  | sound feminine plural
نُجُومٌ | stars | nujumun | m |  | broken plural of نَجْمٌ
كُتُبٌ | books | kutubun | m |  | broken plural of كِتَابٌ
جِبَالٌ | mountains | jibalun | m |  | broken plural of جَبَلٌ
تُجَّارٌ | merchants | tujjarun | m |  | broken plural of تَاجِرٌ
أَقْلَامٌ | pens | aqlamun | m |  | broken plural of قَلَمٌ
زُمَلَاءُ | classmates | zumalau | m |  | broken plural of زَمِيلٌ, no tanwin
أَصْدِقَاءُ | friends | asdiqau | m |  | broken plural of صَدِيقٌ, no tanwin
إِخْوَةٌ | brothers | ikhwatun | m |  | broken plural of أَخٌ
فِتْيَةٌ | young men | fityatun | m |  | plural of فَتًى
طِوَالٌ | tall (plural) | tiwalun |  |  | plural of طَوِيلٌ
طُلَّابٌ | students | tullabun | m |  | plural of طَالِبٌ
جُدُدٌ | new (plural) | jududun |  |  | plural of جَدِيدٌ
ضَيْفٌ | guest | dayfun | m | ضُيُوفٌ
قَرْيَةٌ | village | qaryatun | f
حَقْلٌ | field | haqlun | m | حُقُولٌ
أَسْمَاءٌ | names | asmaun | m |  | plural of اِسْمٌ
رِجَالٌ | men | rijalun | m |  | plural of رَجُلٌ
النَّاسُ | people | an-nasu | m
قِصَارٌ | short (plural) | qisarun |  |  | plural of قَصِيرٌ
حُجَّاجٌ | pilgrims | hujjajun | m |  | plural of حَاجٌّ
المَطْعَمُ | restaurant, mess | al-matamu | m
أَبْنَاءٌ | sons | abnaun | m |  | plural of اِبْنٌ
شَيْخٌ | old man, learned man | shaykhun | m | شُيُوخٌ
أُسْتَاذَةٌ | lady professor | ustadhatun | f
زَوْجَةٌ | wife | zawjatun | f
المَرْأَةُ | woman | al-maratu | f
النِّسَاءُ | women | an-nisau | f |  | plural from a different root
بَنَاتٌ | daughters | banatun | f |  | irregular plural of بِنْتٌ
أَخَوَاتٌ | sisters | akhawatun | f |  | irregular plural of أُخْتٌ
فَتَيَاتٌ | young ladies | fatayatun | f |  | irregular plural of فَتَاةٌ
هٰؤُلَاءِ تُجَّارٌ | these are merchants | haulai tujjarun | phrase
هُمْ مُدَرِّسُونَ | they are teachers | hum mudarrisuna | phrase
أَيْنَ بَيْتُهُمْ؟ | where is their house? | ayna baytuhum | phrase
بَعْضُهُمْ مُدَرِّسُونَ وَبَعْضُهُمْ مُهَنْدِسُونَ | some of them are teachers and some are engineers | baduhum mudarrisuna wabaduhum muhandisuna | phrase
`,
  },
  {
    number: 14,
    grammarNote: "أَنْتُمْ you plural, كُمْ your. نَحْنُ we, نَا our. ذَهَبْتُمْ, ذَهَبْنَا. Non-Arabic proper nouns have no tanwin (لَنْدَنُ, بَاكِسْتَانُ, most prophets' names) unless three letters and masculine (نُوحٌ, لُوطٌ). The mudaf with an adjective: بَيْتُ الإِمَامِ الجَدِيدُ the imam's new house versus بَيْتُ الإِمَامِ الجَدِيدِ the new imam's house, case of the adjective decides. أَيُّ which, used as mudaf.",
    block: `
أَنْتُمْ | you (masculine plural) | antum | phrase
نَحْنُ | we | nahnu | phrase |  | masculine and feminine
ذَهَبْتُمْ | you went (masculine plural) | dhahabtum | phrase
ذَهَبْنَا | we went | dhahabna | phrase |  | final a is long
أَيُّ | which | ayyu | phrase |  | used as mudaf
الدُّسْتُورُ | constitution, law | ad-dusturu | m
القِبْلَةُ | prayer direction | al-qiblatu | f
المَحْكَمَةُ | lawcourt | al-mahkamatu | f
حَفِيدٌ | grandson | hafidun | m | حَفَدَةٌ
الحَدِيقَةُ | garden | al-hadiqatu | f
الرَّبُّ | Lord | ar-rabbu | m
يَوْمُ السَّبْتِ | Saturday | yawmu s-sabti | phrase
الشَّهْرُ | month | ash-shahru | m
رَجَبٌ | the month of Rajab | rajabun | m
اليُونَانُ | Greece | al-yunanu | f
أَهْلًا وَسَهْلًا وَمَرْحَبًا | welcome | ahlan wasahlan wamarhaban | phrase
طِفْلَةٌ | child (feminine) | tiflatun | f
المَطَارُ | airport | al-mataru | m
الكُلِّيَّةُ | faculty, college | al-kulliyyatu | f
كُلِّيَّةُ الطِّبِّ | Faculty of Medicine | kulliyyatu t-tibbi | phrase
كُلِّيَّةُ الهَنْدَسَةِ | Faculty of Engineering | kulliyyatu l-handasati | phrase
كُلِّيَّةُ التِّجَارَةِ | Faculty of Commerce | kulliyyatu t-tijarati | phrase
كُلِّيَّةُ الشَّرِيعَةِ | Faculty of Islamic Law | kulliyyatu sh-shariati | phrase
نَصْرَانِيٌّ | Christian | nasraniyyun | m | نَصَارَى
النَّبِيُّ | Prophet | an-nabiyyu | m
الدِّينُ | religion | ad-dinu | m
شَفَاهُ اللّٰهُ | may Allah grant him health | shafahu l-lahu | phrase
مَنْ أَنْتُمْ؟ | who are you? | man antum | phrase
أَيْنَ بَيْتُكُمْ يَا إِخْوَانُ؟ | brothers, where is your house? | ayna baytukum ya ikhwanu | phrase
اللّٰهُ رَبُّنَا | Allah is our Lord | al-lahu rabbuna | phrase
الإِسْلَامُ دِينُنَا | Islam is our faith | al-islamu dinuna | phrase
بَيْتُ الإِمَامِ الجَدِيدُ | the imam's new house | baytu l-imami l-jadidu | phrase |  | adjective is nominative, qualifies the mudaf
بَيْتُ الإِمَامِ الجَدِيدِ | the new imam's house | baytu l-imami l-jadidi | phrase |  | adjective is genitive, qualifies the mudaf ilaihi
أَيُّ بَيْتٍ هٰذَا؟ | which house is this? | ayyu baytin hadha | phrase
مِنْ أَيِّ بَلَدٍ أَنْتَ؟ | which country are you from? | min ayyi baladin anta | phrase
`,
  },
  {
    number: 15,
    grammarNote: "أَنْتُنَّ you feminine plural, كُنَّ your, ذَهَبْتُنَّ. قَبْلَ before and بَعْدَ after are always mudaf, genitive follows. رَجَعَ he returned.",
    block: `
أَنْتُنَّ | you (feminine plural) | antunna | phrase
ذَهَبْتُنَّ | you went (feminine plural) | dhahabtunna | phrase
قَبْلَ | before | qabla | phrase |  | always mudaf, genitive follows
رَجَعَ | he returned | rajaa | phrase |  | verb
الأُسْبُوعُ | week | al-usbuu | m
الدَّرْسُ | lesson | ad-darsu | m
الاخْتِبَارُ | examination | al-khtibaru | m |  | begins with hamzatu l-wasl
مَنْ أَنْتُنَّ يَا أَخَوَاتِي؟ | who are you, sisters? | man antunna ya akhawati | phrase
نَحْنُ بَنَاتُ الإِمَامِ | we are the imam's daughters | nahnu banatu l-imami | phrase
بَعْدَ الدَّرْسِ | after the lesson | bada d-darsi | phrase
قَبْلَ الصَّلَاةِ | before the prayer | qabla s-salati | phrase
ذَهَبْتُ إِلَى المَسْجِدِ قَبْلَ الأَذَانِ وَرَجَعْتُ بَعْدَ الصَّلَاةِ | I went to the mosque before the adhan and returned after the salat | dhahabtu ila l-masjidi qabla l-adhani warajatu bada s-salati | phrase
`,
  },
  {
    number: 16,
    grammarNote: "rational versus irrational nouns. Plurals of irrational nouns (things, animals) are treated as feminine singular: هٰذِهِ كُتُبٌ, هِيَ صَغِيرَةٌ. Plurals of rational nouns take plural pronouns. New broken plural pattern مَفَاعِلُ with no tanwin.",
    block: `
الفُنْدُقُ | hotel | al-funduqu | m | فَنَادِقُ
النَّهْرُ | river | an-nahru | m
البَحْرُ | sea | al-bahru | m
الطَّائِرَةُ | airplane | at-tairatu | f
مَسَاجِدُ | mosques | masajidu | m |  | plural of مَسْجِدٌ, no tanwin
دَفَاتِرُ | notebooks | dafatiru | m |  | plural of دَفْتَرٌ, no tanwin
هٰؤُلَاءِ طُلَّابٌ جُدُدٌ، هُمْ صِغَارٌ | these are new students, they are young | haulai tullabun jududun, hum sigharun | phrase |  | rational plural takes plural pronoun
هٰذِهِ كُتُبٌ جَدِيدَةٌ، هِيَ صَغِيرَةٌ | these are new books, they are small | hadhihi kutubun jadidatun, hiya saghiratun | phrase |  | irrational plural is feminine singular
الطُّلَّابُ خَرَجُوا | the students went out | at-tullabu kharaju | phrase
الكِلَابُ خَرَجَتْ | the dogs went out | al-kilabu kharajat | phrase |  | irrational plural takes feminine singular verb
`,
  },
  {
    number: 17,
    grammarNote: "continuation of Lesson 16, no new constructions.",
    block: `
الشَّرِكَةُ | firm, company | ash-sharikatu | f
مُدِيرُ الشَّرِكَةِ | director of the company | mudiru sh-sharikati | phrase
رَخِيصٌ | cheap | rakhisun
يَابَانِيَّةٌ | Japanese (feminine) | yabaniyyatun | f
قُمْصَانٌ | shirts | qumsanun | m |  | plural of قَمِيصٌ
حُمُرٌ | donkeys | humurun | m |  | plural of حِمَارٌ, also حَمِيرٌ
`,
  },
  {
    number: 18,
    grammarNote: "the dual, ending -aani. هٰذَانِ dual of هٰذَا, هَاتَانِ of هٰذِهِ, هُمَا of هُوَ and هِيَ. Adjectives qualifying a dual are dual. كَمْ how many, followed by a singular accusative noun; with tanwin it takes an unpronounced alif (كَمْ كِتَابًا) except after round ta.",
    block: `
كَمْ | how many | kam | phrase |  | singular accusative noun follows
هٰذَانِ | these two (masculine) | hadhani | phrase
هَاتَانِ | these two (feminine) | hatani | phrase
هُمَا | they two | huma | phrase |  | dual of هُوَ and هِيَ
بَيْتَانِ | two houses | baytani | phrase |  | dual ends in -aani
أَخَوَانِ | two brothers | akhawani | phrase |  | dual of أَخٌ
العَجَلَةُ | wheel | al-ajalatu | f
العِيدُ | festival | al-idu | m
السَّنَةُ | year | as-sanatu | f
المِسْطَرَةُ | ruler | al-mistaratu | f
السَّبُّورَةُ | writing board | as-sabburatu | f
الرِّيَالُ | riyal | ar-riyalu | m
الحَيُّ | city district | al-hayyu | m
الرَّكْعَةُ | rakah (part of salat) | ar-rakatu | f | رَكَعَاتٌ | second letter sukun in singular, fathah in plural
مَنْ هٰذَانِ الوَلَدَانِ؟ هُمَا طَالِبَانِ جَدِيدَانِ | who are these two boys? they are two new students | man hadhani l-waladani? huma talibani jadidani | phrase |  | dual adjective for dual noun
كَمْ كِتَابًا؟ | how many books? | kam kitaban | phrase |  | accusative singular with alif
كَمْ سَيَّارَةً؟ | how many cars? | kam sayyaratan | phrase |  | round ta takes no alif
كَمْ قَلَمًا عِنْدَكَ؟ عِنْدِي قَلَمَانِ | how many pens have you? I have two pens | kam qalaman indaka? indi qalamani | phrase
`,
  },
  {
    number: 19,
    grammarNote: "numbers 3 to 10 with a masculine noun. The number is mudaf, the counted noun (madud) is plural genitive. وَاحِدٌ and اِثْنَانِ follow the noun as adjectives.",
    block: `
وَاحِدٌ | one | wahidun | phrase |  | follows the noun as an adjective
اِثْنَانِ | two | ithnani | phrase |  | usually omitted, dual form is enough
ثَلَاثَةُ | three | thalathatu | phrase |  | with masculine madud
أَرْبَعَةُ | four | arbaatu | phrase
خَمْسَةُ | five | khamsatu | phrase
عَشَرَةُ | ten | asharatu | phrase
كُلٌّ | all | kullun | phrase
كُلُّهُمْ | all of them | kulluhum | phrase
كُلُّكُمْ | all of you | kullukum | phrase
كُلُّنَا | all of us | kulluna | phrase
البَلَدُ | country | al-baladu | m | بِلَادٌ
مُخْتَلِفٌ | different | mukhtalifun
الحَافِلَةُ | bus | al-hafilatu | f
مِنْهُمْ | of them | minhum | phrase |  | literally from them
أُورُبَّا | Europe | urubba | f
شُكْرًا | thanks | shukran | phrase
اليَوْمُ | day | al-yawmu | m | أَيَّامٌ
الثَّمَنُ | price | ath-thamanu | m
النِّصْفُ | half | an-nisfu | m
القِرْشُ | qirsh, tenth of a riyal | al-qirshu | m | قُرُوشٌ
قُدَامَى | old (plural) | qudama |  |  | plural of قَدِيمٌ
الرَّاكِبُ | passenger | ar-rakibu | m | رُكَّابٌ
السُّؤَالُ | question | as-sualu | m
الجَيْبُ | pocket | al-jaybu | m
كِتَابٌ وَاحِدٌ | one book | kitabun wahidun | phrase
ثَلَاثَةُ كُتُبٍ | three books | thalathatu kutubin | phrase |  | number is mudaf, madud is plural genitive
عَشَرَةُ رِجَالٍ | ten men | asharatu rijalin | phrase
خَرَجَ ثَلَاثَةُ طُلَّابٍ | three students went out | kharaja thalathatu tullabin | phrase
كَمْ ثَمَنُ هٰذَا؟ | what is the price of this? | kam thamanu hadha | phrase
`,
  },
  {
    number: 20,
    grammarNote: "numbers 3 to 10 with a feminine madud drop the round ta: ثَلَاثُ بَنَاتٍ. ثَمَانِي has sukun on the last letter. Feminine of وَاحِدٌ is وَاحِدَةٌ, of اِثْنَانِ is اِثْنَتَانِ.",
    block: `
ثَلَاثُ | three (feminine madud) | thalathu | phrase |  | ta dropped before feminine nouns
وَاحِدَةٌ | one (feminine) | wahidatun | phrase
اِثْنَتَانِ | two (feminine) | ithnatani | phrase
كَلِمَةٌ | word | kalimatun | f | كَلِمَاتٌ
مَجَلَّةٌ | magazine, journal | majallatun | f
حَرْفٌ | letter of the alphabet | harfun | m | حُرُوفٌ
غُرَفٌ | rooms | ghurafun | f |  | plural of غُرْفَةٌ
دُرُوسٌ | lessons | durusun | m |  | plural of دَرْسٌ
أَعْمَامٌ | paternal uncles | amamun | m |  | plural of عَمٌّ
ثَلَاثَةُ أَبْنَاءٍ | three sons | thalathatu abnain | phrase |  | masculine keeps the ta
ثَلَاثُ بَنَاتٍ | three daughters | thalathu banatin | phrase |  | feminine drops the ta
لِي أُخْتٌ وَاحِدَةٌ | I have one sister | li ukhtun wahidatun | phrase
`,
  },
  {
    number: 21,
    grammarNote: "test lesson, no new constructions.",
    block: `
ذَاكَ | that | dhaka | phrase |  | same as ذٰلِكَ
وَاسِعٌ | spacious | wasiun
آسِيَا | Asia | asiya | f
اللَّوْنُ | colour | al-lawnu | m | أَلْوَانٌ
نُحِبُّ | we love | nuhibbu | phrase
نُحِبُّهُ | we love him | nuhibbuhu | phrase
`,
  },
  {
    number: 22,
    grammarNote: "diptotes, nouns and adjectives that never take tanwin and take one dammah: feminine proper nouns, masculine proper nouns in ة or -aan or the afal pattern, adjectives on falaan and afal patterns, non-Arabic proper nouns, and the broken plural patterns afilaau, fualaau, mafaailu, mafaaiilu.",
    block: `
أَحْمَرُ | red | ahmaru |  |  | diptote, afal pattern
أَزْرَقُ | blue | azraqu |  |  | diptote
أَخْضَرُ | green | akhdaru |  |  | diptote
أَسْوَدُ | black | aswadu |  |  | diptote
أَصْفَرُ | yellow | asfaru |  |  | diptote
أَبْيَضُ | white | abyadu |  |  | diptote
قَالَ | he said | qala | phrase |  | verb
قَالَتْ | she said | qalat | phrase |  | verb
بَغْدَادُ | Baghdad | baghdadu | f |  | diptote
جِدَّةُ | Jeddah | jiddatu | f |  | diptote
فِنْجَانٌ | tea cup | finjanun | m | فَنَاجِينُ | plural is a diptote
دَقِيقَةٌ | minute | daqiqatun | f | دَقَائِقُ | plural is a diptote
مَنَادِيلُ | kerchiefs | manadilu | m |  | plural of مِنْدِيلٌ, diptote
مَفَاتِيحُ | keys | mafatihu | m |  | plural of مِفْتَاحٌ, diptote
`,
  },
  {
    number: 23,
    grammarNote: "a diptote in the genitive takes fathah instead of kasrah: مِنْ أَحْمَدَ, كِتَابُ إِبْرَاهِيمَ, ثَلَاثَةُ مَسَاجِدَ.",
    block: `
الطَّائِفُ | Taif | at-taifu | f
إِصْطَنْبُولُ | Istanbul | istanbulu | f |  | diptote
وَاشِنْطُنُ | Washington | washintunu | f |  | diptote
مِنْ بِلَالٍ | from Bilal | min bilalin | phrase |  | ordinary noun, genitive -in
مِنْ أَحْمَدَ | from Ahmad | min ahmada | phrase |  | diptote, genitive takes fathah
كِتَابُ إِبْرَاهِيمَ | Ibrahim's book | kitabu ibrahima | phrase |  | diptote mudaf ilaihi takes fathah
ثَلَاثَةُ مَسَاجِدَ | three mosques | thalathatu masajida | phrase |  | diptote madud takes fathah
`,
  },
];
