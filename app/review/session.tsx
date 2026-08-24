"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arabic } from "@/components/arabic";
import { Help } from "@/components/help";
import { Button, ButtonLink, Numeral, Pill } from "@/components/ui";
import { checkAnswer } from "@/lib/answer";
import { isPlainKey, isTyping, markReviewed, overlayOpen } from "@/lib/keys";
import { feedbackFor, gradeFor } from "@/lib/modes";
import { enqueue } from "@/lib/outbox";
import type { Question } from "@/lib/queue";
import type { Grade } from "@/lib/srs";
import { submitGrade, undoGrade } from "./actions";

/*
  The session grades itself.

  There is no Again / Hard / Good / Easy row any more. Whether an answer
  was right is decided by the answer, and how well it was known is
  decided by how long it took, which is the thing this app set out to
  train. Rating yourself was the one place the drill asked you to be
  honest about something you had just got wrong.
*/

type Answered = {
  question: Question;
  grade: Grade;
  correct: boolean;
  msToAnswer: number;
};

type Result = { grade: Grade; correct: boolean; message: string };

export function ReviewSession({
  initialQueue,
  weekMedianMs,
}: {
  initialQueue: Question[];
  weekMedianMs: number | null;
}) {
  const router = useRouter();
  const [queue, setQueue] = useState<Question[]>(initialQueue);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [answered, setAnswered] = useState<Answered[]>([]);

  const shownAt = useRef<number>(Date.now());

  const question = queue[index];
  const done = !question;

  // Time to answer runs from the card appearing, not from the first key.
  useEffect(() => {
    shownAt.current = Date.now();
    setTyped("");
    setResult(null);
  }, [index]);

  const answer = useCallback(
    (outcome: { correct: boolean; close?: boolean }) => {
      if (!question || result) return;

      const ms = Date.now() - shownAt.current;
      const scored = { ...outcome, msToAnswer: ms, mode: question.mode };
      const grade = gradeFor(scored);
      const reviewedAt = new Date().toISOString();

      setResult({
        grade,
        correct: outcome.correct,
        message: feedbackFor(scored, grade),
      });

      void submitGrade({
        cardId: question.cardId,
        direction: question.direction,
        grade,
        msToAnswer: ms,
      }).catch(() =>
        enqueue({
          cardId: question.cardId,
          direction: question.direction,
          grade,
          msToAnswer: ms,
          reviewedAt,
        }).catch(() => {
          // IndexedDB is unavailable. Nothing further to try.
        }),
      );

      setAnswered((prev) => [
        ...prev,
        { question, grade, correct: outcome.correct, msToAnswer: ms },
      ]);

      // A wrong answer comes back later in this same session.
      if (grade === "again") setQueue((prev) => [...prev, question]);
    },
    [question, result],
  );

  /*
    The result stays up until it is dismissed. It used to clear itself
    after a second, or two on a wrong answer, and a timer is the wrong
    instrument here: the moment right after getting a word wrong is the
    moment you are actually reading it, and how long that takes is not
    something the app can know.

    Clearing the result and moving on happen together. Doing the clear
    in an effect instead leaves one painted frame where the next card is
    already up with the previous card's answer still marked green, which
    reads as the app giving it away.
  */
  const advance = useCallback(() => {
    setResult(null);
    setTyped("");
    setIndex((i) => i + 1);
  }, []);

  const undo = useCallback(() => {
    if (answered.length === 0 || result) return;
    const last = answered[answered.length - 1];

    void undoGrade({
      cardId: last.question.cardId,
      direction: last.question.direction,
      previous: {
        ease: last.question.ease,
        intervalDays: last.question.intervalDays,
        repetitions: last.question.repetitions,
        lapses: last.question.lapses,
        dueAt: new Date().toISOString(),
        existed: !last.question.isNew,
      },
    });

    setAnswered((prev) => prev.slice(0, -1));
    if (last.grade === "again") setQueue((prev) => prev.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
  }, [answered, result]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || !isPlainKey(e) || overlayOpen()) return;

      if (result) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          advance();
        }
        return;
      }

      if (e.key === "u") {
        e.preventDefault();
        undo();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        router.push("/today");
        return;
      }

      /*
        1 to 4 pick an option, so the whole drill is reachable from the
        keyboard without the mouse. Typed cards ignore this, since the
        digits belong in the box.
      */
      if (question?.mode === "choice" && !result) {
        const n = Number(e.key);
        if (n >= 1 && n <= question.options.length) {
          e.preventDefault();
          const option = question.options[n - 1];
          answer({ correct: option.english === question.english });
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, router, question, result, answer, advance]);

  if (done) {
    return <SessionEnd answered={answered} weekMedianMs={weekMedianMs} />;
  }

  const progress = Math.min(1, index / queue.length);

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      <div className="bg-rule h-[2px] shrink-0">
        <div
          className="bg-lapis h-full transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <Help mode="review" />

      <div className="mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col justify-center gap-9 overflow-y-auto px-6 pt-20 pb-6 lg:max-w-[680px]">
        <Prompt question={question} />

        {question.mode === "choice" ? (
          <ChoiceAnswers
            key={`${question.cardId}-${question.direction}-${index}`}
            question={question}
            answered={Boolean(result)}
            onPick={(english) =>
              answer({ correct: english === question.english })
            }
          />
        ) : (
          <WrittenAnswer
            question={question}
            typed={typed}
            setTyped={setTyped}
            locked={Boolean(result)}
            onSubmit={() => {
              const match = checkAnswer(typed, question.english);
              answer({
                correct: match.kind !== "wrong",
                close: match.kind === "close",
              });
            }}
          />
        )}

        <Feedback question={question} result={result} />
      </div>

      {/*
        Once the result is up the whole screen carries it forward. It
        sits under the corner glyphs, so help and the theme are still
        reachable, and the line is fixed to the bottom rather than in
        the flow so the card does not jump as it appears.
      */}
      {result ? (
        <>
          <button
            type="button"
            aria-label="Next card"
            onClick={advance}
            className="fixed inset-0 z-10 cursor-pointer"
          />
          <p
            className="text-ink-faint pointer-events-none fixed inset-x-0 z-10 text-center text-[14px]"
            style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <span className="lg:hidden">Tap anywhere to continue</span>
            <span className="hidden lg:inline">Space to continue</span>
          </p>
        </>
      ) : null}
    </div>
  );
}

