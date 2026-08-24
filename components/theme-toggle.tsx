"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const OPTIONS = ["light", "dark", "system"] as const;

/*
  Lives in Settings and on the kitchen sink, never in the header.
  next-themes persists the choice to localStorage on its own.
*/
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="border-rule bg-surface-sunk mx-auto inline-flex rounded-[999px] border p-1">
      {OPTIONS.map((option) => {
        const active = mounted && theme === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            className={`rounded-[999px] px-4 py-1.5 text-[13px] capitalize transition-colors ${
              active ? "bg-lapis text-paper" : "text-ink-soft"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
