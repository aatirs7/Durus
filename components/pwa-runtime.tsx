"use client";

import { useEffect } from "react";
import { flushOutbox } from "@/app/review/flush";
import { all, remove } from "@/lib/outbox";

/*
  Registers the service worker, flushes any grades taken offline, and
  keeps the app badge in step with the due count.

  The badge carries most of the daily load. Reminders are the backstop.
*/
export function PwaRuntime({ dueCount }: { dueCount: number }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // A failed registration is not worth interrupting anyone over.
      });
    }
  }, []);

  useEffect(() => {
    async function flush() {
      try {
        const pending = await all();
        if (pending.length === 0) return;
        const flushed = await flushOutbox(pending);
        await remove(flushed);
      } catch {
        // Still offline. It will go out on the next online event.
      }
    }

    void flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    const nav = navigator as Navigator & {
      setAppBadge: (n?: number) => Promise<void>;
      clearAppBadge: () => Promise<void>;
    };

    if (dueCount > 0) {
      void nav.setAppBadge(dueCount).catch(() => {});
    } else {
      void nav.clearAppBadge().catch(() => {});
    }
  }, [dueCount]);

  return null;
}
