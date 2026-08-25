"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arabic } from "@/components/arabic";
import { Help } from "@/components/help";
import { ExitDrill } from "@/components/exit-drill";
import { Button, ButtonLink, Eyebrow, Numeral } from "@/components/ui";
import { checkAnswer } from "@/lib/answer";
import { isPlainKey, isTyping, markReviewed, overlayOpen } from "@/lib/keys";
import { assembledCorrectly, type Tile } from "@/lib/letters";
import { feedbackFor, gradeFor, modeLabel } from "@/lib/modes";
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

/*
  How much room the result band takes at the bottom. The column reserves
  exactly this, so an answer can never end up underneath it.
*/
const BAND = "calc(max(1rem, env(safe-area-inset-bottom)) + 7rem)";

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
        practice: question.practice,
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
      {/*
        Below the safe area, not at the very top of the viewport. The
        status bar is transparent in standalone, so a bar at y=0 sits
        behind the clock and cannot be seen on a phone at all.
      */}
      <div
        className="bg-rule h-[3px] shrink-0"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <div
          className="bg-lapis h-full transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <ExitDrill />
      <Help mode="review" />

      {/*
        The verdict now lives in a fixed band at the bottom rather than
        in the flow, so nothing above it has to leave a gap for a box
        that is empty most of the time. That lead-in was pushing the
        four options past the bottom of a phone, which is why the
        verdict was clipped and the tap hint was landing on the last
        answer.
      */}
      <div
        className="mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col justify-center overflow-y-auto px-6 py-4 lg:max-w-[680px]"
        style={{ paddingBottom: result ? BAND : "1rem" }}
      >
        <div className="flex flex-col gap-6">
          {/* Which rung this card is on, so the format is never a surprise. */}
          <Eyebrow>{modeLabel(question.mode, question.direction)}</Eyebrow>

          <Prompt question={question} revealed={Boolean(result)} />

          {/*
            Gender and plural belong under the word they describe, not
            down beside the verdict where the pills were wide enough to
            read as buttons and low enough to sit on the tap hint.
          */}
          {result?.correct && (question.gender || question.plural) ? (
            <div className="-mt-4 flex flex-wrap justify-center gap-2">
              {question.gender ? (
                <Note>
                  {question.gender === "m" ? "masculine" : "feminine"}
                </Note>
              ) : null}
              {question.plural ? (
                <Note>
                  <Arabic className="text-[17px]">{question.plural}</Arabic>
                </Note>
              ) : null}
            </div>
          ) : null}

          {question.mode === "choice" ? (
            <ChoiceAnswers
              key={`${question.cardId}-${question.direction}-${index}`}
              question={question}
              answered={Boolean(result)}
              onPick={(english) =>
                answer({ correct: english === question.english })
              }
            />
          ) : question.mode === "assemble" ? (
            <AssembleAnswer
              key={`${question.cardId}-${index}`}
              question={question}
              locked={Boolean(result)}
              onSubmit={(built) =>
                answer({ correct: assembledCorrectly(built, question.arabic) })
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
        </div>
      </div>

      {/*
        One band at the bottom holds everything about the result: the
        verdict, the answer you missed, and how to move on. Three
        separate things all reaching for the last inch of the screen is
        what had the hint painted across the fourth option and the
        verdict cut off below the fold.

        Fixed rather than in the flow, so the card above does not jump
        when it appears, and the column reserves exactly this height.
      */}
      {result ? (
        <>
          <button
            type="button"
            aria-label="Next card"
            onClick={advance}
            className="fixed inset-0 z-10 cursor-pointer"
          />

          <div
            className="pointer-events-none fixed inset-x-0 z-10 flex flex-col items-center gap-2 px-6"
            style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <Feedback question={question} result={result} />

            <p className="text-ink-faint text-center text-[14px]">
              <span className="lg:hidden">Tap anywhere to continue</span>
              <span className="hidden lg:inline">Space to continue</span>
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

/*
  Recognition shows the Arabic and nothing else, because anything else
  on screen is something the eye can cheat with.
*/
function Prompt({
  question,
  revealed,
}: {
  question: Question;
  /* Answered, so the reading may be shown under the word. */
  revealed: boolean;
}) {
  if (question.direction === "production") {
    return (
      <p className="text-ink text-center text-[32px] leading-snug">
        {question.english}
      </p>
    );
  }

  /*
    The reading sits under the word once it has been answered. Down in
    the feedback block it was competing with the continue line for the
    same few pixels, and it belongs beside the thing it is a reading of
    anyway.
  */
  return (
    <div className="flex flex-col items-center gap-1">
      <Arabic
        as="p"
        className="text-ink text-center text-[64px] leading-[1.8] md:text-[88px]"
      >
        {question.arabic}
      </Arabic>

      <p
        className="text-ink-faint text-[18px] italic transition-opacity duration-200"
        style={{ opacity: revealed && question.transliteration ? 1 : 0 }}
        aria-hidden={!revealed}
      >
        {question.transliteration ?? " "}
      </p>
    </div>
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
  Build the word by tapping its letters in order.

  Typing Arabic would mean an Arabic keyboard with correct harakat,
  which is a bigger ask than the recall being tested. Tapping letters
  asks the same question, that you know the shape of the word, without
  asking anyone to install anything.

  It checks itself on the last tile, the way the PIN pad does.
*/
function AssembleAnswer({
  question,
  locked,
  onSubmit,
}: {
  question: Question;
  locked: boolean;
  onSubmit: (built: Tile[]) => void;
}) {
  const [built, setBuilt] = useState<Tile[]>([]);
  const used = new Set(built.map((t) => t.id));

  function place(tile: Tile) {
    if (locked || used.has(tile.id)) return;
    const next = [...built, tile];
    setBuilt(next);
    if (next.length === question.tiles.length) onSubmit(next);
  }

  return (
    <div className="flex flex-col gap-6">
      {/*
        The word so far, right to left, on a sunk well so an empty slot
        reads as somewhere a letter goes rather than as blank space.
      */}
      <div
        dir="rtl"
        className="border-rule bg-surface-sunk flex min-h-[76px] flex-wrap items-center justify-center gap-1 rounded-[12px] border px-4 py-3"
      >
        {built.length === 0 ? (
          <span className="text-ink-faint text-[15px]">
            Tap the letters in order
          </span>
        ) : (
          <Arabic className="text-ink text-[40px] leading-[1.6]">
            {built.map((t) => t.letter).join("")}
          </Arabic>
        )}
      </div>

      <div dir="rtl" className="flex flex-wrap justify-center gap-2">
        {question.tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            disabled={locked || used.has(tile.id)}
            onClick={() => place(tile)}
            className="border-rule bg-surface active:bg-surface-sunk min-w-[60px] rounded-[12px] border px-3 py-3 transition-opacity disabled:opacity-25"
          >
            <Arabic className="text-ink text-[30px] leading-[1.6]">
              {tile.letter}
            </Arabic>
          </button>
        ))}
      </div>

      <Button
        variant="quiet"
        disabled={locked || built.length === 0}
        onClick={() => setBuilt((b) => b.slice(0, -1))}
      >
        Undo a letter
      </Button>
    </div>
  );
}

/* A footnote sized chip. Pill is sized for a card back and reads as a
   control at this size. */
function Note({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-rule text-ink-soft inline-flex items-center rounded-[999px] border px-3 py-0.5 text-[13px]">
      {children}
    </span>
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
  result: Result;
}) {
  const tone = result.correct ? "var(--verdigris)" : "var(--clay)";

  return (
    <div className="flex flex-col items-center gap-2">
      {/*
        On a wrong answer, the side that was being asked for. The other
        side is the prompt, still on screen, so repeating it would say
        nothing. Above the verdict, because it is the part worth
        reading.
      */}
      {result.correct ? null : question.direction === "production" ? (
        <Arabic as="p" className="text-ink text-[30px] leading-[1.6]">
          {question.arabic}
        </Arabic>
      ) : (
        <p className="text-ink text-[20px]">{question.english}</p>
      )}

      {/*
        The verdict is a badge in its own colour rather than a line of
        small text that has to compete with four answer buttons.
      */}
      <p
        className="inline-flex items-center rounded-[999px] border px-4 py-1.5 text-[18px] font-medium"
        style={{ color: tone, borderColor: tone }}
      >
        {result.message}
      </p>
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
