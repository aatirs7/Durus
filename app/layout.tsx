import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Amiri, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitch } from "@/components/theme-switch";
import { DesktopShell } from "@/components/desktop-shell";
import { RailDue } from "@/components/rail-due";
import "./globals.css";

/*
  Amiri uses display block rather than swap on purpose. A fallback Arabic
  face flashing before Amiri loads is worse than a short wait, because the
  letterforms shift and the eye rereads the word.
*/
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "block",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const satoshi = localFont({
  variable: "--font-satoshi",
  src: "./fonts/Satoshi-Variable.woff2",
  weight: "300 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Durus",
  description: "Arabic revision for Madinah Book 1",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Durus",
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/splash-light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/splash-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  /*
    The browser tab carries the same mark as the home screen icon, the
    word دُرُوس in Amiri. Light gets lapis on paper, dark gets the
    inversion, paper on lapis, so the tab reads either way round without
    a paper square glowing on a dark tab strip.

    app/favicon.ico is deliberately absent. The file convention would
    win over this block and there is no way to give it a dark variant.
  */
  icons: {
    icon: [
      {
        url: "/icon-32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-32-dark.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon-192-dark.png",
        sizes: "192x192",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    /*
      Next emits the modern mobile-web-app-capable. iOS before 16.4 only
      understands the apple prefixed one, and it is what actually strips
      the Safari chrome on an older phone, so both are set.
    */
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1efe9" },
    { media: "(prefers-color-scheme: dark)", color: "#131722" },
  ],
};

/*
  The document stays LTR. Arabic gets dir="rtl" on its own element,
  through the Arabic component, and nowhere else.
*/
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${amiri.variable} ${plexMono.variable} ${satoshi.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ThemeSwitch />
          {/*
            The rail is desktop only and renders nothing below 1024px,
            so the mobile document is what it always was.
          */}
          <DesktopShell
            due={
              <Suspense fallback={null}>
                <RailDue />
              </Suspense>
            }
          >
            {children}
          </DesktopShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
