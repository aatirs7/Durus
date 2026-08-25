"use client";

import { useState } from "react";
import { TOTAL_LESSONS } from "@/lib/constants";

/*
  The same fork the app's onboarding asks, asked here first.

  Two people arrive at this page and they are not looking for the same thing.
  One is in a Madinah class and wants to know whether this keeps up with their
  syllabus. The other has no class, wants to read Fusha, and needs to know that
  this is a place to start rather than a companion to a book they do not own.

  One headline cannot be true for both, and the usual fix - writing something
  vague enough to cover both - is true for neither. So it is a switch, and the
  copy underneath it changes.

  Client side because it is a preference held for the length of a glance. There
  is nothing to persist and nothing to route: the sign up it leads to is the
  same either way, and the app asks the question again where it actually
  changes what happens.
*/

type Path = "class" | "self";

const COPY: Record<Path, { title: string; body: string }> = {
  class: {
    title: "Arabic revision that keeps up with your class",
    body: `Tell Durus which lesson your teacher is on and it never shows you a word from beyond it. The newest lesson stays in tight rotation for the fortnight after you reach it, because that is the one you are about to be tested on. Book 1's ${TOTAL_LESSONS} lessons today, with Book 2 and Book 3 to follow.`,
  },
  self: {
    title: "Learn Fusha Arabic from the beginning",
    body: "No class, no teacher, no deadline. Start at the first lesson and set your own pace, and Durus brings each word back just before you would have forgotten it. The vocabulary is the Madinah course, which is the same ground a class covers — you are simply walking it yourself.",
  },
};

const OPTIONS: { value: Path; label: string }[] = [
  { value: "class", label: "I am in a class" },
  { value: "self", label: "I am learning on my own" },
];

export function LearnerSwitch() {
  const [path, setPath] = useState<Path>("class");
  const copy = COPY[path];

  return (
    <div className="flex flex-col items-center gap-4 lg:items-start">
      {/*
        A segmented pair rather than two links. Switching is reading, not
        navigating - nothing below it is a different page.
      */}
      <div
        role="tablist"
        aria-label="How are you learning?"
        className="border-rule bg-surface-sunk inline-flex rounded-[999px] border p-1"
      >
        {OPTIONS.map((option) => {
          const on = option.value === path;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setPath(option.value)}
              className="rounded-[999px] px-4 py-1.5 text-[13px] transition-colors"
              style={{
                backgroundColor: on ? "var(--lapis)" : "transparent",
                color: on ? "var(--paper)" : "var(--ink-soft)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 lg:items-start">
        <h1 className="text-ink text-[28px] leading-tight font-medium tracking-tight lg:text-[36px]">
          {copy.title}
        </h1>
        <p className="text-ink-soft max-w-[460px] text-[16px] leading-relaxed">
          {copy.body}
        </p>
      </div>
    </div>
  );
}
