CREATE TYPE "public"."card_type" AS ENUM('vocab', 'phrase');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('m', 'f');--> statement-breakpoint
CREATE TYPE "public"."grade" AS ENUM('again', 'hard', 'good', 'easy');--> statement-breakpoint
CREATE TYPE "public"."review_direction" AS ENUM('recognition', 'production', 'speed');--> statement-breakpoint
CREATE TYPE "public"."state_direction" AS ENUM('recognition', 'production');--> statement-breakpoint
CREATE TABLE "card_states" (
	"card_id" integer NOT NULL,
	"direction" "state_direction" NOT NULL,
	"ease" real DEFAULT 2.5 NOT NULL,
	"interval_days" real DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	CONSTRAINT "card_states_card_id_direction_pk" PRIMARY KEY("card_id","direction")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"type" "card_type" DEFAULT 'vocab' NOT NULL,
	"arabic" text NOT NULL,
	"english" text NOT NULL,
	"transliteration" text,
	"gender" "gender",
	"plural" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"grammar_note" text,
	"unlocked_at" timestamp with time zone,
	CONSTRAINT "lessons_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fail_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" integer NOT NULL,
	"direction" "review_direction" NOT NULL,
	"grade" "grade" NOT NULL,
	"ms_to_answer" integer NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"current_lesson" integer DEFAULT 1 NOT NULL,
	"new_per_day" integer DEFAULT 12 NOT NULL,
	"max_reviews" integer DEFAULT 120 NOT NULL,
	"show_harakat" boolean DEFAULT true NOT NULL,
	"speed_window_ms" integer DEFAULT 2000 NOT NULL,
	"reminders_on" boolean DEFAULT false NOT NULL,
	"reminder_hour" integer DEFAULT 20 NOT NULL,
	"class_day_reminder" boolean DEFAULT true NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"last_notified_on" date,
	"current_lesson_since" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_states" ADD CONSTRAINT "card_states_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_states_due_idx" ON "card_states" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "cards_lesson_idx" ON "cards" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cards_lesson_arabic_idx" ON "cards" USING btree ("lesson_id","arabic");--> statement-breakpoint
CREATE INDEX "reviews_reviewed_at_idx" ON "reviews" USING btree ("reviewed_at");