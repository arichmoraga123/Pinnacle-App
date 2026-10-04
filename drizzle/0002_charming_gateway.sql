ALTER TYPE "public"."introduction_initiator" ADD VALUE 'pinnacle';--> statement-breakpoint
ALTER TYPE "public"."pass_track" ADD VALUE 'Singaporean / PR';--> statement-breakpoint
ALTER TYPE "public"."sector" ADD VALUE 'Beauty & Wellness';--> statement-breakpoint
ALTER TYPE "public"."sector" ADD VALUE 'Food & Beverage';--> statement-breakpoint
ALTER TYPE "public"."sector" ADD VALUE 'Retail';--> statement-breakpoint
ALTER TABLE "job_listings" ALTER COLUMN "salary_range_min" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listings" ALTER COLUMN "salary_range_max" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN "job_code" varchar(20);--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN "poster_key" text;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "resume_key" text;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "photo_key" text;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_job_code_unique" UNIQUE("job_code");