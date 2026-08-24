import { NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { currentProfileId } from "@/lib/session";

/*
  Re-registered on every launch, not just the first, because iOS
  silently invalidates subscriptions and refreshing lastSeenAt is the
  only way to notice.
*/
export async function POST(request: Request) {
  const body = await request.json();
  const { endpoint, keys, userAgent } = body ?? {};

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "incomplete subscription" }, { status: 400 });
  }

  // A subscription belongs to whoever is signed in, so a reminder about
  // due cards reaches the person whose cards they are.
  const profileId = await currentProfileId();
  if (profileId === null) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  await db
    .insert(pushSubscriptions)
    .values({
      profileId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent ?? null,
      lastSeenAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        profileId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? null,
        lastSeenAt: new Date(),
        failCount: 0,
      },
    });

  return NextResponse.json({ ok: true });
}
