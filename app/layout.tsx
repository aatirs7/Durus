import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Amiri, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSwitch } from "@/components/theme-switch";
import { DesktopShell } from "@/components/desktop-shell";
import { RailDue } from "@/components/rail-due";
import { ThemeCookie } from "@/components/theme-cookie";
import { DEVICES, splashFile, splashMedia } from "@/lib/splash";
import { PAPER, THEME_COOKIE, isResolvedTheme } from "@/lib/theme";
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

/*
  The chosen theme, read from the cookie the client mirrors it into.
  Null before anything has been chosen, in which case the document
  falls back to the operating system scheme the way it always did.
*/
async function chosenTheme() {
  const jar = await cookies();
  const value = jar.get(THEME_COOKIE)?.value;
  return isResolvedTheme(value) ? value : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const theme = await chosenTheme();

  /*
    iOS reads the startup image out of the markup, so a splash can only
    follow the in app theme toggle if the server already knows about it.

    The size still has to come from a media query, because iOS only uses
    an image whose device dimensions match exactly and paints the
    manifest background colour when none does. So there is one link per
    device, and the theme decides which file each of them points at
    rather than adding a colour scheme query on top.
  */
  const startupImage = DEVICES.flatMap((device) =>
    theme
      ? [{ url: splashFile(device, theme), media: splashMedia(device) }]
      : [
          {
            url: splashFile(device, "light"),
            media: `${splashMedia(device)} and (prefers-color-scheme: light)`,
          },
          {
            url: splashFile(device, "dark"),
            media: `${splashMedia(device)} and (prefers-color-scheme: dark)`,
          },
        ],
  );

  return metadataFor(startupImage);
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await chosenTheme();

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
    themeColor: theme
      ? PAPER[theme]
      : [
          { media: "(prefers-color-scheme: light)", color: PAPER.light },
          { media: "(prefers-color-scheme: dark)", color: PAPER.dark },
        ],
  };
}

function metadataFor(
  startupImage: { url: string; media?: string }[],
): Metadata {
  return {
    title: "Durus",
    description: "Arabic revision for the Madinah Arabic course",
    appleWebApp: {
      capable: true,
      title: "Durus",
      statusBarStyle: "black-translucent",
      startupImage,
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
}

/*
  The document stays LTR. Arabic gets dir="rtl" on its own element,
  through the Arabic component, and nowhere else.
*/
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await chosenTheme();

  return (
    /*
      The whole document, so Clerk's session is available to every server
      component and every client component alike. Same instance as the iOS app,
      which is what makes one account cover both.
    */
    <ClerkProvider appearance={clerkAppearance}>
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      /*
        The chosen theme is on the server rendered html element too, so
        the first paint is already the right one. next-themes still runs
        its own script and stays the authority.
      */
      className={`${amiri.variable} ${plexMono.variable} ${satoshi.variable} h-full antialiased${
        theme === "dark" ? " dark" : ""
      }`}
      style={theme ? { colorScheme: theme } : undefined}
    >
      {/*
        The manifest is rendered here rather than through metadata,
        because it needs crossorigin="use-credentials" and the metadata
        field cannot set it.

        A manifest is fetched without credentials by default. Ours is
        generated per request and reads the theme cookie to decide its
        background colour, so without this it was always handed the
        light fallback, and that colour is what iOS paints when no
        launch image matches the device.
      */}
      <link
        rel="manifest"
        href="/manifest.webmanifest"
        crossOrigin="use-credentials"
      />

      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ThemeCookie />
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
    </ClerkProvider>
  );
}
