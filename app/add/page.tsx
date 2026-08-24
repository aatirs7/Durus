import { getSettings } from "@/lib/queue";
import { AddForm } from "./add-form";

export const dynamic = "force-dynamic";

const TOTAL_LESSONS = 23;

export default async function AddPage({ searchParams }: PageProps<"/add">) {
  const params = await searchParams;
  const raw = Array.isArray(params.lesson) ? params.lesson[0] : params.lesson;
  const config = await getSettings();
  const requested = raw ? Number(raw) : NaN;

  const lesson =
    Number.isFinite(requested) && requested >= 1 && requested <= TOTAL_LESSONS
      ? requested
      : config.currentLesson;

  return <AddForm currentLesson={lesson} totalLessons={TOTAL_LESSONS} />;
}
