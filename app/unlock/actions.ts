"use server";

import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { profiles, settings } from "@/db/schema";
import {
  MAX_NAME_LENGTH,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  hashPin,
  isValidPin,
  newSalt,
  pinMatches,
} from "@/lib/auth";

export type AuthResult = {
  ok: boolean;
  error: string | null;
};

async function startSession(profileId: number) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(profileId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/*
  Names are matched case insensitively, so Aatir and aatir are one
  account rather than two.
*/
function byName(name: string) {
  return sql`lower(${profiles.name}) = ${name.trim().toLowerCase()}`;
}

/*
  Whether an account with this name exists, so the sign in screen knows
  whether to ask for a PIN or to offer creating one.
*/
export async function findAccount(
  name: string,
): Promise<{ found: boolean; name: string | null }> {
  if (name.trim().length === 0) return { found: false, name: null };
  const [row] = await db
    .select({ name: profiles.name })
    .from(profiles)
    .where(byName(name));
  return { found: Boolean(row), name: row?.name ?? null };
}

export async function createAccount(
  name: string,
  pin: string,
): Promise<AuthResult> {
  const trimmed = name.trim();

  if (trimmed.length === 0) return { ok: false, error: "Enter a name." };
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: "That name is too long." };
  }
  if (!isValidPin(pin)) {
    return { ok: false, error: "The PIN must be four digits." };
  }

  const { found } = await findAccount(trimmed);
  if (found) return { ok: false, error: "That name is already taken." };

  const salt = newSalt();
  const [created] = await db
    .insert(profiles)
    .values({ name: trimmed, pinSalt: salt, pinHash: hashPin(pin, salt) })
    .returning({ id: profiles.id });

  // Every account starts at lesson 1 with its own settings row.
  await db
    .insert(settings)
    .values({ profileId: created.id })
    .onConflictDoNothing();

  await startSession(created.id);
  return { ok: true, error: null };
}

export async function signIn(name: string, pin: string): Promise<AuthResult> {
  const [row] = await db.select().from(profiles).where(byName(name));

  /*
    No attempt limit and no lockout, by choice. One message covers both
    a wrong name and a wrong PIN, so this does not confirm who exists.
  */
  /*
    pinHash and pinSalt are nullable now, because a Clerk account on the phone
    has no PIN. A profile without one simply cannot sign in through this route,
    and it must fall into the same single failure message as a wrong PIN rather
    than a distinguishable error, or the route would confirm which accounts are
    Clerk backed.
  */
  if (
    !row ||
    row.pinHash === null ||
    row.pinSalt === null ||
    !isValidPin(pin) ||
    !pinMatches(pin, row.pinHash, row.pinSalt)
  ) {
    return { ok: false, error: "That name and PIN did not match." };
  }

  await startSession(row.id);
  return { ok: true, error: null };
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/*
  Settings, card states, and reviews all cascade from the profile, so
  this takes the account and its progress together.
*/
export async function deleteAccount(profileId: number) {
  await db.delete(profiles).where(eq(profiles.id, profileId));
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
