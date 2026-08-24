import { ButtonLink, Screen } from "@/components/ui";
import { buildQueue, getSettings } from "@/lib/queue";
import { isCurrentLessonCapped } from "@/lib/srs";
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
        <ButtonLink href="/" variant="quiet">
          Back to today
        </ButtonLink>
      </Screen>
    );
  }

  /*
    Which lesson numbers are currently under the three day cap. Computed
    once here so the grade button labels do not have to hit the database.
  */
  const capturedLessons: Record<number, boolean> = {};
  for (const item of queue) {
    capturedLessons[item.lessonNumber] = isCurrentLessonCapped(
      item.lessonNumber,
      config.currentLesson,
      config.currentLessonSince,
      now,
    );
  }

  return (
    <ReviewSession
      initialQueue={queue}
      capturedLessons={capturedLessons}
      weekMedianMs={weekMedianMs}
    />
  );
}
