import { cookies } from "next/headers";
import type { MetadataRoute } from "next";
import { PAPER, THEME_COOKIE, isResolvedTheme } from "@/lib/theme";

/*
  background_color matches --paper in the light palette. Without it iOS
  paints white behind the splash on a cold launch, and pure white is
  against the rules.
*/
/*
  Read per request, so background_color tracks the theme. It is the
  colour iOS paints when no launch image matches, and on Android it is
  the whole splash, so a static light value here undoes the rest.
*/
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const jar = await cookies();
  const value = jar.get(THEME_COOKIE)?.value;
  const paper = isResolvedTheme(value) ? PAPER[value] : PAPER.light;

  return {
    id: "/",
    name: "Durus",
    short_name: "Durus",
    description: "Arabic revision for Madinah Book 1",
    start_url: "/today?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: paper,
    theme_color: paper,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
