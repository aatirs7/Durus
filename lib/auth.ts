/*
  The smallest thing that actually locks a single user app.

  Nothing outside proxy.ts and /unlock knows auth exists, so this can be
  swapped for a real identity provider later without touching a screen.
*/

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "durus_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const PAYLOAD = "durus";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

/* value.signature, where value carries the issue date so a token can be
   invalidated later by rotating AUTH_SECRET. */
export function createSessionToken(now = new Date()): string {
  const value = `${PAYLOAD}.${now.toISOString().slice(0, 10)}`;
  return `${value}.${sign(value)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 1) return false;

  const value = token.slice(0, lastDot);
  const provided = token.slice(lastDot + 1);
  if (!value.startsWith(`${PAYLOAD}.`)) return false;

  return constantTimeEqual(provided, sign(value));
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD is not set");
  // Hash both sides first so the comparison is fixed length and the
  // length of the real password does not leak.
  return constantTimeEqual(sign(input), sign(expected));
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
