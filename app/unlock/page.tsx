import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { LockScreen } from "./lock-screen";
import { SetupScreen } from "./setup-screen";

export const dynamic = "force-dynamic";

export default async function UnlockPage() {
  // Already signed in, nothing to unlock.
  const jar = await cookies();
  if (verifySessionToken(jar.get(SESSION_COOKIE)?.value)) redirect("/");

  const [row] = await db.select().from(profile).where(eq(profile.id, 1));

  return row ? <LockScreen name={row.name} /> : <SetupScreen />;
}