/*
  Recognition shows the Arabic and nothing else, because anything else
  on screen is something the eye can cheat with.
*/
function Prompt({ question }: { question: Question }) {
  if (question.direction === "production") {
    return (
      <p className="text-ink text-center text-[32px] leading-snug">
        {question.english}
      </p>
    );
  }

  return (
    <Arabic
      as="p"
      className="text-ink text-center text-[64px] leading-[1.8] md:text-[88px]"
    >
      {question.arabic}
    </Arabic>
  );
}

function ChoiceAnswers({
  question,
  answered,
  onPick,
}: {
  question: Question;
  answered: boolean;
  onPick: (english: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => setPicked(null), [question.cardId, question.direction]);

  return (
    <div className="grid gap-3">
      {question.options.map((option, i) => {
        const isAnswer = option.english === question.english;
        const isPicked = option.english === picked;

        // Once answered, the right one is marked whether or not it was
        // the one chosen. Seeing only your own mistake teaches nothing.
        let border = "border-rule";
        if (answered && isAnswer) border = "border-verdigris";
        else if (answered && isPicked) border = "border-clay";

        return (
          <button
            key={option.english}
            type="button"
            disabled={answered}
            onClick={() => {
              setPicked(option.english);
              onPick(option.english);
            }}
            className={`bg-surface hover:bg-surface-sunk flex items-center gap-4 rounded-[12px] border px-5 py-4 transition-colors disabled:cursor-default ${border}`}
          >
            <span className="tabular text-ink-faint hidden text-[13px] lg:inline">
              {i + 1}
            </span>
            <span className="flex-1 text-center">
              {question.direction === "production" ? (
                <Arabic className="text-ink text-[28px] leading-[1.8]">
                  {option.arabic}
                </Arabic>
              ) : (
                <span className="text-ink text-[18px]">{option.english}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function WrittenAnswer({
  question,
  typed,
  setTyped,
  locked,
  onSubmit,
}: {
  question: Question;
  typed: string;
  setTyped: (s: string) => void;
  locked: boolean;
  onSubmit: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, [question.cardId]);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!locked && typed.trim().length > 0) onSubmit();
      }}
    >
      <input
        ref={input}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        disabled={locked}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="The English meaning"
        placeholder="Type the meaning"
        className="border-rule bg-surface-sunk text-ink placeholder:text-ink-faint focus:border-lapis rounded-[12px] border px-4 py-3.5 text-center text-[20px] outline-none"
      />
      <Button type="submit" disabled={locked || typed.trim().length === 0}>
        Check
      </Button>
    </form>
  );
}

/*
  What just happened. On a wrong answer the card itself, because the
  moment right after getting it wrong is the moment worth showing it.

  Fixed height, so the answers never jump when the result appears.
*/
function Feedback({
  question,
  result,
}: {
  question: Question;
  result: Result | null;
}) {
  if (!result) return <div className="h-[112px]" aria-hidden />;

  return (
    <div className="flex h-[112px] flex-col items-center justify-start gap-2">
      <p
        className="text-[16px]"
        style={{ color: result.correct ? "var(--verdigris)" : "var(--clay)" }}
      >
        {result.message}
      </p>

      {result.correct ? null : (
        <>
          <p className="text-ink text-[22px]">{question.english}</p>
          {question.transliteration ? (
            <p className="text-ink-faint text-[15px] italic">
              {question.transliteration}
            </p>
          ) : null}
        </>
      )}

      {result.correct && (question.gender || question.plural) ? (
        <div className="flex flex-wrap justify-center gap-2">
          {question.gender ? (
            <Pill>{question.gender === "m" ? "masculine" : "feminine"}</Pill>
          ) : null}
          {question.plural ? (
            <Pill>
              <Arabic>{question.plural}</Arabic>
            </Pill>
          ) : null}
        </div>
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
  const correct = answered.filter((a) => a.correct).length;
  const accuracy = reviewed === 0 ? 0 : Math.round((correct / reviewed) * 100);
  const median = medianOf(answered.map((a) => a.msToAnswer));

  useEffect(() => {
    if (reviewed > 0) markReviewed();
  }, [reviewed]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6">
      <Stat label="cards answered" value={String(reviewed)} />
      <Stat label="accuracy" value={`${accuracy}%`} />
      <Stat
        label="median to answer"
        value={median === null ? "0.0s" : `${(median / 1000).toFixed(1)}s`}
      />

      <p className="text-ink-soft text-[16px]">
        {comparisonLine(median, weekMedianMs)}
      </p>

      <ButtonLink href="/today" className="w-full max-w-[320px]">
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
  if (median === null) return "Nothing answered this session.";
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
