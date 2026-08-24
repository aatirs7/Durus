"use server";

import { sendToProfile } from "@/lib/push";
import { requireProfileId } from "@/lib/session";

/*
  Sends one notification to this account's devices, right now, ignoring
  every gate the cron applies.

  Worth having because the real reminder is deliberately hard to
  trigger: it only fires on the hour, only when something is due, and
  only when you have not just reviewed. Waiting until 20:00 to find out
  whether push works at all is not a debugging loop.
*/
export async function sendTestNotification() {
  const profileId = await requireProfileId();

  const result = await sendToProfile(profileId, {
    title: "Durus",
    body: "Reminders are working.",
    url: "/today",
  });

  if (result.total === 0) {
    return {
      ok: false as const,
      message: "No device is registered. Turn reminders on first.",
    };
  }

  if (result.sent === 0) {
    return {
      ok: false as const,
      message: `Could not reach ${result.total === 1 ? "the device" : "any device"}. ${result.removed > 0 ? "The subscription was stale and has been cleared, so turn reminders off and on again." : "Try turning reminders off and on again."}`,
    };
  }

  return {
    ok: true as const,
    message:
      result.sent === 1
        ? "Sent. It should arrive in a moment."
        : `Sent to ${result.sent} devices.`,
  };
}
