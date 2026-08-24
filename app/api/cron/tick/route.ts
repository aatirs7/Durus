import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { cardStates, lessons, reviews, settings } from "@/db/schema";
import { sendToAll } from "@/lib/push";

export const dynamic = "force-dynamic";

/*
  The one cron for the whole project. Hourly, and it gates itself, which
  is how both the due count and the notifications get served without a
  second schedule.

  A duplicate invocation is a no-op because of the lastNotifiedOn check.
*/
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const [config] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!config) {
    return NextResponse.json({ error: "settings row is missing" }, { status: 500 });
  }

  // 1. The due count. Cheap, runs every tick.
  const [{ dueCount }] = await db
    .select({ dueCount: sql<number>`count(*)::int` })
    .from(cardStates)
    .where(
      and(sql`${cardStates.dueAt} <= now()`, eq(cardStates.suspended, false)),
    );

  // 2. Gate the notification.
  const local = localParts(now, config.timezone);
  const isWednesday = local.weekday === 3;
  const classNudge = isWednesday && config.classDayReminder;

  const reasons: string[] = [];
  if (!config.remindersOn) reasons.push("reminders are off");
  if (local.hour !== config.reminderHour) reasons.push("not the reminder hour");
  if (config.lastNotifiedOn === local.date) reasons.push("already sent today");

  // If a session was already done recently, do not tap the shoulder.
  const fourHoursAgo = new Date(now.getTime() - 4 * 3_600_000);
  const [{ recent }] = await db
    .select({ recent: sql<number>`count(*)::int` })
    .from(reviews)
    .where(gte(reviews.reviewedAt, fourHoursAgo));
  if (recent > 0) reasons.push("a session was completed in the last 4 hours");

  // The class nudge sends regardless of due count. The review reminder
  // does not send when there is nothing due, and that silence is the
  // reward.
  if (dueCount === 0 && !classNudge) reasons.push("nothing is due");

  if (reasons.length > 0) {
    return NextResponse.json({ dueCount, sent: false, reasons });
  }

  const notification = classNudge
    ? {
        title: "Durus",
        // Wednesday is when class moves, so the nudge points at the
        // lesson that is about to be taught.
        body: `Add today's words from Lesson ${await nextLessonNumber(config.currentLesson)}`,
        url: `/add?lesson=${config.currentLesson + 1}`,
      }
    : {
        title: "Durus",
        body: `${dueCount} ${dueCount === 1 ? "card" : "cards"} due`,
        url: "/review",
      };

  const result = await sendToAll(notification);

  // Stamped in the user's timezone, not UTC. Getting this wrong is how
  // you end up with two notifications on the day the clocks change.
  await db
    .update(settings)
    .set({ lastNotifiedOn: local.date })
    .where(eq(settings.id, 1));

  return NextResponse.json({ dueCount, sent: true, notification, delivery: result });
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
