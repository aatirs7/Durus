import { ButtonLink, DeadLink, Eyebrow, Numeral, Screen } from "@/components/ui";
import { countDue, countNewAvailable, getSettings } from "@/lib/queue";

export const dynamic = "force-dynamic";

const TOTAL_LESSONS = 23;

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

  const clear = due === 0 && newToday === 0;

  return (
    <Screen className="justify-between gap-10 py-10">
      <div className="flex flex-col items-center gap-8">
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
          {clear ? (
            <DeadLink>Speed drill</DeadLink>
          ) : (
            <ButtonLink href="/review" className="w-full">
              Start review
            </ButtonLink>
          )}

          <div className="flex justify-center gap-6">
            <DeadLink>Speed drill</DeadLink>
            <ButtonLink href="/add" variant="text">
              Add words
            </ButtonLink>
          </div>
        </div>
      </div>

      <LessonTicks current={config.currentLesson} />
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
