"use client";

import { useState, useTransition } from "react";
import { setSuspended } from "./actions";

export function SuspendButton({
  cardId,
  suspended,
}: {
  cardId: number;
  suspended: boolean;
}) {
  const [on, setOn] = useState(suspended);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setSuspended(cardId, !on);
          setOn(res.suspended);
        })
      }
      className="border-rule text-ink-soft shrink-0 rounded-[999px] border px-3 py-1 text-[13px]"
    >
      {on ? "Resume" : "Suspend"}
    </button>
  );
}
