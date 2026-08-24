"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/* The review card face stays bare. Nothing to tap but the card. */
const HIDDEN_ON = ["/review"];

/*
  A sun and a moon in the corner of every screen. It sits fixed rather
  than in the flow so it never shifts a layout, and it clears the top
  safe area so it does not tuck under the Dynamic Island.

  Two states only, light and dark. System is still available in Settings
  for anyone who wants it, but a corner control that cycles three ways
  is a control you have to think about.
*/
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  // Render the frame before mount so nothing jumps in, but leave it
  // empty, because the resolved theme is not known on the server.
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="border-rule bg-surface active:bg-surface-sunk fixed right-4 z-20 flex size-10 items-center justify-center rounded-[999px] border transition-colors"
      style={{ top: "max(1rem, calc(env(safe-area-inset-top) + 0.25rem))" }}
    >
      {!mounted ? null : dark ? <Sun /> : <Moon />}
    </button>
  );
}

function Sun() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--saffron)"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
    </svg>
  );
}

function Moon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--lapis)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 13.4A8.2 8.2 0 1 1 10.6 4a6.6 6.6 0 0 0 9.4 9.4z" />
    </svg>
  );
}
