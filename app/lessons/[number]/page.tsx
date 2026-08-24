import Link from "next/link";
import { notFound } from "next/navigation";
import { Arabic } from "@/components/arabic";
import {
  ButtonLink,
  Eyebrow,
  PageTitle,
  Rule,
  Screen,
} from "@/components/ui";
import { MATURITY_COLOR, getLesson } from "@/lib/lessons";
import { getSettings } from "@/lib/queue";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: PageProps<"/lessons/[number]">) {
  const { number } = await params;
  const lessonNumber = Number(number);
  if (!Number.isInteger(lessonNumber)) notFound();

  const config = await getSettings();
  if (lessonNumber > config.currentLesson) notFound();

  const data = await getLesson(lessonNumber);
  if (!data) notFound();

  const { lesson, cards } = data;

  return (
    <Screen className="gap-8 py-10">
      <div className="flex flex-col gap-2">
        <Eyebrow>Lesson {lesson.number}</Eyebrow>
        <Arabic as="p" className="text-ink text-[32px] leading-[2]">
          {lesson.titleAr}
        </Arabic>
        <PageTitle>{lesson.titleEn}</PageTitle>
      </div>

      {/*
        The grammar note is the one place in the app that is left
        aligned, because it is running prose and centering breaks it.
      */}
      {lesson.grammarNote ? (
        <p className="text-ink-soft mx-auto w-full text-left text-[16px] leading-relaxed lg:max-w-[560px]">
          {lesson.grammarNote}
        </p>
      ) : null}

      <Rule />

      {cards.length === 0 ? (
        <p className="text-ink-soft text-[16px]">
          No cards in Lesson {lesson.number} yet. Add them after class.
        </p>
      ) : (
        /*
          Two columns of tiles on desktop. Each tile keeps its own
          English left, Arabic right, and the two columns are
          deliberately not aligned to a shared Arabic axis, because that
          would turn a set of cards into a spreadsheet.
        */
        <ul className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-x-10">
          {cards.map((card) => (
            <li
              key={card.id}
              className="border-rule flex items-center gap-3 border-b py-4"
            >
              <span
                className="size-2 shrink-0 rounded-[999px]"
                style={{ backgroundColor: MATURITY_COLOR[card.maturity] }}
                aria-label={card.maturity}
              />
              <span className="text-ink-soft flex-1 text-left text-[15px]">
                {card.english}
              </span>
              <Arabic className="text-ink text-[24px] leading-[1.8]">
                {card.arabic}
              </Arabic>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3">
        <ButtonLink href={`/review?lesson=${lesson.number}`}>
          Drill this lesson only
        </ButtonLink>
      </div>

      <Link href="/lessons" className="text-lapis text-[16px] underline-offset-4">
        All lessons
      </Link>
    </Screen>
  );
}
