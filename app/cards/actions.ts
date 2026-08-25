"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cardHearts } from "@/db/schema";
import { requireProfileId } from "@/lib/session";

/*
  A heart is a row or no row, so the toggle is an insert or a delete and
  there is no state to fall out of step. The client already knows which
  way it is going, so it says, rather than the server reading first and
  writing second on a second round trip.
*/
export async function setHeart(cardId: number, hearted: boolean) {
  const profileId = await requireProfileId();

  if (hearted) {
    await db
      .insert(cardHearts)
      .values({ profileId, cardId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(cardHearts)
      .where(
        and(eq(cardHearts.profileId, profileId), eq(cardHearts.cardId, cardId)),
      );
  }

  return { ok: true };
}
