"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cardStates } from "@/db/schema";
import { requireProfileId } from "@/lib/session";

export async function setSuspended(cardId: number, suspended: boolean) {
  await db
    .update(cardStates)
    .set({ suspended })
    .where(
      and(
        eq(cardStates.profileId, await requireProfileId()),
        eq(cardStates.cardId, cardId),
        eq(cardStates.direction, "recognition"),
      ),
    );
  revalidatePath("/stats");
  return { suspended };
}
