"use client";

import { useClerk } from "@clerk/nextjs";
import { useTransition } from "react";
import { Button } from "@/components/ui";

/*
  Signing out is Clerk's now, on both sides.

  redirectUrl rather than a router push afterwards: Clerk clears the session
  and navigates in one step, and a client side navigation in between lands on
  a page that still thinks it has a session for exactly one render.
*/
export function SignOutButton() {
  const { signOut } = useClerk();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="quiet"
      disabled={pending}
      onClick={() => start(async () => { await signOut({ redirectUrl: "/" }); })}
    >
      Sign out
    </Button>
  );
}
