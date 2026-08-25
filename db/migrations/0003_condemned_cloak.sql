CREATE TABLE "card_suspensions" (
	"profile_id" integer NOT NULL,
	"card_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"device_id" text,
	"seq" bigint,
	CONSTRAINT "card_suspensions_profile_id_card_id_pk" PRIMARY KEY("profile_id","card_id")
);
--> statement-breakpoint
DROP INDEX "profile_name_idx";--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "pin_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "pin_salt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "card_hearts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "card_hearts" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "card_hearts" ADD COLUMN "device_id" text;--> statement-breakpoint
ALTER TABLE "card_hearts" ADD COLUMN "seq" bigint;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "clerk_user_id" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "sync_seq" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "practice" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "capped" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "fuzz" real;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "retracted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "device_id" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "seq" bigint;--> statement-breakpoint
ALTER TABLE "card_suspensions" ADD CONSTRAINT "card_suspensions_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_suspensions" ADD CONSTRAINT "card_suspensions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_suspensions_profile_idx" ON "card_suspensions" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_clerk_user_idx" ON "profile" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_client_id_idx" ON "reviews" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "reviews_fold_idx" ON "reviews" USING btree ("profile_id","card_id","direction","reviewed_at");--> statement-breakpoint
CREATE INDEX "reviews_seq_idx" ON "reviews" USING btree ("profile_id","seq");