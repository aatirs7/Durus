"use client";

import { useEffect, useState } from "react";
import { count } from "@/lib/outbox";

/*
  The only place connection state is shown anywhere in the app, and it
  only appears when there is actually something queued. A review is
  never interrupted to say the network dropped.
*/
export function OfflinePill() {
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    async function check() {
      setQueued(await count());
    }

    void check();
    window.addEventListener("online", check);
    window.addEventListener("offline", check);
    return () => {
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
    };
  }, []);

  if (queued === 0) return null;

  return (
    <p className="border-rule text-ink-soft mx-auto rounded-[999px] border px-4 py-2 text-[13px]">
      Offline, {queued} {queued === 1 ? "grade" : "grades"} queued
    </p>
  );
}
