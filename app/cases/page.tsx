import { ButtonLink, Screen } from "@/components/ui";
import { getCaseQuestions } from "./actions";
import { CaseRun } from "./case-run";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const questions = await getCaseQuestions();

  if (questions.length === 0) {
    return (
      <Screen className="items-center justify-center gap-6">
        <p className="text-ink text-[22px]">No sentences to drill yet.</p>
        <p className="text-ink-soft text-[16px]">
          The case drill needs phrases with case endings on them. Those
          start in Lesson 4.
        </p>
        <ButtonLink href="/today" variant="quiet">
          Back to today
        </ButtonLink>
      </Screen>
    );
  }

  return <CaseRun questions={questions} />;
}
