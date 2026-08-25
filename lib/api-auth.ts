import { createClerkClient, verifyToken } from "@clerk/backend";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { poolDb } from "@/db/pool";
import { profiles, settings } from "@/db/schema";

/*
  Turns a bearer token from the phone into a local profile id.

  The single place that happens, for the same reason lib/session.ts is the
  single place a cookie becomes one: a query that quietly forgets to filter by
  profile is invisible while there is one account and a data leak the moment
  there are two. Every route handler takes profileId from here and nowhere else.
*/

const secretKey = process.env.CLERK_SECRET_KEY;

export const clerk = secretKey ? createClerkClient({ secretKey }) : null;

export type AuthOk = { ok: true; clerkUserId: string; profileId: number };
export type AuthFail = { ok: false; response: NextResponse };
export type AuthResult = AuthOk | AuthFail;

function fail(status: number, error: string): AuthFail {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

async function clerkUserIdFrom(request: Request): Promise<string | null> {
  if (!secretKey) return null;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const claims = await verifyToken(header.slice(7), { secretKey });
    return claims.sub ?? null;
  } catch {
    return null;
  }
}

/*
  Resolves an existing profile. Does NOT create one - that is bootstrap's job,
  and letting every endpoint create accounts on demand means a typo in a token
  silently produces an empty profile rather than an error.
*/
export async function authenticate(request: Request): Promise<AuthResult> {
  if (!secretKey) return fail(503, "clerk_not_configured");

  const clerkUserId = await clerkUserIdFrom(request);
  if (!clerkUserId) return fail(401, "unauthenticated");

  const [row] = await poolDb
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.clerkUserId, clerkUserId), isNull(profiles.deletedAt)));

  /*
    410 rather than 404, and terminal on the client. The account existed and no
    longer does, so retrying can only fail - the device clears its local account
    row and stops rather than backing off forever.
  */
  if (!row) return fail(410, "profile_deleted");

  return { ok: true, clerkUserId, profileId: row.id };
}

/*
  Finds or creates the profile for a Clerk user.

  The insert is on conflict do nothing followed by a re-select, because two
  devices bootstrapping the same account at the same moment must never produce
  two profiles - the unique index on clerk_user_id is what makes the race safe,
  and the re-select is what makes it correct rather than merely non-crashing.

  The settings row is created HERE rather than on the device, so a second device
  inherits the first one's settings through the normal pull instead of racing to
  write a conflicting set of defaults.
*/
export async function provisionProfile(
  clerkUserId: string,
  displayName: string,
): Promise<{ profileId: number; createdNow: boolean }> {
  const [existing] = await poolDb
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.clerkUserId, clerkUserId), isNull(profiles.deletedAt)));

  if (existing) return { profileId: existing.id, createdNow: false };

  await poolDb
    .insert(profiles)
    .values({ clerkUserId, name: displayName })
    .onConflictDoNothing();

  const [row] = await poolDb
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId));

  if (!row) throw new Error("could not provision a profile");

  await poolDb.insert(settings).values({ profileId: row.id }).onConflictDoNothing();

  return { profileId: row.id, createdNow: true };
}
