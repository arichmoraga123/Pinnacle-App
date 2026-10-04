ALTER TABLE "employers" ALTER COLUMN "clerk_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "introductions" ADD COLUMN "applicant_message" text;--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN "location" text DEFAULT 'Singapore' NOT NULL;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "summary" text;