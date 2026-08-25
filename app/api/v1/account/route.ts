import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { poolDb } from "@/db/pool";
import { profiles } from "@/db/schema";
import { authenticate, clerk } from "@/lib/api-auth";

/* Clerk's backend SDK is Node only. */
export const runtime = "nodejs";

/*
  Deleting an account, for real, from inside the app.

  App Store guideline 5.1.1(v): an app that lets you create an account must let
  you delete it, in the app, without writing to anyone. That is the reason this
  route exists, but it is also the only honest answer to "how do I leave" - the
  export in Settings hands back the data, and this removes it.

  Two things happen, in this order, and the order matters:

    1. the profile is tombstoned  -> every later API call 401s at the Clerk step
                                     or 410s at the profile step, so no device
                                     can keep writing to a deleted account
    2. the Clerk user is deleted  -> the identity itself goes

  Doing it the other way round leaves a window where the identity is gone but
  the rows are still live and reachable by a token that has not expired yet.

  The tombstone is a soft delete because the rows are referenced from six other
  tables by profile_id, and a hard delete would either cascade through review
  history mid-request or fail on a constraint. lib/api-auth.ts already filters
  every lookup on `deletedAt is null`, so a tombstoned profile is unreachable
  the moment this commits - which is what makes the soft delete sufficient
  rather than a half measure. The rows themselves are cleared out separately.
*/
export async function DELETE(request: Request) {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;

  await poolDb
    .update(profiles)
    .set({ deletedAt: new Date() })
    .where(eq(profiles.id, auth.profileId));

  /*
    A failure here is reported, not swallowed.

    The profile is already unreachable at this point, so the user's data is gone
    as far as the app is concerned either way. But if the Clerk user survives,
    signing in again would provision a SECOND empty profile rather than telling
    them the account is gone, and they would have no way to tell that the
    deletion had half failed. Better to say so and let them try again.
  */
  if (clerk) {
    try {
      await clerk.users.deleteUser(auth.clerkUserId);
    } catch {
      return NextResponse.json({ error: "identity_not_deleted" }, { status: 502 });
    }
  }

  return NextResponse.json({ deleted: true });
}
