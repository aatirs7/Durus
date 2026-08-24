"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { THEME_COOKIE, isResolvedTheme } from "@/lib/theme";

/*
  Writes the resolved theme to a cookie whenever it changes, so the next
  document the server renders carries the matching splash screen and
  theme colour. Nothing reads this on the client.

  A year, because the installed app should not forget between launches,
  and lax rather than strict so the cookie is there on a cold open from
  the home screen.
*/
export function ThemeCookie() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!isResolvedTheme(resolvedTheme)) return;
    try {
      document.cookie = `${THEME_COOKIE}=${resolvedTheme}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Cookies are blocked. The document falls back to the OS scheme.
    }
  }, [resolvedTheme]);

  return null;
}
