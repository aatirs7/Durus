CREATE TABLE "card_hearts" (
	"profile_id" integer NOT NULL,
	"card_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_hearts_profile_id_card_id_pk" PRIMARY KEY("profile_id","card_id")
);
--> statement-breakpoint
ALTER TABLE "card_hearts" ADD CONSTRAINT "card_hearts_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_hearts" ADD CONSTRAINT "card_hearts_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_hearts_profile_idx" ON "card_hearts" USING btree ("profile_id");