import type { MetadataRoute } from "next";

/*
  background_color matches --paper in the light palette. Without it iOS
  paints white behind the splash on a cold launch, and pure white is
  against the rules.
*/
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Durus",
    short_name: "Durus",
    description: "Arabic revision for Madinah Book 1",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F1EFE9",
    theme_color: "#F1EFE9",
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
