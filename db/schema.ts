import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const cardTypeEnum = pgEnum("card_type", ["vocab", "phrase"]);
export const genderEnum = pgEnum("gender", ["m", "f"]);

/* cardStates has two directions. reviews has three, because speed runs
   are logged but never scheduled. Two separate enums on purpose. */
export const stateDirectionEnum = pgEnum("state_direction", [
  "recognition",
  "production",
]);
export const reviewDirectionEnum = pgEnum("review_direction", [
  "recognition",
  "production",
  "speed",
]);
export const gradeEnum = pgEnum("grade", ["again", "hard", "good", "easy"]);

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  grammarNote: text("grammar_note"),
  // Null means the lesson has not been covered in class yet.
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
});

export const cards = pgTable(
  "cards",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    type: cardTypeEnum("type").notNull().default("vocab"),
    arabic: text("arabic").notNull(),
    english: text("english").notNull(),
    transliteration: text("transliteration"),
    gender: genderEnum("gender"),
    plural: text("plural"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("cards_lesson_idx").on(t.lessonId),
    // Pasting the same block twice should not double the deck.
    uniqueIndex("cards_lesson_arabic_idx").on(t.lessonId, t.arabic),
  ],
);

/*
  Keyed on card and direction, because recognising a word and producing it
  from the English are two different skills that mature at different rates.
  Recognition is seeded active. Production is created lazily, only once
  recognition for that card reaches repetitions >= 2.
*/
export const cardStates = pgTable(
  "card_states",
  {
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    cardId: integer("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    direction: stateDirectionEnum("direction").notNull(),
    ease: real("ease").notNull().default(2.5),
    intervalDays: real("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    lapses: integer("lapses").notNull().default(0),
    suspended: boolean("suspended").notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.cardId, t.direction] }),
    index("card_states_due_idx").on(t.profileId, t.dueAt),
  ],
);

/* Append only. Undo is the one documented exception. */
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    cardId: integer("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    direction: reviewDirectionEnum("direction").notNull(),
    grade: gradeEnum("grade").notNull(),
    msToAnswer: integer("ms_to_answer").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reviews_reviewed_at_idx").on(t.profileId, t.reviewedAt)],
);

/*
  One row per profile. Everything here is a personal preference or a
  personal position in the book, so it cannot be shared between
  accounts.
*/
export const settings = pgTable("settings", {
  profileId: integer("profile_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  currentLesson: integer("current_lesson").notNull().default(1),
  newPerDay: integer("new_per_day").notNull().default(12),
  maxReviews: integer("max_reviews").notNull().default(120),
  showHarakat: boolean("show_harakat").notNull().default(true),
  speedWindowMs: integer("speed_window_ms").notNull().default(2000),
  remindersOn: boolean("reminders_on").notNull().default(false),
  reminderHour: integer("reminder_hour").notNull().default(20),
  classDayReminder: boolean("class_day_reminder").notNull().default(true),
  timezone: text("timezone").notNull().default("America/New_York"),
  lastNotifiedOn: date("last_notified_on"),
  // Set when currentLesson last changed. The SRS interval cap on the
  // current lesson expires 14 days after this.
  currentLessonSince: timestamp("current_lesson_since", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/*
  An account. Several people can use one install, each with their own
  name and PIN. The PIN is stored as a salted scrypt hash, never in the
  clear.

  There is deliberately no attempt limit. 10,000 possibilities with
  unlimited tries is not a barrier to anything automated, so treat the
  PIN as a "not my phone" speed bump rather than as security.

  Names are compared case insensitively on sign in, so "Aatir" and
  "aatir" are the same account rather than two.
*/
export const profiles = pgTable(
  // The SQL table keeps its original singular name so this is a column
  // change rather than a rename, which drizzle-kit cannot resolve
  // without an interactive prompt.
  "profile",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    pinHash: text("pin_hash").notNull(),
    pinSalt: text("pin_salt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("profile_name_idx").on(sql`lower(${t.name})`)],
);

/* Not used until push lands, but in the schema now so there is no
   second migration later. */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  failCount: integer("fail_count").notNull().default(0),
});

export type Lesson = typeof lessons.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type CardState = typeof cardStates.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
