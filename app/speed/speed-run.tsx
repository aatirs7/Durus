"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arabic } from "@/components/arabic";
import { Help } from "@/components/help";
import { SpeedRing } from "@/components/speed-ring";
import { ExitDrill } from "@/components/exit-drill";
import { Button, ButtonLink, Eyebrow, Numeral, Screen } from "@/components/ui";
import { isPlainKey, isTyping, overlayOpen } from "@/lib/keys";
import { recordSpeedRun, tightenSpeedWindow } from "./actions";
import {
  SPEED_FLOOR_MS,
  SPEED_RAMP_THRESHOLD,
  SPEED_STEP_MS,
  type SpeedWord,
} from "@/lib/speed";

type Result = { cardId: number; knew: boolean; windowMs: number };

export function SpeedRun({
  words,
  windowMs,
}: {
  words: SpeedWord[];
  windowMs: number;
}) {
  const [index, setIndex] = useState(0);
  const [blurred, setBlurred] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [ringProgress, setRingProgress] = useState(1);
  const [suggested, setSuggested] = useState<number | null>(null);
  const [newWindow, setNewWindow] = useState<number | null>(null);

  const word = words[index];
  const done = !word;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The exposure window. When it closes the word blurs out and the
  // self report buttons take over.
  useEffect(() => {
    if (!word) return;
    setBlurred(false);
    setRingProgress(1);

    // Next frame, so the transition has a value to animate from.
    const raf = requestAnimationFrame(() => setRingProgress(0));
    timer.current = setTimeout(() => setBlurred(true), windowMs);

    return () => {
      cancelAnimationFrame(raf);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [word, windowMs]);

  const answer = useCallback(
    (knew: boolean) => {
      if (!word) return;
      setResults((prev) => [...prev, { cardId: word.cardId, knew, windowMs }]);
      setIndex((i) => i + 1);
    },
    [word, windowMs],
  );

  /*
    Left arrow missed it, right arrow knew it. The drill is measuring
    recognition, and a key press is both faster and more consistent than
    a thumb, so on desktop the arrows are the real input and the buttons
    are the label for them.
  */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || !isPlainKey(e) || overlayOpen()) return;
      if (!blurred) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        answer(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        answer(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, blurred]);

  useEffect(() => {
    if (!done || results.length === 0) return;
    void recordSpeedRun(results);

    const accuracy = results.filter((r) => r.knew).length / results.length;
    const next = windowMs - SPEED_STEP_MS;
    if (accuracy > SPEED_RAMP_THRESHOLD && next >= SPEED_FLOOR_MS) {
      setSuggested(next);
    }
  }, [done, results, windowMs]);

  if (done) {
    const correct = results.filter((r) => r.knew).length;
    const accuracy =
      results.length === 0 ? 0 : Math.round((correct / results.length) * 100);

    return (
      <Screen className="items-center justify-center gap-8 py-10">
        <ExitDrill />

        <Numeral>{`${accuracy}%`}</Numeral>
        <Eyebrow>knew it</Eyebrow>
        <p className="text-ink-soft text-[16px]">
          {correct} of {results.length} at {(windowMs / 1000).toFixed(1)}s
        </p>

        {newWindow ? (
          <p className="text-ink-soft text-[16px]">
            Window is now {(newWindow / 1000).toFixed(1)}s.
          </p>
        ) : suggested ? (
          <Button
            variant="quiet"
            onClick={async () => {
              const res = await tightenSpeedWindow(suggested);
              setNewWindow(res.speedWindowMs);
              setSuggested(null);
            }}
          >
            Drop the window to {(suggested / 1000).toFixed(1)}s
          </Button>
        ) : null}

        <ButtonLink href="/today" className="w-full max-w-[320px]">
          Back to today
        </ButtonLink>
      </Screen>
    );
  }

  return (
    <Screen className="items-center justify-center gap-10 py-10">
      <Help mode="speed" />

      <Eyebrow>
        {index + 1} of {words.length}
      </Eyebrow>

      {/*
        Once the window closes the word blurs out. Any longer look would
        measure reading, not recognition. The blur is on a wrapper
        rather than the text node so the harakat do not reflow as it
        fades.

        The ring is drawn twice, at 220 for the phone and 240 for
        desktop, because its diameter is a number rather than a class
        and only one of the two is ever displayed.
      */}
      <div className="lg:hidden">
        <SpeedRing progress={ringProgress} animateMs={windowMs}>
          <Word arabic={word.arabic} blurred={blurred} />
        </SpeedRing>
      </div>
      <div className="hidden lg:block">
        <SpeedRing progress={ringProgress} animateMs={windowMs} size={240}>
          <Word arabic={word.arabic} blurred={blurred} desktop />
        </SpeedRing>
      </div>

      {/*
        Once the window has closed the word is gone, so the answer goes
        here. Saying you missed it and then never being told what it was
        is the one way this drill can waste a rep.

        The block holds its height while the word is still up, so the
        buttons do not jump when it arrives.
      */}
      <div className="flex h-[68px] flex-col items-center justify-start gap-1">
        {blurred ? (
          <>
            <p className="text-ink text-[24px] leading-snug">{word.english}</p>
            {word.transliteration ? (
              <p className="text-ink-faint text-[16px] italic">
                {word.transliteration}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="flex w-full gap-3 lg:justify-center lg:gap-4">
        <Button
          variant="quiet"
          className="flex-1 flex-col gap-0.5 lg:w-[180px] lg:flex-none"
          disabled={!blurred}
          onClick={() => answer(false)}
        >
          Missed it
          <span className="tabular text-ink-faint hidden text-[11px] lg:block">
            &#8592;
          </span>
        </Button>
        <Button
          className="flex-1 flex-col gap-0.5 lg:w-[180px] lg:flex-none"
          disabled={!blurred}
          onClick={() => answer(true)}
        >
          Knew it
          <span className="tabular text-paper hidden text-[11px] opacity-70 lg:block">
            &#8594;
          </span>
        </Button>
      </div>

      <Link href="/today" className="text-ink-soft text-[15px]">
        End run
      </Link>
    </Screen>
  );
}

/*
  The drilled word inside the ring. Desktop gets more of it, though not
  the full card face size, because this one has a 240px circle drawn
  around it and a 112px word would sit outside its own timer.
*/
function Word({
  arabic,
  blurred,
  desktop = false,
}: {
  arabic: string;
  blurred: boolean;
  desktop?: boolean;
}) {
  return (
    <div
      className="transition-[filter,opacity] duration-200"
      style={
        blurred
          ? { filter: "blur(10px)", opacity: 0.25 }
          : { filter: "none", opacity: 1 }
      }
    >
      <Arabic
        as="p"
        className={`text-ink leading-[1.8] ${
          desktop ? "text-[72px]" : "text-[40px]"
        }`}
      >
        {arabic}
      </Arabic>
    </div>
  );
}
