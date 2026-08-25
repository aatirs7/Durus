"use client";

import Link from "next/link";

/*
  The way out of a drill.

  Every drill screen is full height with no chrome, which is right while
  you are answering and wrong the moment you want to stop. On a phone
  there is no rail to click and no keyboard to press escape on, so
  without this the only exit is the browser's back button, and in an
  installed app there is not one of those either.

  Top left, mirroring the question mark and the theme switch on the
  right, and clear of the safe area so it is not under the notch.
*/
export function ExitDrill({ label = "Today" }: { label?: string }) {
  return (
    <Link
      href="/today"
      aria-label={`Leave this drill and go back to ${label}`}
      className="text-ink-soft hover:text-ink active:text-ink fixed left-4 z-20 flex h-10 items-center gap-1.5 rounded-[999px] pr-3 pl-2 text-[15px] opacity-70 transition-opacity hover:opacity-100"
      style={{ top: "max(1rem, calc(env(safe-area-inset-top) + 0.25rem))" }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {/*
        The word is hidden on a phone, where the arrow is unambiguous
        and the space is worth more than the label.
      */}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
