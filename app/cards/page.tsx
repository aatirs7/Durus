import { ButtonLink, Screen } from "@/components/ui";
import { getStudyDeck } from "@/lib/lessons";
import { requireProfileId } from "@/lib/session";
import { getSettings } from "@/lib/queue";
import { CardsDeck } from "./deck";

export const dynamic = "force-dynamic";

export default async function LearnPage({ searchParams }: PageProps<"/cards">) {
  const params = await searchParams;
  const raw = Array.isArray(params.lesson) ? params.lesson[0] : params.lesson;
  const asked = raw ? Number(raw) : NaN;

  const config = await getSettings();
  const lessonNumber =
    Number.isFinite(asked) && asked >= 1 && asked <= config.currentLesson
      ? asked
      : undefined;

  const profileId = await requireProfileId();
  const cards = await getStudyDeck(config.currentLesson, lessonNumber, profileId);

  if (cards.length === 0) {
    return (
      <Screen className="items-center justify-center gap-6">
        <p className="text-ink text-[22px]">No words to read yet.</p>
        <ButtonLink href="/today" variant="quiet">
          Back to today
        </ButtonLink>
      </Screen>
    );
  }

  return <CardsDeck cards={cards} />;
}
