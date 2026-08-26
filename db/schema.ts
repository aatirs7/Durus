import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  integer,
  jsonb,
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

/*
  Which deck a lesson belongs to.

  The numbers trainer's stages are lessons: ordered, gated, taught once, and
  full of cards. Making them lesson rows means one scheduler, one fold and one
  sync path, and every query that joins through lesson_id keeps working
  unchanged.

  What they must not do is turn up in the book. This column is what keeps them
  out, and it is on LESSONS rather than on cards because a card's deck is
  simply its lesson's - denormalising it invites the two to disagree, and every
  query that needs the filter is already joining lessons to read its number.
*/
export const deckEnum = pgEnum("deck", ["book", "numbers"]);

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
  /* Defaults to book, so every existing row is a book lesson without a
     backfill and every existing query means what it meant before. */
  deck: deckEnum("deck").notNull().default("book"),
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
    /*
      card_states is a deterministic fold over this table, computed
      independently on each device and here. For that to converge, a review has
      to carry every input schedule() consumed. It carried three of five.

      capped is not a convenience: it depends on settings.currentLesson and
      currentLessonSince as they were at the moment of the review, and that
      history exists nowhere else. Recomputing it from present day settings
      would silently produce different intervals on a replay.

      fuzz is the sampled value applyFuzz consumed, null where it was the
      identity (interval <= 3 days, and every "again"). practice records that
      the answer came from the nothing-is-due fallback, where a correct answer
      must not move the schedule.
    */
    practice: boolean("practice").notNull().default(false),
    capped: boolean("capped").notNull().default(false),
    fuzz: real("fuzz"),
    /* Undo stopped being a delete. An append only log with a tombstone can be
       replayed; one with a hole in it cannot. */
    retractedAt: timestamp("retracted_at", { withTimezone: true }),
    /* Client minted, so a retry whose response was lost inserts once. Legacy
       rows predate it and stay null. */
    clientId: text("client_id"),
    deviceId: text("device_id"),
    /* Per profile gapless sequence, allocated under a row lock at ingest. Not a
       bigserial: sequence values are handed out before commit, so a client that
       sees 6 and stores cursor 6 would never see the row that took 5 and
       committed later. */
    seq: bigint("seq", { mode: "number" }),
  },
  (t) => [
    index("reviews_reviewed_at_idx").on(t.profileId, t.reviewedAt),
    uniqueIndex("reviews_client_id_idx").on(t.clientId),
    /* The fold's hot path: every review for one card and direction, in order. */
    index("reviews_fold_idx").on(t.profileId, t.cardId, t.direction, t.reviewedAt),
    index("reviews_seq_idx").on(t.profileId, t.seq),
  ],
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
  /*
    Two reminders a day, a morning one and an evening one. The second
    can be turned off on its own, because setting it to the same hour as
    the first would be a confusing way to say "only once".
  */
  reminderHour: integer("reminder_hour").notNull().default(9),
  secondReminderOn: boolean("second_reminder_on").notNull().default(true),
  reminderHour2: integer("reminder_hour_2").notNull().default(20),
  classDayReminder: boolean("class_day_reminder").notNull().default(true),
  timezone: text("timezone").notNull().default("America/New_York"),
  /*
    Which slot was last served. The date alone was enough while there
    was one reminder a day. With two, the hour has to be part of it, or
    the morning send would block the evening one.
  */
  lastNotifiedOn: date("last_notified_on"),
  lastNotifiedHour: integer("last_notified_hour"),
  // Set when currentLesson last changed. The SRS interval cap on the
  // current lesson expires 14 days after this.
  currentLessonSince: timestamp("current_lesson_since", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /*
    Last write wins bookkeeping for the mobile clients.

    Per FIELD rather than per row, and the reason is specific: the speed drill
    writes speedWindowMs automatically at the end of every run, so with whole
    row LWW a speed run on the phone would silently revert a currentLesson
    change made on the web. The user reads that as "the app forgot which lesson
    I'm on", which breaks the interval cap and is close to undiagnosable from a
    bug report.
  */
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  fieldUpdatedAt: jsonb("field_updated_at")
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
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
    /*
      Nullable now. The iOS client authenticates with Clerk and has no PIN; the
      web app keeps its PIN login for the accounts that already exist, so one
      table serves both and neither column can be required.
    */
    pinHash: text("pin_hash"),
    pinSalt: text("pin_salt"),
    /* Null on the rows that predate Clerk. Those stay reachable from the web
       app's unlock route and are invisible to the mobile API. */
    clerkUserId: text("clerk_user_id"),
    /* Per profile gapless sync sequence. See reviews.seq. */
    syncSeq: bigint("sync_seq", { mode: "number" }).notNull().default(0),
    /* Soft delete, set by the Clerk user.deleted webhook. The hard delete runs
       on a delay, because a deletion webhook that fires on a mis-click is
       otherwise unrecoverable. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  /*
    The unique index on lower(name) is gone. It existed because name plus PIN
    *was* the credential. Clerk owns sign in now, and two people legitimately
    called "Aatir" are two accounts; keeping it would reject the second one's
    provisioning with what looks like a server error. name is a display field.
  */
  (t) => [uniqueIndex("profile_clerk_user_idx").on(t.clerkUserId)],
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

/*
  Words you have marked as needing more work, one row per profile and
  card. A row exists or it does not, so the toggle is an insert or a
  delete and there is no state to keep in step.

  Separate from cardStates on purpose. That table is the scheduler's,
  keyed by direction and rewritten on every answer, and a hand made
  mark should not live somewhere an algorithm is editing.
*/
export const cardHearts = pgTable(
  "card_hearts",
  {
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    cardId: integer("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /* Same reconcile path as card_suspensions: last write wins per key, over
       {present, deleted}. */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deviceId: text("device_id"),
    seq: bigint("seq", { mode: "number" }),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.cardId] }),
    index("card_hearts_profile_idx").on(t.profileId),
  ],
);

/*
  Suspension, moved off card_states.

  card_states is a deterministic fold over reviews and nothing else. Suspension
  is a hand set mark that no algorithm derives, so leaving it there would make
  that table *mostly* derived, which is worse than either extreme: every rebuild
  would have to preserve one column across a delete and recreate, and eventually
  someone forgets. card_hearts already makes this argument in its own comment.

  Set semantics, like card_hearts: a row exists or it does not. deletedAt is the
  tombstone that lets an un-suspend propagate rather than being lost to a naive
  set union.
*/
export const cardSuspensions = pgTable(
  "card_suspensions",
  {
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    cardId: integer("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deviceId: text("device_id"),
    seq: bigint("seq", { mode: "number" }),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.cardId] }),
    index("card_suspensions_profile_idx").on(t.profileId),
  ],
);

export type Lesson = typeof lessons.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type CardState = typeof cardStates.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type CardSuspension = typeof cardSuspensions.$inferSelect;
