import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, settings } from "@/db/schema";

/*
  The one place a request turns into a profile id. Every scoped query goes
  through this, so no query can quietly forget to filter and end up reading
  somebody else's deck.

  It used to read a signed cookie holding the profile id, set by a name and a
  four digit PIN. Identity is Clerk now, on both the web and the phone, against
  the SAME instance - which is the whole point: sign in here and on the phone
  and it is one account, one profile row, one schedule. Answer a card on the bus
  and it is waiting in the browser.

  The PIN profiles are not migrated. They were five or six accounts belonging to
  the author and people he knows, they have no email address on them to match a
  Clerk user against, and inventing a claim flow for them would be more
  machinery than the data is worth. They stay in the table, unreachable, rather
  than being deleted from a live database on a hunch.
*/

/*
  Provisioning happens HERE, on first sight of a new Clerk user, rather than in
  a sign-up webhook.

  A webhook is a second system that has to be up at exactly the wrong moment,
  and its failure mode is a signed-in user with no profile looking at an error.
  This way the first request that needs a profile creates one, and every request
  after it finds the same row.
*/
async function profileIdFor(clerkUserId: string): Promise<number> {
  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.clerkUserId, clerkUserId), isNull(profiles.deletedAt)));

  if (existing) return existing.id;

  /*
    Insert then re-select, rather than trusting the returning clause: two
    requests from the same new user can arrive together, and the unique index on
    clerk_user_id is what makes that race safe. The re-select is what makes it
    correct rather than merely non-crashing - both requests must end up on the
    row that won.
  */
  await db.insert(profiles).values({ clerkUserId, name: "You" }).onConflictDoNothing();

  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId));

  if (!row) throw new Error("could not provision a profile");

  await db.insert(settings).values({ profileId: row.id }).onConflictDoNothing();

  return row.id;
}

export async function currentProfileId(): Promise<number | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return profileIdFor(userId);
}

/*
  For pages and actions that cannot run without an account. The proxy already
  redirects unauthenticated requests, so reaching this with no user means the
  session went away between the two.
*/
export async function requireProfileId(): Promise<number> {
  const id = await currentProfileId();
  if (id === null) redirect("/sign-in");
  return id;
}

export async function currentProfile() {
  const id = await currentProfileId();
  if (id === null) return null;
  const [row] = await db.select().from(profiles).where(eq(profiles.id, id));
  return row ?? null;
}

/*
  Settings are per profile and created alongside the account, so a missing row
  means the account was made before settings existed. Fill it in rather than
  failing the request.
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
