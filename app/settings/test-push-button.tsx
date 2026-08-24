"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { sendTestNotification } from "./test-push";

export function TestPushButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(true);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant="quiet"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await sendTestNotification();
            setOk(res.ok);
            setMessage(res.message);
          })
        }
      >
        {pending ? "Sending" : "Send a test notification"}
      </Button>

      {message ? (
        <p
          className="max-w-[300px] text-[14px]"
          style={{ color: ok ? "var(--ink-soft)" : "var(--clay)" }}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
