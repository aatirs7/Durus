import { cookies } from "next/headers";
import { PAPER, THEME_COOKIE, isResolvedTheme } from "@/lib/theme";

/*
  A route handler rather than app/manifest.ts.

  The file convention makes Next emit its own <link rel="manifest">,
  which cannot carry crossorigin="use-credentials". Without that
  attribute the manifest is fetched without cookies, the theme cookie
  never arrives, and the background colour is always the light fallback.
  Since that colour is what iOS paints when no launch image matches the
  device, the splash could never follow the theme.

  Serving it here means the only manifest link is the one in the layout,
  and that one asks for credentials.
*/
export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const value = jar.get(THEME_COOKIE)?.value;
  const paper = isResolvedTheme(value) ? PAPER[value] : PAPER.light;

  const manifest = {
    id: "/",
    name: "Durus",
    short_name: "Durus",
    description: "Arabic revision for the Madinah Arabic course",
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

  return new Response(JSON.stringify(manifest), {
    headers: {
      "content-type": "application/manifest+json",
      // Per account, so it must never be shared by a CDN.
      "cache-control": "private, no-store",
    },
  });
}
