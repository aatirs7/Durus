"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Arabic } from "@/components/arabic";
import { Button, ButtonLink, Numeral, Pill } from "@/components/ui";
import type { QueueItem } from "@/lib/queue";
import { isPlainKey, isTyping, markReviewed } from "@/lib/keys";
import { enqueue } from "@/lib/outbox";
import { formatInterval, schedule, type Grade } from "@/lib/srs";
import { submitGrade, undoGrade } from "./actions";

const GRADES: { grade: Grade; label: string; color: string }[] = [
  { grade: "again", label: "Again", color: "var(--clay)" },
  { grade: "hard", label: "Hard", color: "var(--saffron)" },
  { grade: "good", label: "Good", color: "var(--verdigris)" },
  { grade: "easy", label: "Easy", color: "var(--lapis)" },
];

type Answered = {
  item: QueueItem;
  grade: Grade;
  msToAnswer: number;
};

export function ReviewSession({
  initialQueue,
  capturedLessons,
  weekMedianMs,
}: {
  initialQueue: QueueItem[];
  capturedLessons: Record<number, boolean>;
  weekMedianMs: number | null;
}) {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [totalPlanned] = useState(initialQueue.length);
  /*
    Harakat are on unless the h key turns them off, for the length of
    this session only. Reading unvowelled is the eventual goal, so it
    has to be one key away, but it is not a setting you should leave
    behind you by accident.
  */
  const [showHarakat, setShowHarakat] = useState(true);
  const router = useRouter();

  const shownAt = useRef<number>(Date.now());
  const msToAnswer = useRef<number>(0);

  const item = queue[index];
  const done = !item;

  // Card render to reveal, not to grade.
  useEffect(() => {
    shownAt.current = Date.now();
    msToAnswer.current = 0;
    setRevealed(false);
  }, [index]);

  const reveal = useCallback(() => {
    setRevealed((was) => {
      if (was) return was;
      msToAnswer.current = Date.now() - shownAt.current;
      return true;
    });
  }, []);

  const previews = useMemo(() => {
    if (!item) return null;
    const now = new Date();
    const capped = capturedLessons[item.lessonNumber] ?? false;
    const state = {
      ease: item.ease,
      intervalDays: item.intervalDays,
      repetitions: item.repetitions,
      lapses: item.lapses,
    };
    return Object.fromEntries(
      GRADES.map(({ grade }) => [
        grade,
        formatInterval(
          schedule(state, grade, {
            now,
            capToCurrentLesson: capped,
            // A stable midpoint, so the label does not disagree with
            // itself between renders.
            random: () => 0.5,
          }),
        ),
      ]),
    ) as Record<Grade, string>;
  }, [item, capturedLessons]);

  const grade = useCallback(
    (g: Grade) => {
      if (!item || !revealed) return;
      const ms = msToAnswer.current;
      const reviewedAt = new Date().toISOString();

      /*
        The session does not block on this. If the request fails the
        grade goes to the outbox and flushes on the next online event,
        keyed by card and timestamp so a double flush cannot double
        count.
      */
      void submitGrade({
        cardId: item.cardId,
        direction: item.direction,
        grade: g,
        msToAnswer: ms,
      }).catch(() =>
        enqueue({
          cardId: item.cardId,
          direction: item.direction,
          grade: g,
          msToAnswer: ms,
          reviewedAt,
        }).catch(() => {
          // IndexedDB is unavailable. Nothing further to try.
        }),
      );

      setAnswered((prev) => [...prev, { item, grade: g, msToAnswer: ms }]);

      // The relearn bucket. An again card comes back later in this same
      // session rather than being scheduled for a future day.
      if (g === "again") {
        setQueue((prev) => [...prev, item]);
      }

      setIndex((i) => i + 1);
    },
    [item, revealed],
  );

  const undo = useCallback(() => {
    if (answered.length === 0) return;
    const last = answered[answered.length - 1];

    void undoGrade({
      cardId: last.item.cardId,
      direction: last.item.direction,
      previous: {
        ease: last.item.ease,
        intervalDays: last.item.intervalDays,
        repetitions: last.item.repetitions,
        lapses: last.item.lapses,
        dueAt: new Date().toISOString(),
        existed: !last.item.isNew,
      },
    });

    setAnswered((prev) => prev.slice(0, -1));
    // If the card was pushed back into the relearn bucket, take it out.
    if (last.grade === "again") {
      setQueue((prev) => prev.slice(0, -1));
    }
    setIndex((i) => Math.max(0, i - 1));
  }, [answered]);

  /*
    space reveal, 1 to 4 grade, u undo, h harakat, esc end the session.
    Bound to the document rather than to the card, because on desktop
    the keyboard is the primary input and nothing here is ever focused.
  */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || !isPlainKey(e)) return;

      if (e.key === " ") {
        e.preventDefault();
        reveal();
        return;
      }
      if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setShowHarakat((on) => !on);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        router.push("/");
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= 4) {
        e.preventDefault();
        grade(GRADES[n - 1].grade);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reveal, undo, grade, router]);

  if (done) {
    return <SessionEnd answered={answered} weekMedianMs={weekMedianMs} />;
  }

  const progress = totalPlanned === 0 ? 0 : Math.min(1, index / queue.length);
  const front = item.direction === "recognition" ? "arabic" : "english";

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      {/* Hairline progress, no percentage label. */}
      <div className="bg-rule h-[2px] shrink-0">
        <div
          className="bg-lapis h-full transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/*
        Tap anywhere to reveal on a phone. On desktop the whole field
        stops taking clicks and only the card face does, because a mouse
        lands on empty space by accident in a way a thumb does not.
      */}
      <div
        role="button"
        tabIndex={0}
        onClick={reveal}
        aria-label="Reveal"
        className="flip-scene relative min-h-0 flex-1 cursor-default lg:pointer-events-none"
      >
        <div
          key={index}
          className={`deck-advance flip-inner absolute inset-0 ${
            revealed ? "is-flipped" : ""
          }`}
        >
          <div className="flip-face flip-face-front absolute inset-0 flex items-center justify-center px-6">
            {front === "arabic" ? (
              <Arabic
                as="p"
                showHarakat={showHarakat}
                className="text-ink text-[64px] leading-[1.8] md:text-[88px] lg:pointer-events-auto lg:cursor-pointer lg:text-[112px]"
              >
                {item.arabic}
              </Arabic>
            ) : (
              <p className="text-ink text-[32px] leading-snug lg:pointer-events-auto lg:cursor-pointer">
                {item.english}
              </p>
            )}
          </div>

          <div className="flip-face flip-face-back absolute inset-0 flex items-center justify-center overflow-y-auto px-6 py-6">
            <CardBack item={item} showHarakat={showHarakat} />
          </div>
        </div>
      </div>

      <div
        className="mx-auto w-full max-w-[560px] shrink-0 px-6 pt-4 lg:max-w-[680px]"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        {revealed ? (
          /*
            The buttons stretch to fill on a phone. On desktop they are
            fixed at 140px and sit centred, because a 300px wide target
            is one you cannot miss, and a grade you cannot miss stops
            being a grade you thought about.
          */
          <div className="grid grid-cols-4 gap-2 lg:flex lg:justify-center lg:gap-4">
            {GRADES.map((g, i) => (
              <button
                key={g.grade}
                type="button"
                onClick={() => grade(g.grade)}
                className="border-rule bg-surface hover:bg-surface-sunk flex flex-col items-center gap-1 rounded-[12px] border py-3 transition-colors lg:w-[140px]"
              >
                <span className="tabular text-ink-soft text-[13px]">
                  {previews?.[g.grade]}
                </span>
                <span
                  className="text-[15px] font-medium"
                  style={{ color: g.color }}
                >
                  {g.label}
                </span>
                {/* The whole keyboard map lives in Settings. This is
                    the one part of it that is worth carrying here. */}
                <span className="tabular text-ink-faint hidden text-[11px] lg:block">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Button variant="quiet" className="w-full" onClick={reveal}>
            Reveal
          </Button>
        )}
      </div>
    </div>
  );
}

function CardBack({
  item,
  showHarakat,
}: {
  item: QueueItem;
  showHarakat: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-7">
      <Arabic
        as="p"
        showHarakat={showHarakat}
        className="text-ink text-[68px] leading-[1.7] md:text-[80px] lg:text-[112px]"
      >
        {item.arabic}
      </Arabic>

      {item.transliteration ? (
        <p className="text-ink-faint text-[22px] italic">
          {item.transliteration}
        </p>
      ) : null}

      <hr className="border-rule w-32 border-t" />

      <p className="text-ink text-[36px] leading-snug">{item.english}</p>

      {item.gender || item.plural ? (
        <div className="flex flex-wrap justify-center gap-2">
          {item.gender ? (
            <Pill>{item.gender === "m" ? "masculine" : "feminine"}</Pill>
          ) : null}
          {item.plural ? (
            <Pill>
              <Arabic showHarakat={showHarakat}>{item.plural}</Arabic>
            </Pill>
          ) : null}
        </div>
      ) : null}

      {item.note ? (
        <p className="text-ink-soft max-w-[460px] text-[20px]">{item.note}</p>
      ) : null}
    </div>
  );
}

function SessionEnd({
  answered,
  weekMedianMs,
}: {
  answered: Answered[];
  weekMedianMs: number | null;
}) {
  const reviewed = answered.length;
  const correct = answered.filter(
    (a) => a.grade === "good" || a.grade === "easy",
  ).length;
  const accuracy = reviewed === 0 ? 0 : Math.round((correct / reviewed) * 100);
  const median = medianOf(answered.map((a) => a.msToAnswer));

  // The desktop "press R" hint has done its job once a session ends.
  useEffect(() => {
    if (reviewed > 0) markReviewed();
  }, [reviewed]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6">
      <Stat label="cards reviewed" value={String(reviewed)} />
      <Stat label="accuracy" value={`${accuracy}%`} />
      <Stat
        label="median to reveal"
        value={median === null ? "0.0s" : `${(median / 1000).toFixed(1)}s`}
      />

      <p className="text-ink-soft text-[16px]">
        {comparisonLine(median, weekMedianMs)}
      </p>

      <ButtonLink href="/" className="w-full max-w-[320px]">
        Back to today
      </ButtonLink>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Numeral>{value}</Numeral>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

function comparisonLine(median: number | null, week: number | null): string {
  if (median === null) return "Nothing graded this session.";
  if (week === null) return "No week to compare against yet.";
  const deltaSeconds = (week - median) / 1000;
  const size = Math.abs(deltaSeconds).toFixed(1);
  if (Math.abs(deltaSeconds) < 0.05) return "Level with your week.";
  return deltaSeconds > 0
    ? `${size}s faster than your week`
    : `${size}s slower than your week`;
}

function medianOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
