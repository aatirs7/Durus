import { transliterate } from "../lib/transliterate";
const w = "التُّفَّاحُ";
console.log([...w].map((c, i) => `${i}:${c.charCodeAt(0).toString(16)}`).join(" "));
console.log("got:", transliterate(w));
