import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, settings } from "@/db/schema";
import { SESSION_COOKIE, readSessionToken } from "./auth";

/*
  The one place a request turns into a profile id. Every scoped query
  goes through this, so no query can quietly forget to filter and end up
  reading somebody else's deck.
*/

export async function currentProfileId(): Promise<number | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

/*
  For pages and actions that cannot run without an account. The proxy
  already redirects unauthenticated requests, so reaching this means the
  cookie was valid but the profile is gone, which is a stale session.
*/
export async function requireProfileId(): Promise<number> {
  const id = await currentProfileId();
  if (id === null) redirect("/unlock");

  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, id));
  if (!row) redirect("/unlock");

  return id;
}

export async function currentProfile() {
  const id = await currentProfileId();
  if (id === null) return null;
  const [row] = await db.select().from(profiles).where(eq(profiles.id, id));
  return row ?? null;
}

/*
  Settings are per profile and created alongside the account, so a
  missing row means the account was made before settings existed. Fill
  it in rather than failing the request.
*/
export async function getSettingsFor(profileId: number) {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.profileId, profileId));
  if (row) return row;

  const [created] = await db
    .insert(settings)
    .values({ profileId })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const [again] = await db
    .select()
    .from(settings)
    .where(eq(settings.profileId, profileId));
  return again;
}
