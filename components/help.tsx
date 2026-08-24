"use client";

import { useCallback, useEffect, useState } from "react";
import { OVERLAY_ATTR, isPlainKey, isTyping } from "@/lib/keys";

/*
  What each drill is for, in the fewest lines that answer it.

  The panel opens by itself the first time you enter a mode and never
  again, and the question mark in the corner brings it back. A help
  screen you have to go looking for is a help screen nobody reads, and
  one that opens every time is a door you have to close.

  The desktop spec says no modals. This is the exception the spec did
  not know about, asked for directly: it is a single dismissible panel
  over a drill, not a flow.
*/

type Mode = "review" | "speed" | "cases";

const HELP: Record<
  Mode,
  { title: string; purpose: string; points: string[]; keys?: string[] }
> = {
  review: {
    title: "Review",
    purpose: "The words you have been taught, on a schedule.",
    points: [
      "Look at the card, recall the meaning, then reveal it.",
      "Grade honestly. Again brings the card back before the session ends, Easy pushes it furthest away.",
      "The time above each grade is when you would next see this card.",
    ],
    keys: [
      "space  reveal",
      "1 2 3 4  grade",
      "u  undo",
      "h  harakat",
      "esc  end",
    ],
  },
  speed: {
    title: "Speed drill",
    purpose: "Recognition against a clock.",
    points: [
      "A word shows for the length of your window, then blurs out.",
      "Say whether you knew it. Nothing is graded and no schedule moves.",
      "This measures how fast the meaning arrives, not whether you can work it out.",
    ],
    keys: ["←  missed it", "→  knew it"],
  },
  cases: {
    title: "Case drill",
    purpose: "The ending, not the word.",
    points: [
      "A sentence appears with its final harakah blanked out.",
      "Choose raf', nasb, or jarr.",
      "This tests the rule, so it never touches your card schedule.",
    ],
  },
};

function seenKey(mode: Mode) {
  return `durus.help.${mode}`;
}

export function Help({ mode }: { mode: Mode }) {
  const [open, setOpen] = useState(false);
  const help = HELP[mode];

  // First time in this mode, the panel introduces itself.
  useEffect(() => {
    try {
      if (localStorage.getItem(seenKey(mode)) !== "1") setOpen(true);
    } catch {
      // Storage is blocked. The corner is still there.
    }
  }, [mode]);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(seenKey(mode), "1");
    } catch {
      // Nothing to do. It opens once more next time.
    }
  }, [mode]);

  // While the panel is up, every other key handler stands down.
  useEffect(() => {
    if (!open) return;
    document.body.setAttribute(OVERLAY_ATTR, "help");
    return () => document.body.removeAttribute(OVERLAY_ATTR);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || !isPlainKey(e)) return;
      if (open && (e.key === "Escape" || e.key === " ")) {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (!open && e.key === "?") {
        e.preventDefault();
        setOpen(true);
      }
    }
    // Capture, so this runs before the drill's own handler.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`What is the ${help.title.toLowerCase()} for`}
        className="border-rule bg-surface text-ink-soft hover:bg-surface-sunk active:bg-surface-sunk fixed right-16 z-20 flex size-10 items-center justify-center rounded-[999px] border text-[15px] transition-colors"
        style={{ top: "max(1rem, calc(env(safe-area-inset-top) + 0.25rem))" }}
      >
        ?
      </button>

      {open ? (
        <div
          className="bg-paper/92 fixed inset-0 z-30 flex items-center justify-center px-6"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={help.title}
            onClick={(e) => e.stopPropagation()}
            className="border-rule bg-surface flex w-full max-w-[400px] flex-col gap-5 rounded-[16px] border px-7 py-7"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-ink text-[22px] font-medium">{help.title}</h2>
              <p className="text-ink-soft text-[16px]">{help.purpose}</p>
            </div>

            <hr className="border-rule border-t" />

            <ul className="flex flex-col gap-3 text-left">
              {help.points.map((point) => (
                <li
                  key={point}
                  className="text-ink text-[15px] leading-relaxed"
                >
                  {point}
                </li>
              ))}
            </ul>

            {/*
              The keys are only worth showing where there are keys. The
              full map lives in Settings.
            */}
            {help.keys ? (
              <div className="hidden flex-col gap-1 lg:flex">
                <hr className="border-rule mb-2 border-t" />
                {help.keys.map((line) => (
                  <p
                    key={line}
                    className="tabular text-ink-faint text-left text-[12px]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={close}
              className="bg-lapis text-paper mt-1 rounded-[12px] px-5 py-3 text-[15px] font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
