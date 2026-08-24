
import { getSettings } from "@/lib/queue";
import { currentProfile } from "@/lib/session";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getSettings();
  const me = await currentProfile();

  return (
    <SettingsForm
      initial={config}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
      profileName={me?.name ?? "you"}
    />
  );
}
