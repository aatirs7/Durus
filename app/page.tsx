import { InstallHint } from "@/components/install-hint";
import { OfflinePill } from "@/components/offline-pill";
import { PwaRuntime } from "@/components/pwa-runtime";
import { ButtonLink, Eyebrow, Numeral, Screen } from "@/components/ui";
import { UnlockNext } from "@/components/unlock-next";
import { getNextLesson } from "./unlock-lesson";
import { TOTAL_LESSONS } from "@/lib/lessons";
import { countDue, countNewAvailable, getSettings } from "@/lib/queue";

export const dynamic = "force-dynamic";

/*
  The home screen and the PWA entry point. It answers one question:
  what do I do right now.
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
    <Screen fixed className="justify-center gap-8 py-6">
      <PwaRuntime dueCount={due} />

      <div className="flex flex-col items-center gap-6">
        <Eyebrow>{dateLine(now, config.timezone)}</Eyebrow>

        <div className="flex flex-col items-center gap-3">
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

        <div className="flex w-full flex-col gap-3">
          {/*
            When nothing is due the speed drill becomes the primary
            action. Do not congratulate, do not use an emoji.
          */}
          {clear ? (
            <ButtonLink href="/speed" className="w-full">
              Speed drill
            </ButtonLink>
          ) : (
            <ButtonLink href="/review" className="w-full">
              Start review
            </ButtonLink>
          )}

          <div className="flex flex-wrap justify-center gap-x-6">
            {clear ? null : (
              <ButtonLink href="/speed" variant="text">
                Speed drill
              </ButtonLink>
            )}
            <ButtonLink href="/cases" variant="text">
              Case drill
            </ButtonLink>
            <ButtonLink
              href={`/lessons/${config.currentLesson}`}
              variant="text"
            >
              Browse lesson {config.currentLesson}
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <UnlockNext next={next} />
        <OfflinePill />
        <InstallHint />
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
    </Screen>
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
