"use client";

import { useCallback, useEffect, useState } from "react";
import { Arabic } from "@/components/arabic";
import { ExitDrill } from "@/components/exit-drill";
import { Button, ButtonLink, Eyebrow } from "@/components/ui";
import { isPlainKey, isTyping, overlayOpen } from "@/lib/keys";
import type { StudyCard } from "@/lib/lessons";
import { setHeart } from "./actions";

/*
  Flashcards. The word, then the meaning, at whatever pace you like.

  This is the browsing half of the pair, the way Quizlet separates
  Flashcards from Learn. The escalating, graded drill is /review.

  Nothing here is graded and no schedule moves. This is first exposure,
  for reading a new lesson through before drilling it, and a drill that
  starts scoring you the moment you meet a word is a drill you avoid
  opening on a Wednesday night.

  The card turns rather than swapping its contents. A swap makes the
  meaning a second screen; a turn makes it the other side of the same
  object, which is the whole idea a flashcard is built on. See the
  flip rules in globals.css for why the perspective and the duration
  are what they are.
*/

/*
  One height for every card, so the deck does not resize under your
  thumb as you page through it and the turn has a stable box to rotate
  in. A long note scrolls inside the back face instead.
*/
const CARD_HEIGHT = "clamp(300px, 46dvh, 420px)";

export function CardsDeck({ cards }: { cards: StudyCard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  /* Hearts answer instantly and settle with the server afterwards. */
  const [hearts, setHearts] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(cards.map((c) => [c.id, c.hearted])),
  );

  const card = cards[index];
  const atStart = index === 0;
  const atEnd = index === cards.length - 1;
  const hearted = Boolean(hearts[card.id]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = Math.max(0, Math.min(cards.length - 1, i + delta));
        // Turning the card back as it leaves would play the flip in
        // reverse on the way out. Land face up, without the animation.
        if (next !== i) setFlipped(false);
        return next;
      });
    },
    [cards.length],
  );

  const toggleHeart = useCallback(() => {
    const next = !hearts[card.id];
    setHearts((prev) => ({ ...prev, [card.id]: next }));
    void setHeart(card.id, next).catch(() => {
      // Put it back rather than showing a mark that did not save.
      setHearts((prev) => ({ ...prev, [card.id]: !next }));
    });
  }, [card.id, hearts]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || !isPlainKey(e) || overlayOpen()) return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleHeart();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, toggleHeart]);

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      <ExitDrill />

      <div className="bg-rule h-[2px] shrink-0">
        <div
          className="bg-lapis h-full transition-[width] duration-200"
          style={{ width: `${((index + 1) / cards.length) * 100}%` }}
        />
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col justify-center gap-8 overflow-y-auto px-6 pt-20 pb-6 lg:max-w-[680px]">
        <Eyebrow>
          Lesson {card.lessonNumber} &middot; {index + 1} of {cards.length}
        </Eyebrow>

        <div className="relative shrink-0" style={{ height: CARD_HEIGHT }}>
          {/*
            The heart sits outside the turning element. Riding on the
            card would mean it rotates away with the face, and it is a
            mark on the word rather than on one side of it.
          */}
          <button
            type="button"
            onClick={toggleHeart}
            aria-pressed={hearted}
            aria-label={
              hearted ? "Not struggling with this one" : "I need more work here"
            }
            className="absolute top-3 right-3 z-10 flex size-11 items-center justify-center"
          >
            <Heart on={hearted} />
          </button>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? "Show the word" : "Show the meaning"}
            className="flip-scene h-full w-full cursor-pointer"
          >
            <div className={`flip-inner h-full ${flipped ? "is-flipped" : ""}`}>
              <Face>
                <Arabic
                  as="p"
                  className="text-ink text-[52px] leading-[1.8] lg:text-[64px]"
                >
                  {card.arabic}
                </Arabic>
                <p className="text-ink-faint text-[15px]">
                  Tap to see the meaning
                </p>
              </Face>

              <Face back>
                {card.transliteration ? (
                  <p className="text-ink-faint text-[18px] italic">
                    {card.transliteration}
                  </p>
                ) : null}

                <p className="text-ink text-[30px] leading-snug">
                  {card.english}
                </p>

                {card.gender || card.plural ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {card.gender ? (
                      <Chip>
                        {card.gender === "m" ? "masculine" : "feminine"}
                      </Chip>
                    ) : null}
                    {card.plural ? (
                      <Chip>
                        <Arabic className="text-[17px]">{card.plural}</Arabic>
                      </Chip>
                    ) : null}
                  </div>
                ) : null}

                {card.note ? (
                  <p className="text-ink-soft max-w-[420px] text-[16px]">
                    {card.note}
                  </p>
                ) : null}
              </Face>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-3">
          <Button
            variant="quiet"
            className="flex-1"
            disabled={atStart}
            onClick={() => go(-1)}
          >
            Back
          </Button>
          <Button
            variant="quiet"
            className="flex-1"
            disabled={atEnd}
            onClick={() => go(1)}
          >
            Next
          </Button>
        </div>

        {atEnd ? (
          <ButtonLink href="/review">Drill these words</ButtonLink>
        ) : null}

        <p className="text-ink-faint text-[14px]">
          Nothing here is scored. Your schedule does not move.
        </p>
      </div>
    </div>
  );
}

/*
  One face of the card. Both faces are the same box in the same place,
  which is what lets the turn read as one object rather than two cards
  changing places.
*/
function Face({
  children,
  back = false,
}: {
  children: React.ReactNode;
  back?: boolean;
}) {
  return (
    <div
      className={`flip-face border-rule bg-surface flex flex-col items-center justify-center gap-5 overflow-y-auto rounded-[16px] border px-6 py-10 ${
        back ? "flip-face-back" : "flip-face-front"
      }`}
    >
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-rule text-ink-soft inline-flex items-center rounded-[999px] border px-3 py-0.5 text-[13px]">
      {children}
    </span>
  );
}

/*
  Outline until it is on, then filled in clay. Clay rather than lapis
  because lapis is the colour of everything you can press, and this one
  is a state rather than an action.
*/
function Heart({ on }: { on: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={on ? "var(--clay)" : "none"}
      stroke={on ? "var(--clay)" : "var(--ink-faint)"}
      strokeWidth="1.6"
      strokeLinejoin="round"
      className="transition-colors"
      aria-hidden
    >
      <path d="M12 20s-7-4.6-7-9.3A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.7C19 15.4 12 20 12 20z" />
    </svg>
  );
}
