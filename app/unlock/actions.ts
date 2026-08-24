"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  passwordMatches,
} from "@/lib/auth";

export type UnlockState = { error: string | null };

export async function unlock(
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const password = String(formData.get("password") ?? "");

  if (!passwordMatches(password)) {
    return { error: "That password did not match." };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/");
}
