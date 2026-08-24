"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { profile } from "@/db/schema";
import {
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

async function startSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/* First run. Creates the one profile and signs straight in. */
export async function createProfile(
  name: string,
  pin: string,
): Promise<AuthResult> {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: "Enter a name." };
  }
  if (trimmed.length > 40) {
    return { ok: false, error: "That name is too long." };
  }
  if (!isValidPin(pin)) {
    return { ok: false, error: "The PIN must be four digits." };
  }

  const [existing] = await db.select().from(profile).where(eq(profile.id, 1));
  if (existing) {
    return { ok: false, error: "A profile already exists on this app." };
  }

  const salt = newSalt();
  await db.insert(profile).values({
    id: 1,
    name: trimmed,
    pinSalt: salt,
    pinHash: hashPin(pin, salt),
  });

  await startSession();
  return { ok: true, error: null };
}

export async function signIn(pin: string): Promise<AuthResult> {
  const [row] = await db.select().from(profile).where(eq(profile.id, 1));
  if (!row) return { ok: false, error: "No profile yet." };

  // No attempt limit and no lockout, by choice.
  if (!isValidPin(pin) || !pinMatches(pin, row.pinHash, row.pinSalt)) {
    return { ok: false, error: "That PIN did not match." };
  }

  await startSession();
  return { ok: true, error: null };
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
