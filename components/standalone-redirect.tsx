"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/*
  The installed app never shows the landing page. Its start_url already
  points at /today, but a shortcut saved before this change, or a share
  sheet link, can still land here, and the phone should go straight into
  the app the way it always did.
*/
export function StandaloneRedirect({ to = "/today" }: { to?: string }) {
  const router = useRouter();

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari, which does not implement the media feature.
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) router.replace(to);
  }, [router, to]);

  return null;
}
