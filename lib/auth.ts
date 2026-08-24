import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/*
  Accounts are a name and a four digit PIN.

  There is deliberately no attempt limit. 10,000 possibilities with
  unlimited tries is not a barrier to anything automated, so treat the
  PIN as a "not my phone" speed bump rather than as security.

  The hash is scrypt with a per account salt, so the stored value is
  useless on its own even if the database leaks.
*/

export const SESSION_COOKIE = "durus_session";

/* An installed app should stay signed in. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const PIN_LENGTH = 4;
export const MAX_NAME_LENGTH = 40;

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

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

/*
  The session is profileId.issuedOn.signature. The profile id sits
  inside the signed value rather than in a second cookie, so it cannot
  be edited to read somebody else's deck.
*/
export function createSessionToken(
  profileId: number,
  now = new Date(),
): string {
  const value = `${profileId}.${now.toISOString().slice(0, 10)}`;
  return `${value}.${sign(value)}`;
}

/* The profile id, or null when the token is missing or forged. */
export function readSessionToken(token: string | undefined): number | null {
  if (!token) return null;
  /*
    Never throw from here. This runs in proxy.ts on every request, and a
    throw there takes the whole site down rather than just refusing the
    session. A missing secret means nobody is signed in, which lands on
    the lock screen instead of a redirect loop.
  */
  if (!process.env.AUTH_SECRET) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot < 1) return null;

  const value = token.slice(0, lastDot);
  const provided = token.slice(lastDot + 1);
  const expected = sign(value);

  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return null;
  }

  const id = Number(value.slice(0, value.indexOf(".")));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/* Kept for proxy.ts, which only needs to know whether to let it past. */
export function verifySessionToken(token: string | undefined): boolean {
  return readSessionToken(token) !== null;
}
