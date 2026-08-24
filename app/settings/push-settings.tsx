"use client";

import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/ui";
import type { Settings } from "@/db/schema";
import { Toggle } from "./settings-form";

/*
  iOS constraints shape this whole section, so it is built to them
  rather than discovering them later:

  1. Web push only works once the app is on the home screen. In a Safari
     tab there is no point showing a toggle at all.
  2. Permission can only be requested from a real user gesture, so the
     request fires from the switch and nowhere else.
  3. Needs iOS 16.4 or later, so the section is feature detected away.
  4. Once denied, iOS never asks again. Say so plainly, do not re-prompt.
*/

type Support = "checking" | "unsupported" | "needs-install" | "ready";

export function PushSettings({
  remindersOn,
  reminderHour,
  classDayReminder,
  vapidPublicKey,
  onPatch,
}: {
  remindersOn: boolean;
  reminderHour: number;
  classDayReminder: boolean;
  vapidPublicKey: string | null;
  onPatch: (patch: Partial<Settings>) => void;
}) {
  const [support, setSupport] = useState<Support>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("PushManager" in window)) {
      setSupport("unsupported");
      return;
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    setPermission(Notification.permission);
    setSupport(standalone ? "ready" : "needs-install");
  }, []);

  if (support === "checking") return null;

  if (support === "unsupported") {
    return (
      <Section>
        <p className="text-ink-soft text-[15px]">
          This browser does not support web push.
        </p>
      </Section>
    );
  }

  if (support === "needs-install") {
    return (
      <Section>
        <p className="text-ink-soft text-[15px]">
          Reminders need the app on your home screen. Add it, open it from
          there, and this will turn on.
        </p>
      </Section>
    );
  }

  if (permission === "denied") {
    return (
      <Section>
        <p className="text-ink-soft text-[15px]">
          Notifications are blocked. iOS will not ask again, so turn them
          back on in Settings, Notifications, Durus.
        </p>
      </Section>
    );
  }

  return (
    <Section>
      <div className="flex flex-col items-center gap-3">
        <Eyebrow>Daily reminder</Eyebrow>
        <Toggle
          on={remindersOn}
          onChange={async (on) => {
            if (busy) return;
            setBusy(true);
            try {
              if (on) {
                // The permission request fires from this gesture only.
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result !== "granted") return;
                if (!vapidPublicKey) return;
                await subscribe(vapidPublicKey);
                onPatch({ remindersOn: true });
              } else {
                await unsubscribe();
                onPatch({ remindersOn: false });
              }
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>

      {remindersOn ? (
        <>
          <div className="flex flex-col items-center gap-3">
            <Eyebrow>Reminder hour</Eyebrow>
            <div className="border-rule bg-surface flex items-center gap-1 rounded-[999px] border px-2 py-1">
              <button
                type="button"
                aria-label="Earlier"
                onClick={() =>
                  onPatch({ reminderHour: (reminderHour + 23) % 24 })
                }
                className="text-ink-soft px-4 py-1 text-[18px]"
              >
                -
              </button>
              <span className="tabular text-ink w-16 text-[18px]">
                {String(reminderHour).padStart(2, "0")}:00
              </span>
              <button
                type="button"
                aria-label="Later"
                onClick={() => onPatch({ reminderHour: (reminderHour + 1) % 24 })}
                className="text-ink-soft px-4 py-1 text-[18px]"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Eyebrow>Wednesday class nudge</Eyebrow>
            <Toggle
              on={classDayReminder}
              onChange={(classDayReminder) => onPatch({ classDayReminder })}
            />
          </div>
        </>
      ) : null}
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-6">{children}</div>;
}

async function subscribe(vapidPublicKey: string) {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const sub =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const json = sub.toJSON();
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent,
    }),
  });
}

async function unsubscribe() {
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
}

/* VAPID keys arrive base64url encoded and the API wants bytes. */
function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out.buffer;
}
