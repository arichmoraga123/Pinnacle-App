CREATE TABLE "admin_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"added_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN "pass_tracks_accepted" "pass_track"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
UPDATE "job_listings" SET "pass_tracks_accepted" = ARRAY["pass_track_required"];--> statement-breakpoint
INSERT INTO "admin_emails" ("email", "added_by") VALUES ('a.rich.moraga@gmail.com', 'initial setup') ON CONFLICT DO NOTHING;
