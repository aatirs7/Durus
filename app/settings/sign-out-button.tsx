"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui";
import { signOut } from "@/app/unlock/actions";

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="quiet"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOut();
          router.replace("/unlock");
          router.refresh();
        })
      }
    >
      Sign out
    </Button>
  );
}
