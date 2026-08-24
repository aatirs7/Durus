import { eq, sql } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID keys are not set");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type Notification = {
  title: string;
  body: string;
  /* Where a tap lands. */
  url: string;
};

/*
  Sends to one account's devices. iOS silently invalidates
  subscriptions, so a 404 or 410 means the row is dead and should go.
  Anything else gets three strikes.
*/
export async function sendToProfile(
  profileId: number,
  notification: Notification,
) {
  configure();

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.profileId, profileId));
  let sent = 0;
  let removed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(notification),
      );
      sent += 1;

      if (sub.failCount > 0) {
        await db
          .update(pushSubscriptions)
          .set({ failCount: 0, lastSeenAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
      }
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;

      if (status === 404 || status === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
        removed += 1;
        continue;
      }

      const [updated] = await db
        .update(pushSubscriptions)
        .set({ failCount: sql`${pushSubscriptions.failCount} + 1` })
        .where(eq(pushSubscriptions.id, sub.id))
        .returning({ failCount: pushSubscriptions.failCount });

      if (updated && updated.failCount >= 3) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
        removed += 1;
      }
    }
  }

  return { sent, removed, total: subs.length };
}
