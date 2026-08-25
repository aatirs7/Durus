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

const WORD = "دُرُوس";

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
  <text x="50%" y="${Math.round(size * 0.5 + fontSize * 0.3)}" text-anchor="middle"
        direction="rtl" font-family="Amiri" font-size="${fontSize}"
        fill="${mark}">${WORD}</text>
</svg>`;
}

function splashSvg(w: number, h: number, dark: boolean): string {
  const fontSize = Math.round(Math.min(w, h) * 0.16);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${dark ? PAPER_DARK : PAPER_LIGHT}"/>
  <text x="50%" y="${Math.round(h * 0.5 + fontSize * 0.3)}" text-anchor="middle"
        direction="rtl" font-family="Amiri" font-size="${fontSize}"
        fill="${dark ? LAPIS_DARK : LAPIS_LIGHT}">${WORD}</text>
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

console.log("done");
