/*
  Which question to ask, and what the answer earns.

  The manual Again / Hard / Good / Easy row is gone. Grading is derived
  from whether the answer was right and how long it took, which is the
  thing this app claims to train in the first place.

  Pure, so both halves are unit testable.
*/

import type { Grade } from "./srs";

export type Mode =
  /* Tap the right meaning out of four. */
  | "choice"
  /* Type the English. */
  | "written"
  /* Read it, then say it aloud and self report. The only mode that
     cannot be checked mechanically. */
  | "spoken";

export type Direction = "recognition" | "production";

/*
  Escalation, in the Quizlet Learn sense: a card gets harder to answer
  as it gets easier to remember.

  Phrases stay on choice forever. Typing out "where is the boy? he is
  in the mosque" is a test of patience, not of Arabic.
*/
export function modeFor(
  card: { type: "vocab" | "phrase"; repetitions: number },
  direction: Direction,
): Mode {
  // Producing Arabic from English is asked by choice, because an Arabic
  // keyboard with correct harakat is a bigger ask than the recall is.
  if (direction === "production") return "choice";
  if (card.type === "phrase") return "choice";
  return card.repetitions >= 2 ? "written" : "choice";
}

/*
  How long an answer may take before it stops counting as fluent.

  These are per mode because the floor is the interface, not the recall.
  Tapping one of four is quick even when you are unsure. Typing a word
  takes seconds no matter how well you know it.
*/
export const THRESHOLDS: Record<Mode, { fast: number; slow: number }> = {
  choice: { fast: 2500, slow: 6000 },
  written: { fast: 6000, slow: 14000 },
  spoken: { fast: 4000, slow: 10000 },
};

export type Outcome = {
  correct: boolean;
  /* Right answer, wrong spelling. Correct, but never fluent. */
  close?: boolean;
  msToAnswer: number;
  mode: Mode;
};

/*
  Wrong is always again, however fast it was. Being quickly wrong is
  still wrong, and the card needs to come back this session.
*/
export function gradeFor(outcome: Outcome): Grade {
  if (!outcome.correct) return "again";

  const { fast, slow } = THRESHOLDS[outcome.mode];

  // A misspelling means it was known but not solid, so it can never
  // earn the longest interval.
  if (outcome.close) return outcome.msToAnswer > slow ? "hard" : "good";

  if (outcome.msToAnswer <= fast) return "easy";
  if (outcome.msToAnswer >= slow) return "hard";
  return "good";
}

/* What the session says after an answer. Never praise, never a streak. */
export function feedbackFor(outcome: Outcome, grade: Grade): string {
  if (!outcome.correct) return "Not that one.";
  if (outcome.close) return "Right, with a spelling slip.";
  if (grade === "easy") return "Straight away.";
  if (grade === "hard") return "Right, but slow.";
  return "Right.";
}
