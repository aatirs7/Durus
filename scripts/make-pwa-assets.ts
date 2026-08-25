/*
  Generates the PWA icons and the iOS splash screens.

  The mark is the word دُرُوس set in Amiri, lapis on paper, with wide
  margins. No gradient and no rounded rectangle drawn into the art,
  because iOS masks the icon itself and drawing our own corners would
  show up as a double rounding.

  Run with: npx tsx scripts/make-pwa-assets.ts
*/

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { DEVICES, splashPixels } from "../lib/splash";

const FONT = join(import.meta.dirname, "assets", "Amiri-Regular.ttf");
const OUT = join(import.meta.dirname, "..", "public");

// The tokens, repeated here because an SVG cannot read a CSS variable.
// These must match --paper and --lapis in app/globals.css.
const PAPER_LIGHT = "#F6F4EF";
const PAPER_DARK = "#131722";
const LAPIS_LIGHT = "#2A4A8B";
const LAPIS_DARK = "#7FA0DC";

/*
  The two dammas are drawn as separate glyphs at measured offsets, instead of
  being typed into the word.

  resvg does not apply Amiri's mark positioning: handed the vowelled string
  "دُرُوس" it lays the harakat out on their own advances, so both float above and
  to the right of the letters they belong to, and drag the word off its optical
  centre. Every icon and launch image this script has ever produced carried that
  artifact. It is a limitation of this PNG pipeline only - the app's own Arabic
  is laid out by the browser and positions marks correctly - but these are PNGs,
  so they have to work around it.

  Every offset is a fraction of the font size, so the construction scales. They
  were measured rather than guessed: the word was rendered once with each letter
  in its own colour, the letters located by their pixels, and the marks placed a
  hair above the tops of the dal and the waw.

  The iOS app generates the same mark from the same numbers, in
  scripts/make-brand-assets.ts in the DurusIOS repo. The two appear side by side
  on one home screen, so they have to agree: change the geometry here and change
  it there.
*/
const WORD = "دروس";
const DAMMA = "&#x064F;";

/* Mark offsets from the word's centre and baseline, in multiples of font size. */
const DAL_DAMMA = { dx: 0.6533, dy: 0.4 };
const WAW_DAMMA = { dx: -0.25, dy: 0.5 };

/* Ink extents of the composed mark, in multiples of font size, and the visual
   centre that follows from them - so the whole thing is centred as one piece
   rather than centred on the word and left top heavy. */
const INK_ABOVE_BASELINE = 0.7467;
const INK_BELOW_BASELINE = 0.2267;
const CENTRE_ABOVE_BASELINE = (INK_ABOVE_BASELINE - INK_BELOW_BASELINE) / 2;

/*
  The word and its two marks, centred horizontally on cx and sitting on the
  given baseline. Everything that draws the mark goes through here, so the
  icons and the launch images cannot drift apart.
*/
function markSvg(cx: number, baseline: number, fontSize: number, fill: string): string {
  const damma = (o: { dx: number; dy: number }) =>
    `<text x="${cx + o.dx * fontSize}" y="${baseline + o.dy * fontSize}" text-anchor="middle"
        font-family="Amiri" font-size="${fontSize}" fill="${fill}">${DAMMA}</text>`;

  return `<text x="${cx}" y="${baseline}" text-anchor="middle"
        direction="rtl" font-family="Amiri" font-size="${fontSize}"
        fill="${fill}">${WORD}</text>
  ${damma(DAL_DAMMA)}
  ${damma(WAW_DAMMA)}`;
}

/* The baseline that puts the composed mark's visual centre on a canvas's. */
function centredBaseline(height: number, fontSize: number): number {
  return Math.round(height / 2 + CENTRE_ABOVE_BASELINE * fontSize);
}

function iconSvg(
  size: number,
  opts: { maskable?: boolean; invert?: boolean; scale?: number } = {},
): string {
  // A maskable icon has to survive iOS and Android cropping to a circle,
  // so the word sits inside the 80 percent safe zone.
  const scale = opts.scale ?? (opts.maskable ? 0.26 : 0.34);
  const fontSize = Math.round(size * scale);
  // The favicon inverts for a dark tab strip: paper on lapis rather
  // than lapis on paper. Same mark, same two colours, swapped.
  const ground = opts.invert ? LAPIS_LIGHT : PAPER_LIGHT;
  const mark = opts.invert ? PAPER_LIGHT : LAPIS_LIGHT;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${ground}"/>
  ${markSvg(size / 2, centredBaseline(size, fontSize), fontSize, mark)}
</svg>`;
}

function splashSvg(w: number, h: number, dark: boolean): string {
  const fontSize = Math.round(Math.min(w, h) * 0.16);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${dark ? PAPER_DARK : PAPER_LIGHT}"/>
  ${markSvg(w / 2, centredBaseline(h, fontSize), fontSize, dark ? LAPIS_DARK : LAPIS_LIGHT)}
</svg>`;
}

function render(svg: string, width: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: "Amiri" },
  });
  return Buffer.from(resvg.render().asPng());
}

function write(name: string, buf: Buffer) {
  writeFileSync(join(OUT, name), buf);
  console.log(`  ${name} (${(buf.length / 1024).toFixed(1)} kB)`);
}

mkdirSync(OUT, { recursive: true });

console.log("icons:");
write("apple-touch-icon.png", render(iconSvg(180), 180));
write("icon-192.png", render(iconSvg(192), 192));
write("icon-512.png", render(iconSvg(512), 512));
write("icon-512-maskable.png", render(iconSvg(512, { maskable: true }), 512));

/*
  Favicons. Same mark as the home screen icon, drawn a little larger in
  its square because a browser tab renders it at about sixteen points
  and the 34 percent word turns to a smudge at that size. The 32px file
  is what a tab actually uses, the 192 is for bookmarks and high DPI.
*/
write("icon-32.png", render(iconSvg(128, { scale: 0.46 }), 32));
write("icon-32-dark.png", render(iconSvg(128, { scale: 0.46, invert: true }), 32));
write("icon-192-dark.png", render(iconSvg(192, { invert: true }), 192));

/*
  One launch image per device, per theme.

  iOS only uses an apple-touch-startup-image whose media query matches
  the device exactly, and paints the manifest background colour when
  nothing does. Shipping two sizes meant almost every phone fell back to
  that colour, which is why a dark app was launching behind a light
  splash.
*/
console.log("splash:");
for (const device of DEVICES) {
  const { w, h } = splashPixels(device);
  for (const dark of [false, true]) {
    const name = `splash-${device.name}-${dark ? "dark" : "light"}.png`;
    write(name, render(splashSvg(w, h, dark), w));
  }
}

/*
  The original two filenames, kept as real files.

  iOS caches the launch image tags from when the app was added to the
  home screen, so a phone installed before the per device set existed is
  still asking for these. Renaming them out from under it does not fall
  back to anything: the request 404s and the launch screen is black.

  Sized for the 14 Pro class panel, which is what they were.
*/
for (const dark of [false, true]) {
  write(
    `splash-${dark ? "dark" : "light"}.png`,
    render(splashSvg(1179, 2556, dark), 1179),
  );
}

console.log("done");
