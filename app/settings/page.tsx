import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { getSettings } from "@/lib/queue";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getSettings();
  const [row] = await db.select().from(profile).where(eq(profile.id, 1));

  return (
    <SettingsForm
      initial={config}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
      profileName={row?.name ?? "you"}
    />
  );
}
