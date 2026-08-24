"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { unlockNextLesson, type NextLesson } from "@/app/unlock-lesson";

/*
  The Wednesday action. Class moves, the next lesson is already seeded
  and waiting, and this is the one tap that opens it.
*/
export function UnlockNext({ next }: { next: NextLesson }) {
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (!next || done) {
    return message ? (
      <p className="text-ink-soft text-[15px]">{message}</p>
    ) : null;
  }

  return (
    <Button
      variant="quiet"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await unlockNextLesson();
          setMessage(res.message);
          if (res.ok) setDone(true);
        })
      }
    >
      {pending ? "Opening" : `Add Lesson ${next.number}`}
    </Button>
  );
}
