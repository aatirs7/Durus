import type { Metadata, Viewport } from "next";
import { Amiri, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
