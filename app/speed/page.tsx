import { ButtonLink, Screen } from "@/components/ui";
import { getSettings } from "@/lib/queue";
import { getSpeedWords } from "./actions";
import { SpeedRun } from "./speed-run";

export const dynamic = "force-dynamic";

export default async function SpeedPage() {
  const config = await getSettings();
  const words = await getSpeedWords();

  if (words.length === 0) {
    return (
      <Screen className="items-center justify-center gap-6">
        <p className="text-ink text-[22px]">Nothing to drill yet.</p>
        <p className="text-ink-soft text-[16px]">
          The speed drill draws from words you have already answered
          correctly twice. Review for a few days first.
        </p>
        <ButtonLink href="/" variant="quiet">
          Back to today
        </ButtonLink>
      </Screen>
    );
  }

  return <SpeedRun words={words} windowMs={config.speedWindowMs} />;
}
