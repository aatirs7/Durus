import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { cardStates, lessons, profiles, reviews, settings } from "@/db/schema";
import { sendToProfile } from "@/lib/push";
import { decideReminder } from "@/lib/reminders";

export const dynamic = "force-dynamic";

/*
  The one cron for the whole project. Hourly, and it gates itself, which
  is how both the due count and the notifications get served without a
  second schedule.

  A duplicate invocation is a no-op, because a slot is only served
  once: the last served date and hour are both recorded.
*/
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  /*
    Every account is gated independently. One tick walks them all, which
    keeps this the only cron in the project no matter how many people
    use the install.
  */
  const rows = await db
    .select({ profileId: settings.profileId, config: settings })
    .from(settings)
    .innerJoin(profiles, eq(profiles.id, settings.profileId));

  const results: unknown[] = [];

  for (const { profileId, config } of rows) {
    // 1. The due count. Cheap, runs every tick.
    const [{ dueCount }] = await db
      .select({ dueCount: sql<number>`count(*)::int` })
      .from(cardStates)
      .where(
        and(
          eq(cardStates.profileId, profileId),
          sql`${cardStates.dueAt} <= now()`,
          eq(cardStates.suspended, false),
        ),
      );

    // 2. Gate the notification. The rule lives in lib/reminders.ts and
    //    is unit tested there, because a wrong gate fails silently.
    const local = localParts(now, config.timezone);

    const fourHoursAgo = new Date(now.getTime() - 4 * 3_600_000);
    const [{ recent }] = await db
      .select({ recent: sql<number>`count(*)::int` })
      .from(reviews)
      .where(
        and(
          eq(reviews.profileId, profileId),
          gte(reviews.reviewedAt, fourHoursAgo),
          /* An undone answer is not a session in progress. */
          isNull(reviews.retractedAt),
        ),
      );

    const { send, classNudge, reasons } = decideReminder(config, local, {
      dueCount,
      reviewsInLastFourHours: recent,
    });

    if (!send) {
      results.push({ profileId, dueCount, slot: local.hour, sent: false, reasons });
      continue;
    }

    const notification = classNudge
      ? {
          title: "Durus",
          body: `Add today's words from Lesson ${await nextLessonNumber(config.currentLesson)}`,
          url: "/today",
        }
      : {
          title: "Durus",
          body: `${dueCount} ${dueCount === 1 ? "card" : "cards"} due`,
          url: "/review",
        };

    const delivery = await sendToProfile(profileId, notification);

    /*
      Stamped in the account's own timezone, not UTC. Getting this wrong
      is how you end up with a duplicate on the day the clocks change.
      The hour is recorded alongside the date so the morning send does
      not block the evening one.
    */
    await db
      .update(settings)
      .set({ lastNotifiedOn: local.date, lastNotifiedHour: local.hour })
      .where(eq(settings.profileId, profileId));

    results.push({
      profileId,
      dueCount,
      slot: local.hour,
      sent: true,
      notification,
      delivery,
    });
  }

  return NextResponse.json({ accounts: rows.length, results });
}

async function nextLessonNumber(current: number): Promise<number> {
  const [{ max }] = await db
    .select({ max: sql<number>`max(${lessons.number})::int` })
    .from(lessons);
  return Math.min(current + 1, max ?? current + 1);
}

/*
  Hour, ISO date, and weekday in the given timezone. Intl rather than a
  library, since this is the only place the app needs it.
*/
function localParts(now: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );

  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    // Some locales format midnight as 24.
    hour: Number(parts.hour) % 24,
    weekday: weekdays[parts.weekday] ?? -1,
  };
}
