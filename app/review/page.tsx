import { ButtonLink, Screen } from "@/components/ui";
import { buildQueue, buildQuestions, getSettings } from "@/lib/queue";
import { getWeekMedianMs } from "./actions";
import { ReviewSession } from "./session";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: PageProps<"/review">) {
  const params = await searchParams;
  const lessonParam = Array.isArray(params.lesson)
    ? params.lesson[0]
    : params.lesson;
  const lessonNumber = lessonParam ? Number(lessonParam) : undefined;

  const now = new Date();
  const config = await getSettings();
  const queue = await buildQueue({
    lessonNumber: Number.isFinite(lessonNumber) ? lessonNumber : undefined,
    now,
  });
  const weekMedianMs = await getWeekMedianMs();

  if (queue.length === 0) {
    return (
      <Screen className="items-center justify-center gap-6">
        <p className="text-ink text-[22px]">Nothing to review right now.</p>
        <ButtonLink href="/today" variant="quiet">
          Back to today
        </ButtonLink>
      </Screen>
    );
  }

  /*
    Distractors are drawn from the lessons already open, so a wrong
    option is always a word that could plausibly have been the answer.
  */
  const lessonNumbers = Array.from(
    { length: config.currentLesson },
    (_, i) => i + 1,
  );
  const questions = await buildQuestions(queue, lessonNumbers);

  return (
    <ReviewSession initialQueue={questions} weekMedianMs={weekMedianMs} />
  );
}
