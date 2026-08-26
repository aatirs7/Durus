CREATE TYPE "public"."deck" AS ENUM('book', 'numbers');--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "deck" "deck" DEFAULT 'book' NOT NULL;