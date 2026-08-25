"use client";

import { useCallback, useEffect, useState } from "react";
import { Arabic } from "@/components/arabic";
import { Button, ButtonLink, Eyebrow, Pill } from "@/components/ui";
import { isPlainKey, isTyping, overlayOpen } from "@/lib/keys";
import type { StudyCard } from "@/lib/lessons";

/*
  Flashcards. The word, then the meaning, at whatever pace you like.

  This is the browsing half of the pair, the way Quizlet separates
  Flashcards from Learn. The escalating, graded drill is /review.

  Nothing here is graded and no schedule moves. This is first exposure,
  for reading a new lesson through before drilling it, and a drill that
  starts scoring you the moment you meet a word is a drill you avoid
  opening on a Wednesday night.
*/
export function CardsDeck({ cards }: { cards: StudyCard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];
  const atStart = index === 0;
  const atEnd = index === cards.length - 1;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.max(0, Math.min(cards.length - 1, i + delta)));
      setFlipped(false);
    },
    [cards.length],
  );

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
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
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

        {/* Tap anywhere on the card to turn it. */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Show the word" : "Show the meaning"}
          className="border-rule bg-surface flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-5 rounded-[16px] border px-6 py-10"
        >
          <Arabic as="p" className="text-ink text-[56px] leading-[1.8]">
            {card.arabic}
          </Arabic>

          {flipped ? (
            <>
              {card.transliteration ? (
                <p className="text-ink-faint text-[18px] italic">
                  {card.transliteration}
                </p>
              ) : null}

              <hr className="border-rule w-32 border-t" />

              <p className="text-ink text-[28px] leading-snug">
                {card.english}
              </p>

              {card.gender || card.plural ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {card.gender ? (
                    <Pill>{card.gender === "m" ? "masculine" : "feminine"}</Pill>
                  ) : null}
                  {card.plural ? (
                    <Pill>
                      <Arabic>{card.plural}</Arabic>
                    </Pill>
                  ) : null}
                </div>
              ) : null}

              {card.note ? (
                <p className="text-ink-soft max-w-[420px] text-[17px]">
                  {card.note}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-ink-faint text-[15px]">Tap to see the meaning</p>
          )}
        </div>

        <div className="flex gap-3">
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
