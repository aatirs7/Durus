"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { unlockNextLesson, type NextLesson } from "@/app/unlock-lesson";

/*
  The Wednesday action. Class moves, the next lesson is already seeded
  and waiting, and this is the one tap that opens it.

  When the next lesson has no words yet it says so instead, because a
  button that cannot do anything is worse than a sentence that explains
  why.
*/
export function UnlockNext({ next }: { next: NextLesson }) {
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (message) {
    return <p className="text-ink-soft text-[15px]">{message}</p>;
  }

  if (!next || done) return null;

  if (next.state === "finished") {
    return (
      <p className="text-ink-soft text-[15px]">
        That is the end of Book 1.
      </p>
    );
  }

  if (next.state === "coming-soon") {
    return (
      <p className="text-ink-faint text-[15px]">
        Lesson {next.number} coming soon
      </p>
    );
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
