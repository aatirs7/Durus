"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Arabic } from "@/components/arabic";
import { Button, Eyebrow, PageTitle, Pill, Rule, Screen } from "@/components/ui";
import { parseCards } from "@/lib/parse-cards";
import { addCards } from "./actions";

const PLACEHOLDER = [
  "بَيْتٌ | house | m",
  "مَسْجِدٌ | mosque | m | مَسَاجِدُ | diptote",
  "هٰذَا بَيْتٌ | this is a house | phrase",
].join("\n");

export function AddForm({
  currentLesson,
  totalLessons,
}: {
  currentLesson: number;
  totalLessons: number;
}) {
  const [text, setText] = useState("");
  const [lesson, setLesson] = useState(currentLesson);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Parsed on every keystroke, so a missing shadda is caught before it
  // enters the deck.
  const { cards, errors } = useMemo(() => parseCards(text), [text]);
  const warnings = cards.filter((c) => c.warning);

  function submit() {
    startTransition(async () => {
      const res = await addCards(lesson, text);
      setResult(res.message);
      if (res.ok) setText("");
    });
  }

  return (
    <Screen className="gap-6 py-10">
      <div className="flex flex-col gap-2">
        <Eyebrow>After class</Eyebrow>
        <PageTitle>Add words</PageTitle>
        <p className="text-ink-soft text-[16px]">
          arabic | english | gender or the word phrase | plural | note
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        spellCheck={false}
        placeholder={PLACEHOLDER}
        aria-label="Lines to add"
        className="border-rule bg-surface-sunk text-ink placeholder:text-ink-faint focus:border-lapis w-full rounded-[16px] border p-4 text-left text-[16px] outline-none"
        // Explicitly LTR. With dir="auto" the first strong character is
        // Arabic, so the whole line flips to an RTL base direction and the
        // pipe separated fields render in reverse order.
        dir="ltr"
      />

      <div className="flex items-center justify-center gap-3">
        <Eyebrow>Lesson</Eyebrow>
        <div className="border-rule bg-surface flex items-center gap-1 rounded-[999px] border px-2 py-1">
          <button
            type="button"
            aria-label="Previous lesson"
            onClick={() => setLesson((n) => Math.max(1, n - 1))}
            className="text-ink-soft px-3 py-1 text-[18px]"
          >
            -
          </button>
          <span className="tabular text-ink w-8 text-[18px]">{lesson}</span>
          <button
            type="button"
            aria-label="Next lesson"
            onClick={() => setLesson((n) => Math.min(totalLessons, n + 1))}
            className="text-ink-soft px-3 py-1 text-[18px]"
          >
            +
          </button>
        </div>
      </div>

      <Button onClick={submit} disabled={pending || cards.length === 0}>
        {pending ? "Adding" : `Add ${cards.length} cards`}
      </Button>

      {result ? <p className="text-ink-soft text-[16px]">{result}</p> : null}

      {errors.length > 0 ? (
        <div className="flex flex-col gap-2">
          {errors.map((e) => (
            <p key={e.line} className="text-clay text-left text-[15px]">
              {e.message}
            </p>
          ))}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="flex flex-col gap-2">
          {warnings.map((c) => (
            <p key={c.line} className="text-saffron text-left text-[15px]">
              {c.warning}
            </p>
          ))}
        </div>
      ) : null}

      {cards.length > 0 ? (
        <>
          <Rule />
          <Eyebrow>Preview</Eyebrow>
          <ul className="flex flex-col gap-6">
            {cards.map((c) => (
              <li key={c.line} className="flex flex-col items-center gap-2">
                <Arabic as="p" className="text-ink text-[40px] leading-[1.8]">
                  {c.arabic}
                </Arabic>
                <p className="text-ink text-[22px]">{c.english}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {c.type === "phrase" ? <Pill>phrase</Pill> : null}
                  {c.gender ? (
                    <Pill>{c.gender === "m" ? "masculine" : "feminine"}</Pill>
                  ) : null}
                  {c.plural ? (
                    <Pill>
                      <Arabic>{c.plural}</Arabic>
                    </Pill>
                  ) : null}
                </div>
                {c.note ? (
                  <p className="text-ink-soft text-[15px]">{c.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <Link href="/" className="text-lapis text-[16px] underline-offset-4">
        Back to today
      </Link>
    </Screen>
  );
}
