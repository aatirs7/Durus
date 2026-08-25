import Link from "next/link";
import { InstallHint } from "@/components/install-hint";
import { OfflinePill } from "@/components/offline-pill";
import { PwaRuntime } from "@/components/pwa-runtime";
import { Arabic } from "@/components/arabic";
import { ReviewHint } from "@/components/review-hint";
import { ButtonLink, Eyebrow, Numeral } from "@/components/ui";
import { UnlockNext } from "@/components/unlock-next";
import { getNextLesson } from "../unlock-lesson";
import { TOTAL_LESSONS, listLessons } from "@/lib/lessons";
import { countDue, countNewAvailable, getSettings } from "@/lib/queue";

export const dynamic = "force-dynamic";

/*
  The home screen and the PWA entry point. It answers one question:
  what do I do right now.

  Laid out as three rows, 1fr auto 1fr, so the primary action sits on
  the exact centre line of the viewport regardless of how much sits
  above or below it. Centring the whole stack instead would drift the
  button every time a line appears or disappears.
*/
export default async function TodayPage() {
  const now = new Date();
  const config = await getSettings();
  const due = await countDue(now);
  const newAvailable = await countNewAvailable(config.currentLesson);
  const newToday = Math.min(newAvailable, config.newPerDay);
  const next = await getNextLesson();
  // The tick marks name their lesson on desktop, and the masthead names
  // the one you are on.
  const lessons = await listLessons();
  const current = lessons.find((l) => l.number === config.currentLesson);

  const clear = due === 0 && newToday === 0;

  return (
    <main
      className="mx-auto grid w-full max-w-[560px] overflow-hidden px-6 lg:max-w-[680px]"
      style={{
        height: "100dvh",
        gridTemplateRows: "1fr auto 1fr",
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <PwaRuntime dueCount={due} />

      {/*
        Above the centre line, as three groups spread across the row
        rather than one column of five centred lines. Date at the top,
        where you are in the book in the middle, and the count sitting
        just above the button that acts on it.

        The count carries its own label on the same baseline. A numeral
        with a caption underneath it is two lines saying one thing.
      */}
      <div className="flex flex-col items-center justify-between pb-8">
        {/*
          The date is the page's header line. The size-10 box gives it
          the same height as the sun and moon in the corner, which is
          fixed to the viewport rather than to this row, so the two sit
          on one line instead of the date floating below it.
        */}
        <div className="flex h-10 items-center">
          <Eyebrow>{dateLine(now, config.timezone)}</Eyebrow>
        </div>

        {/*
          Where you are in the book. The English sits under the Arabic,
          the way the lessons list sets it, and never in the same text
          node, or bidi reorders the two around each other.
        */}
        {current ? (
          <div className="flex flex-col items-center gap-1">
            <Arabic className="text-ink text-[24px] leading-[1.9]">
              {current.titleAr}
            </Arabic>
            <span className="eyebrow">Lesson {current.number}</span>
          </div>
        ) : (
          <span />
        )}

        <div className="flex flex-col items-center gap-1">
          {clear ? (
            <Numeral className="lg:text-[64px]">Clear</Numeral>
          ) : (
            <div className="flex items-baseline gap-3">
              <Numeral className="lg:text-[64px]">{due}</Numeral>
              <span className="eyebrow">due</span>
            </div>
          )}

          {newToday > 0 ? (
            <p className="text-ink-soft text-[16px]">{newToday} new to learn</p>
          ) : null}
        </div>
      </div>

      {/* The centre line. */}
      {clear ? (
        <ButtonLink href="/speed" className="w-full">
          Speed drill
        </ButtonLink>
      ) : (
        <ButtonLink href="/review" className="w-full">
          Start review
        </ButtonLink>
      )}

      {/* Below the centre line. */}
      <div className="flex flex-col items-center justify-start gap-5 pt-6">
        {clear ? null : <ReviewHint />}

        {/*
          The other ways in, as a fixed two column grid rather than a
          row of links left to wrap wherever they run out of width. A
          wrapped row puts a different number of items on each line
          depending on the lesson number, which is why this read as
          unfinished: the layout was an accident of the text.

          Plain links, not tiles. Four bordered boxes under the primary
          button turned a quiet list of alternatives into a second menu
          competing with it. The grid is only there to hold the columns
          still.
        */}
        <div className="grid w-full grid-cols-2 gap-x-6 gap-y-1">
          {(clear ? [] : [{ href: "/speed", label: "Speed drill" }])
            .concat([
              { href: "/cards", label: "Flashcards" },
              { href: "/cases", label: "Case drill" },
              {
                href: `/lessons/${config.currentLesson}`,
                label: `Lesson ${config.currentLesson}`,
              },
            ])
            .map((entry) => (
              <ButtonLink
                key={entry.href}
                href={entry.href}
                variant="text"
                className="w-full"
              >
                {entry.label}
              </ButtonLink>
            ))}
        </div>

        <UnlockNext next={next} />
        <OfflinePill />
        <InstallHint />

        <div className="mt-auto flex flex-col items-center gap-5">
          <LessonTicks current={config.currentLesson} />
          <LessonTicksDesktop
            current={config.currentLesson}
            lessons={lessons}
          />
          <div className="flex justify-center gap-6">
            <ButtonLink href="/stats" variant="text">
              Stats
            </ButtonLink>
            <ButtonLink href="/settings" variant="text">
              Settings
            </ButtonLink>
          </div>
        </div>
      </div>
    </main>
  );
}

/*
  Twenty three tick marks, no numbers. A progress bar that happens to be
  honest about how far the book goes.

  On a phone this is decoration and nothing more, because a two pixel
  tap target is not a control. The desktop version below replaces it
  outright rather than adding behaviour to it, so the mobile markup is
  untouched.
*/
function LessonTicks({ current }: { current: number }) {
  return (
    <div className="flex justify-center gap-1.5 lg:hidden" aria-hidden>
      {Array.from({ length: TOTAL_LESSONS }, (_, i) => (
        <span
          key={i}
          className="h-4 w-[2px] rounded-[999px]"
          style={{
            backgroundColor: i < current ? "var(--lapis)" : "var(--rule)",
          }}
        />
      ))}
    </div>
  );
}

/* Hijri and Gregorian on one line, through Intl, no library. */
function dateLine(now: Date, timeZone: string): string {
  const gregorian = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const hijri = new Intl.DateTimeFormat("en-GB-u-ca-islamic-umalqura", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return `${hijri.replace(" AH", "")} AH, ${gregorian}`;
}

/*
  The same twenty three ticks with a pointer over them. Each one names
  its lesson and its card count on hover and, once the lesson has been
  reached, walks through to it. Ticks past the current lesson stay dead,
  the same rule the lessons list follows.
*/
function LessonTicksDesktop({
  current,
  lessons,
}: {
  current: number;
  lessons: { number: number; cardCount: number }[];
}) {
  const counts = new Map(lessons.map((l) => [l.number, l.cardCount]));

  return (
    <div className="hidden justify-center gap-1.5 lg:flex">
      {Array.from({ length: TOTAL_LESSONS }, (_, i) => {
        const number = i + 1;
        const done = i < current;
        const count = counts.get(number) ?? 0;
        const label = `Lesson ${number}, ${
          count === 0 ? "no cards yet" : `${count} cards`
        }`;
        const tick = (
          <span
            className="block h-4 w-[2px] rounded-[999px]"
            style={{ backgroundColor: done ? "var(--lapis)" : "var(--rule)" }}
          />
        );

        const tip = (
          <span className="border-rule bg-surface text-ink-soft pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 hidden -translate-x-1/2 rounded-[12px] border px-3 py-1.5 text-[12px] whitespace-nowrap group-hover:block">
            {label}
          </span>
        );

        return number > current ? (
          <span
            key={number}
            className="group relative flex cursor-default"
            aria-label={label}
          >
            {tick}
            {tip}
          </span>
        ) : (
          <Link
            key={number}
            href={`/lessons/${number}`}
            aria-label={label}
            className="group relative flex"
          >
            {tick}
            {tip}
          </Link>
        );
      })}
    </div>
  );
}
