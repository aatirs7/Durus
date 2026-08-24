"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arabic } from "@/components/arabic";
import { SpeedRing } from "@/components/speed-ring";
import { Button, ButtonLink, Eyebrow, Numeral, Screen } from "@/components/ui";
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

        <ButtonLink href="/" className="w-full max-w-[320px]">
          Back to today
        </ButtonLink>
      </Screen>
    );
  }

  return (
    <Screen className="items-center justify-center gap-10 py-10">
      <Eyebrow>
        {index + 1} of {words.length}
      </Eyebrow>

      <SpeedRing progress={ringProgress} animateMs={windowMs}>
        {/*
          Once the window closes the word blurs out. Any longer look
          would measure reading, not recognition. The blur is on a
          wrapper rather than the text node so the harakat do not
          reflow as it fades.
        */}
        <div
          className="transition-[filter,opacity] duration-200"
          style={
            blurred
              ? { filter: "blur(10px)", opacity: 0.25 }
              : { filter: "none", opacity: 1 }
          }
        >
          <Arabic as="p" className="text-ink text-[40px] leading-[1.8]">
            {word.arabic}
          </Arabic>
        </div>
      </SpeedRing>

      <div className="flex w-full gap-3">
        <Button
          variant="quiet"
          className="flex-1"
          disabled={!blurred}
          onClick={() => answer(false)}
        >
          Missed it
        </Button>
        <Button className="flex-1" disabled={!blurred} onClick={() => answer(true)}>
          Knew it
        </Button>
      </div>

      <Link href="/" className="text-ink-soft text-[15px]">
        End run
      </Link>
    </Screen>
  );
}
