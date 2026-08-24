"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OVERLAY_ATTR, isPlainKey, isTyping } from "@/lib/keys";

/*
  What each drill is for, as a few cards you page through rather than a
  wall of prose. Each one carries a small drawing of the actual screen,
  because "four options, one of them right" is a sentence you read and a
  picture you recognise.

  The panel is deliberately small and sits over the drill rather than
  replacing it. You should be able to see what it is talking about.
*/

type Mode = "review" | "speed" | "cases";

type Slide = {
  art: React.ReactNode;
  line: string;
};

/* Small screens drawn in the app's own tokens, never a screenshot. */
const C = {
  frame: "var(--surface)",
  rule: "var(--rule)",
  ink: "var(--ink)",
  faint: "var(--ink-faint)",
  lapis: "var(--lapis)",
  good: "var(--verdigris)",
  bad: "var(--clay)",
  sunk: "var(--surface-sunk)",
};

function Art({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 120"
      width="100%"
      height="120"
      role="presentation"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function Row({
  y,
  fill = C.sunk,
  stroke = C.rule,
  w = 140,
}: {
  y: number;
  fill?: string;
  stroke?: string;
  w?: number;
}) {
  return (
    <rect
      x={(200 - w) / 2}
      y={y}
      width={w}
      height={16}
      rx={6}
      fill={fill}
      stroke={stroke}
    />
  );
}

const SLIDES: Record<
  Mode,
  { title: string; slides: Slide[]; keys?: string[] }
> = {
  review: {
    title: "Review",
    slides: [
      {
        line: "An Arabic word appears on its own. Nothing else, so there is nothing to guess from.",
        art: (
          <Art>
            <rect
              x="20"
              y="14"
              width="160"
              height="92"
              rx="10"
              fill={C.frame}
              stroke={C.rule}
            />
            <text
              x="100"
              y="70"
              textAnchor="middle"
              fill={C.ink}
              fontSize="30"
              fontFamily="var(--font-amiri), serif"
            >
              بَيْت
            </text>
          </Art>
        ),
      },
      {
        line: "Early on you pick the meaning from four. The right one is always marked afterwards.",
        art: (
          <Art>
            <Row y={12} />
            <Row y={38} fill="var(--lapis-wash)" stroke={C.good} />
            <Row y={64} />
            <Row y={90} />
            <circle cx="152" cy="46" r="5" fill={C.good} />
          </Art>
        ),
      },
      {
        line: "Once a word is known it stops offering options and asks you to type the meaning.",
        art: (
          <Art>
            <text
              x="100"
              y="34"
              textAnchor="middle"
              fill={C.ink}
              fontSize="24"
              fontFamily="var(--font-amiri), serif"
            >
              قَلَم
            </text>
            <rect
              x="30"
              y="50"
              width="140"
              height="24"
              rx="8"
              fill={C.sunk}
              stroke={C.lapis}
            />
            <rect x="40" y="59" width="42" height="6" rx="3" fill={C.faint} />
            <rect x="30" y="84" width="140" height="22" rx="8" fill={C.lapis} />
          </Art>
        ),
      },
      {
        line: "There is no self rating. Being right sets the schedule, and how fast you were sets how far out.",
        art: (
          <Art>
            <circle
              cx="100"
              cy="60"
              r="34"
              fill="none"
              stroke={C.sunk}
              strokeWidth="6"
            />
            <circle
              cx="100"
              cy="60"
              r="34"
              fill="none"
              stroke={C.lapis}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="214"
              strokeDashoffset="70"
              transform="rotate(-90 100 60)"
            />
            <text x="100" y="66" textAnchor="middle" fill={C.ink} fontSize="16">
              1.2s
            </text>
          </Art>
        ),
      },
    ],
    keys: ["1 2 3 4  pick", "enter  check", "u  undo", "esc  end"],
  },

  speed: {
    title: "Speed drill",
    slides: [
      {
        line: "A word shows for the length of your window, with the ring draining around it.",
        art: (
          <Art>
            <circle
              cx="100"
              cy="60"
              r="38"
              fill="none"
              stroke={C.sunk}
              strokeWidth="5"
            />
            <circle
              cx="100"
              cy="60"
              r="38"
              fill="none"
              stroke={C.lapis}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="239"
              strokeDashoffset="90"
              transform="rotate(-90 100 60)"
            />
            <text
              x="100"
              y="68"
              textAnchor="middle"
              fill={C.ink}
              fontSize="22"
              fontFamily="var(--font-amiri), serif"
            >
              نَجْم
            </text>
          </Art>
        ),
      },
      {
        line: "When the window closes the word blurs out. However long you stare, it is gone.",
        art: (
          <Art>
            <circle
              cx="100"
              cy="60"
              r="38"
              fill="none"
              stroke={C.sunk}
              strokeWidth="5"
            />
            <text
              x="100"
              y="68"
              textAnchor="middle"
              fill={C.faint}
              fontSize="22"
              opacity="0.3"
              fontFamily="var(--font-amiri), serif"
            >
              نَجْم
            </text>
          </Art>
        ),
      },
      {
        line: "Say whether you knew it. Nothing is graded here and no schedule moves.",
        art: (
          <Art>
            <rect
              x="18"
              y="48"
              width="78"
              height="26"
              rx="9"
              fill={C.frame}
              stroke={C.rule}
            />
            <rect x="104" y="48" width="78" height="26" rx="9" fill={C.lapis} />
            <text
              x="57"
              y="65"
              textAnchor="middle"
              fill={C.faint}
              fontSize="11"
            >
              Missed it
            </text>
            <text
              x="143"
              y="65"
              textAnchor="middle"
              fill={C.frame}
              fontSize="11"
            >
              Knew it
            </text>
          </Art>
        ),
      },
    ],
    keys: ["←  missed it", "→  knew it"],
  },

  cases: {
    title: "Case drill",
    slides: [
      {
        line: "A sentence appears with the final harakah on one noun blanked out.",
        art: (
          <Art>
            <rect
              x="16"
              y="34"
              width="168"
              height="40"
              rx="10"
              fill={C.frame}
              stroke={C.rule}
            />
            <text
              x="100"
              y="60"
              textAnchor="middle"
              fill={C.ink}
              fontSize="17"
              fontFamily="var(--font-amiri), serif"
            >
              فِي البَيْت
            </text>
            <circle
              cx="126"
              cy="44"
              r="4"
              fill="none"
              stroke={C.lapis}
              strokeDasharray="2 2"
            />
          </Art>
        ),
      },
      {
        line: "Choose the ending that belongs there, not the word. Four options, one rule.",
        art: (
          <Art>
            <Row y={30} w={40} />
            <rect
              x="82"
              y="30"
              width="40"
              height="16"
              rx="6"
              fill="var(--lapis-wash)"
              stroke={C.good}
            />
            <Row y={30} w={40} />
            <rect
              x="30"
              y="30"
              width="40"
              height="16"
              rx="6"
              fill={C.sunk}
              stroke={C.rule}
            />
            <rect
              x="134"
              y="30"
              width="40"
              height="16"
              rx="6"
              fill={C.sunk}
              stroke={C.rule}
            />
            <text x="50" y="42" textAnchor="middle" fill={C.faint} fontSize="9">
              marfu
            </text>
            <text x="102" y="42" textAnchor="middle" fill={C.good} fontSize="9">
              majrur
            </text>
            <text
              x="154"
              y="42"
              textAnchor="middle"
              fill={C.faint}
              fontSize="9"
            >
              mansub
            </text>
            <text
              x="100"
              y="80"
              textAnchor="middle"
              fill={C.faint}
              fontSize="10"
            >
              after a preposition
            </text>
          </Art>
        ),
      },
      {
        line: "This tests the grammar, so it never touches your card schedule.",
        art: (
          <Art>
            <rect
              x="40"
              y="34"
              width="120"
              height="52"
              rx="10"
              fill={C.frame}
              stroke={C.rule}
            />
            <path
              d="M70 60 l14 14 l30 -32"
              fill="none"
              stroke={C.good}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Art>
        ),
      },
    ],
  },
};

function seenKey(mode: Mode) {
  return `durus.help.${mode}`;
}

export function Help({ mode }: { mode: Mode }) {
  const pathname = usePathname();
  /*
    The theme switch hides itself on /review so the card face stays
    bare. Without this the question mark would sit beside an empty slot
    rather than in the corner.
  */
  const alone = pathname.startsWith("/review");
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const help = SLIDES[mode];
  const last = slide === help.slides.length - 1;

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
    setSlide(0);
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

      if (!open) {
        if (e.key === "?") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (last) close();
        else setSlide((n) => n + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlide((n) => Math.max(0, n - 1));
      }
    }
    // Capture, so this runs before the drill's own handler.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, close, last]);

  const current = help.slides[slide];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`What is the ${help.title.toLowerCase()} for`}
        /* Flat, like the sun and moon it sits beside. */
        className={`text-ink-soft hover:text-ink active:text-ink fixed z-20 flex size-10 items-center justify-center text-[17px] opacity-70 transition-opacity hover:opacity-100 ${
          alone ? "right-4" : "right-16"
        }`}
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      >
        ?
      </button>

      {open ? (
        <>
          {/*
            A light scrim rather than a cover. The drill stays visible
            behind the panel, which is the point of explaining it here
            rather than on a page of its own.
          */}
          <button
            type="button"
            aria-label="Close help"
            onClick={close}
            className="bg-ink/15 fixed inset-0 z-30 cursor-default"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={help.title}
            className="border-rule bg-surface fixed z-40 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-4 rounded-[16px] border px-6 py-6 shadow-lg"
            style={{
              top: "max(4.5rem, calc(env(safe-area-inset-top) + 3.75rem))",
              right: "max(1rem, env(safe-area-inset-right))",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-ink text-[17px] font-medium">{help.title}</h2>
              <span className="tabular text-ink-faint text-[12px]">
                {slide + 1} of {help.slides.length}
              </span>
            </div>

            <div className="bg-paper rounded-[12px] py-2">{current.art}</div>

            <p className="text-ink min-h-[60px] text-center text-[15px] leading-relaxed">
              {current.line}
            </p>

            {/* Dots double as the way back to any slide. */}
            <div className="flex justify-center gap-2">
              {help.slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className="size-2 rounded-[999px] transition-colors"
                  style={{
                    backgroundColor:
                      i === slide ? "var(--lapis)" : "var(--surface-sunk)",
                  }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {slide > 0 ? (
                <button
                  type="button"
                  onClick={() => setSlide((n) => n - 1)}
                  className="border-rule text-ink-soft flex-1 rounded-[12px] border px-4 py-2.5 text-[15px]"
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => (last ? close() : setSlide((n) => n + 1))}
                className="bg-lapis text-paper flex-1 rounded-[12px] px-4 py-2.5 text-[15px] font-medium"
              >
                {last ? "Got it" : "Next"}
              </button>
            </div>

            {/*
              The keys are only worth showing where there are keys. The
              full map lives in Settings.
            */}
            {help.keys ? (
              <div className="hidden flex-col gap-1 lg:flex">
                <hr className="border-rule mb-1 border-t" />
                {help.keys.map((line) => (
                  <p
                    key={line}
                    className="tabular text-ink-faint text-center text-[12px]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
}
