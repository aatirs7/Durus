/*
  The theme choice, mirrored into a cookie.

  next-themes keeps the choice in localStorage, which the server cannot
  read, and the server is the only place that can decide which splash
  screen and which theme colour go into the document. iOS picks the
  startup image from the markup, long before any of our JavaScript runs,
  so a light splash in front of a dark app can only be fixed here.

  The cookie holds the resolved theme, light or dark, never "system".
  What the splash has to match is what the screen will actually look
  like, not the setting that produced it.
*/

export const THEME_COOKIE = "durus_theme";

export type ResolvedTheme = "light" | "dark";

export function isResolvedTheme(value: unknown): value is ResolvedTheme {
  return value === "light" || value === "dark";
}

/*
  --paper from each palette. The only other place a colour is written
  outside globals.css, because a meta tag cannot read a CSS variable.
  These two must track --paper in app/globals.css.
*/
export const PAPER: Record<ResolvedTheme, string> = {
  light: "#f6f4ef",
  dark: "#131722",
};

