import { SEED_LESSONS } from "../db/seed-data/lessons-1-4";
import { transliterate } from "../lib/transliterate";

let total = 0, exact = 0;
const misses: string[] = [];

for (const l of SEED_LESSONS) {
  for (const raw of l.block.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || !line.includes("|")) continue;
    const f = line.split("|").map((x) => x.trim());
    const [arabic, , expected] = f;
    if (!expected) continue;
    total += 1;
    const got = transliterate(arabic);
    if (got === expected) exact += 1;
    else misses.push(`${arabic}\n    want ${expected}\n    got  ${got}`);
  }
}
console.log(`corpus: ${total}   exact: ${exact}   (${((exact / total) * 100).toFixed(1)}%)`);
console.log("\n--- first 25 misses ---");
for (const m of misses.slice(0, 25)) console.log("  " + m);
