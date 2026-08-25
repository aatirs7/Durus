import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { poolDb } from "@/db/pool";
import { profiles } from "@/db/schema";
import { clerk, provisionProfile } from "@/lib/api-auth";
import { verifyToken } from "@clerk/backend";

/* The webhook and the sync route both need the raw request, and Clerk's
   verification is Node only. */
export const runtime = "nodejs";

/*
  First contact. Turns a Clerk session into a local profile id and hands back
  the cursor to start from.

  Separate from /sync on purpose: sync refuses to create accounts, so a bad
  token there is an error rather than a silently empty new profile.
*/
export async function POST(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey || !clerk) {
    return NextResponse.json({ error: "clerk_not_configured" }, { status: 503 });
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let clerkUserId: string;
  try {
    const claims = await verifyToken(header.slice(7), { secretKey });
    if (!claims.sub) throw new Error("no subject");
    clerkUserId = claims.sub;
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  /* The display name is a label, nothing more - it is not unique and nothing
     resolves by it. The unique index on lower(name) was dropped with the PIN. */
  let displayName = "You";
  try {
    const user = await clerk.users.getUser(clerkUserId);
    displayName =
      user.firstName ??
      user.username ??
      user.emailAddresses[0]?.emailAddress?.split("@")[0] ??
      "You";
  } catch {
    /* A name lookup failure must not stop provisioning. */
  }

  const { profileId, createdNow } = await provisionProfile(clerkUserId, displayName);

  const [row] = await poolDb
    .select({ syncSeq: profiles.syncSeq, name: profiles.name })
    .from(profiles)
    .where(eq(profiles.id, profileId));

  return NextResponse.json({
    profileId,
    clerkUserId,
    displayName: row?.name ?? displayName,
    createdNow,
    /* Zero, not the current sequence: a new device has to pull the whole
       history, not just what happens next. */
    cursor: 0,
  });
}
