import { InstallHint } from "@/components/install-hint";
import { OfflinePill } from "@/components/offline-pill";
import { PwaRuntime } from "@/components/pwa-runtime";
import { ButtonLink, Eyebrow, Numeral } from "@/components/ui";
import { UnlockNext } from "@/components/unlock-next";
import { getNextLesson } from "./unlock-lesson";
import { TOTAL_LESSONS } from "@/lib/lessons";
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

  const clear = due === 0 && newToday === 0;

  return (
    <main
      className="mx-auto grid w-full max-w-[560px] overflow-hidden px-6"
      style={{
        height: "100dvh",
        gridTemplateRows: "1fr auto 1fr",
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <PwaRuntime dueCount={due} />

      {/* Above the centre line. */}
      <div className="flex flex-col items-center justify-end gap-4 pb-8">
        <Eyebrow>{dateLine(now, config.timezone)}</Eyebrow>

        {clear ? (
          <Numeral>Clear</Numeral>
        ) : (
          <>
            <Numeral>{due}</Numeral>
            <span className="eyebrow">due today</span>
          </>
        )}

        {newToday > 0 ? (
          <p className="text-ink-soft text-[16px]">
            {newToday} new from Lesson {config.currentLesson}
          </p>
        ) : null}
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
        <div className="flex flex-wrap justify-center gap-x-5">
          {clear ? null : (
            <ButtonLink href="/speed" variant="text">
              Speed drill
            </ButtonLink>
          )}
          <ButtonLink href="/cases" variant="text">
            Case drill
          </ButtonLink>
          <ButtonLink href={`/lessons/${config.currentLesson}`} variant="text">
            Browse lesson {config.currentLesson}
          </ButtonLink>
        </div>

        <UnlockNext next={next} />
        <OfflinePill />
        <InstallHint />

        <div className="mt-auto flex flex-col items-center gap-5">
          <LessonTicks current={config.currentLesson} />
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
*/
function LessonTicks({ current }: { current: number }) {
  return (
    <div className="flex justify-center gap-1.5" aria-hidden>
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
