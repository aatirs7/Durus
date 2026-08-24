ALTER TABLE "settings" ALTER COLUMN "reminder_hour" SET DEFAULT 9;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "second_reminder_on" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "reminder_hour_2" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "last_notified_hour" integer;