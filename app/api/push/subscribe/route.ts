import { NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

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

  await db
    .insert(pushSubscriptions)
    .values({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent ?? null,
      lastSeenAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? null,
        lastSeenAt: new Date(),
        failCount: 0,
      },
    });

  return NextResponse.json({ ok: true });
}
