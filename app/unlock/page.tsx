import { redirect } from "next/navigation";
import { currentProfileId } from "@/lib/session";
import { Gate } from "./gate";

export const dynamic = "force-dynamic";

export default async function UnlockPage() {
  // Already signed in, nothing to unlock.
  if ((await currentProfileId()) !== null) redirect("/today");
  return <Gate />;
}
