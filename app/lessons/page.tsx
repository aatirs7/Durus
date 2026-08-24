import Link from "next/link";
import { Arabic } from "@/components/arabic";
import { Eyebrow, PageTitle, Screen } from "@/components/ui";
import { listLessons } from "@/lib/lessons";
import { getSettings } from "@/lib/queue";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const config = await getSettings();
  const rows = await listLessons();

  return (
    <Screen className="gap-8 py-10">
      <div className="flex flex-col gap-2">
        <Eyebrow>Book one</Eyebrow>
        <PageTitle>Lessons</PageTitle>
      </div>

      <ul className="flex flex-col">
        {rows.map((lesson) => {
          // Lessons beyond the current one are not tappable. Never show
          // material from a lesson that has not been taught yet.
          const locked = lesson.number > config.currentLesson;
          const body = (
            <div
              className={`border-rule flex flex-col items-center gap-1 border-b py-5 ${
                locked ? "opacity-40" : ""
              }`}
            >
              <span className="tabular text-ink-soft text-[13px]">
                {lesson.number}
              </span>
              <Arabic as="p" className="text-ink text-[28px] leading-[1.8]">
                {lesson.titleAr}
              </Arabic>
              <span className="text-ink-soft text-[15px]">{lesson.titleEn}</span>
              <span className="tabular text-ink-faint text-[13px]">
                {lesson.cardCount === 0
                  ? "no cards yet"
                  : `${lesson.cardCount} cards`}
              </span>
            </div>
          );

          return (
            <li key={lesson.number}>
              {locked ? (
                body
              ) : (
                <Link href={`/lessons/${lesson.number}`}>{body}</Link>
              )}
            </li>
          );
        })}
      </ul>

      <Link href="/" className="text-lapis text-[16px] underline-offset-4">
        Back to today
      </Link>
    </Screen>
  );
}
