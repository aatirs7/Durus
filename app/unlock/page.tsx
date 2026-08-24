import { redirect } from "next/navigation";
import { currentProfileId } from "@/lib/session";
import { Gate } from "./gate";

export const dynamic = "force-dynamic";

export default async function UnlockPage({
  searchParams,
}: PageProps<"/unlock">) {
  // Already signed in, nothing to unlock.
  if ((await currentProfileId()) !== null) redirect("/today");

  /*
    The gate is one flow either way, since the name decides which of the
    two you meant. The parameter only changes what it says first, so
    that someone arriving from the Create an account button on the
    landing page is not greeted by a screen that assumes they have been
    here before.
  */
  const params = await searchParams;
  const intent = params.new !== undefined ? "signup" : "signin";

  return <Gate intent={intent} />;
}
