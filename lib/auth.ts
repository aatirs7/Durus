import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/*
  A four digit PIN over a single profile.

  Be clear about what this is: 10,000 possibilities is not much, so the
  throttle is what actually protects the account, not the PIN length.
  The hash is scrypt with a per profile salt, so the stored value is
  useless on its own even if the database leaks.
*/

export const SESSION_COOKIE = "durus_session";

/* An installed app should stay signed in. A year is the practical max
   for a cookie anyway. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const PIN_LENGTH = 4;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

export function hashPin(pin: string, salt: string): string {
  return scryptSync(pin, salt, 32).toString("hex");
}

export function newSalt(): string {
  return randomBytes(16).toString("hex");
}

export function pinMatches(
  pin: string,
  storedHash: string,
  salt: string,
): boolean {
  const candidate = Buffer.from(hashPin(pin, salt), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

/*
  The session cookie is value.signature, where the value carries the
  issue date so every token can be invalidated at once by rotating
  AUTH_SECRET.
*/
const PAYLOAD = "durus";

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionToken(now = new Date()): string {
  const value = `${PAYLOAD}.${now.toISOString().slice(0, 10)}`;
  return `${value}.${sign(value)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  /*
    Never throw from here. This runs in proxy.ts on every request, and a
    throw there takes down the whole site rather than just refusing the
    session. A missing secret means nobody is signed in, which lands on
    the lock screen instead of a redirect loop.
  */
  if (!process.env.AUTH_SECRET) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 1) return false;

  const value = token.slice(0, lastDot);
  const provided = token.slice(lastDot + 1);
  if (!value.startsWith(`${PAYLOAD}.`)) return false;

  const expected = sign(value);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
