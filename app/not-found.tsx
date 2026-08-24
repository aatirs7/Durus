import { ButtonLink, Eyebrow, Screen } from "@/components/ui";

/*
  Several routes in the spec are not built yet, so this gets hit by real
  navigation rather than only by typos. It states what happened and
  offers the one thing that always works.
*/
export default function NotFound() {
  return (
    <Screen className="items-center justify-center gap-6">
      <Eyebrow>Not here</Eyebrow>
      <p className="text-ink text-[22px]">That page does not exist yet.</p>
      <ButtonLink href="/today" className="w-full max-w-[320px]">
        Back to today
      </ButtonLink>
    </Screen>
  );
}
