"use server";

import type { OutboxGrade } from "@/lib/outbox";
import { submitGrade } from "./actions";

/*
  Replays grades taken offline and returns the keys that landed, so the
  caller can clear exactly those and leave the rest queued.
*/
export async function flushOutbox(items: OutboxGrade[]): Promise<string[]> {
  const flushed: string[] = [];

  for (const item of items) {
    try {
      await submitGrade({
        cardId: item.cardId,
        direction: item.direction,
        grade: item.grade,
        msToAnswer: item.msToAnswer,
      });
      flushed.push(item.key);
    } catch {
      // Leave it queued and try again on the next flush.
    }
  }

  return flushed;
}
