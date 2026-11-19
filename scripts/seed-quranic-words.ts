/*
  Seeds the iOS app's Quranic Words track into Neon. See lib/seed-quranic-words.ts.

  Run with: npx tsx --env-file=.env.local scripts/seed-quranic-words.ts
*/
import { seedQuranicWords } from "../lib/seed-quranic-words";

seedQuranicWords()
  .then((r) => {
    console.log(`stages ${r.stages}, cards ${r.cards}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
