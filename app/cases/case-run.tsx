"use client";

import { useState } from "react";
import { Arabic } from "@/components/arabic";
import { ButtonLink, Eyebrow, Numeral, Screen } from "@/components/ui";
import {
  CASE_LABELS,
  CASE_ORDER,
  type CaseEnding,
  type CaseQuestion,
} from "@/lib/case-drill";

/*
  Tests the rule, not the vocabulary. It does not touch cardStates,
  for the same reason the speed drill does not: this measures whether
  the grammar has landed, it does not schedule words.
*/
export function CaseRun({ questions }: { questions: CaseQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<CaseEnding | null>(null);
  const [correct, setCorrect] = useState(0);

  const q = questions[index];

  if (!q) {
    const accuracy =
      questions.length === 0
        ? 0
        : Math.round((correct / questions.length) * 100);
    return (
      <Screen className="items-center justify-center gap-8 py-10">
        <Numeral>{`${accuracy}%`}</Numeral>
        <Eyebrow>endings correct</Eyebrow>
        <p className="text-ink-soft text-[16px]">
          {correct} of {questions.length}
        </p>
        <ButtonLink href="/" className="w-full max-w-[320px]">
          Back to today
        </ButtonLink>
      </Screen>
    );
  }

  const answered = picked !== null;

  return (
    <Screen className="items-center justify-center gap-10 py-10">
      <Eyebrow>
        {index + 1} of {questions.length}
      </Eyebrow>

      {/*
        The whole sentence stays in one RTL element. Splitting it across
        elements to style the blank would let bidi reorder the pieces.
      */}
      <Arabic as="p" className="text-ink text-[32px] leading-[2]">
        {[q.before, answered ? q.stem + CASE_LABELS[q.answer].ar : q.stem + "؞", q.after]
          .filter(Boolean)
          .join(" ")}
      </Arabic>

      <p className="text-ink-soft text-[16px]">{q.english}</p>

      <div className="grid w-full grid-cols-4 gap-2">
        {CASE_ORDER.map((ending) => {
          const isAnswer = ending === q.answer;
          const isPicked = ending === picked;

          let border = "border-rule";
          let color: string | undefined;
          if (answered && isAnswer) {
            border = "border-verdigris";
            color = "var(--verdigris)";
          } else if (answered && isPicked) {
            border = "border-clay";
            color = "var(--clay)";
          }

          return (
            <button
              key={ending}
              type="button"
              disabled={answered}
              onClick={() => {
                setPicked(ending);
                if (isAnswer) setCorrect((n) => n + 1);
              }}
              className={`bg-surface flex flex-col items-center gap-1 rounded-[12px] border py-3 ${border}`}
            >
              <Arabic className="text-ink text-[24px] leading-none">
                {CASE_LABELS[ending].ar}
              </Arabic>
              <span className="text-[13px]" style={color ? { color } : undefined}>
                {CASE_LABELS[ending].en}
              </span>
            </button>
          );
        })}
      </div>

      {answered ? (
        <button
          type="button"
          onClick={() => {
            setPicked(null);
            setIndex((i) => i + 1);
          }}
          className="text-lapis text-[16px] underline-offset-4"
        >
          Next
        </button>
      ) : null}
    </Screen>
  );
}
