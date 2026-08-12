CREATE TYPE "public"."admin_role" AS ENUM('Pinnacle Staff', 'Pinnacle Owner');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('Not Applicable', 'Pending', 'Invoiced', 'Paid');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('Not Started', 'Submitted', 'Under Review', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('Passport', 'Work Permit Application', 'EP Application', 'Medical Check', 'Offer Letter', 'Other');--> statement-breakpoint
CREATE TYPE "public"."introduction_initiator" AS ENUM('employer', 'worker');--> statement-breakpoint
CREATE TYPE "public"."introduction_stage" AS ENUM('Requested', 'Pinnacle Review', 'Introduced', 'Interview', 'Offer', 'Placed', 'Declined');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('Active', 'Paused', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."job_urgency" AS ENUM('Open', 'Urgent', 'Filled');--> statement-breakpoint
CREATE TYPE "public"."pass_track" AS ENUM('EP Ready', 'S Pass Eligible', 'Work Permit', 'In Verification');--> statement-breakpoint
CREATE TYPE "public"."sector" AS ENUM('Construction', 'Hospitality', 'Logistics', 'Facilities', 'Trades', 'Healthcare');--> statement-breakpoint
CREATE TYPE "public"."worker_status" AS ENUM('Available', 'Introduction Requested', 'Placed', 'Inactive');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" text NOT NULL,
	"role" "admin_role" NOT NULL,
	CONSTRAINT "admins_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "employers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"industry" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"clerk_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employers_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "introductions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"job_listing_id" uuid NOT NULL,
	"initiated_by" "introduction_initiator" NOT NULL,
	"stage" "introduction_stage" DEFAULT 'Requested' NOT NULL,
	"commission_amount" numeric(12, 2),
	"commission_status" "commission_status" DEFAULT 'Not Applicable' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"role_title" text NOT NULL,
	"sector" "sector" NOT NULL,
	"pass_track_required" "pass_track" NOT NULL,
	"salary_range_min" integer NOT NULL,
	"salary_range_max" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'SGD' NOT NULL,
	"headcount" integer DEFAULT 1 NOT NULL,
	"urgency" "job_urgency" DEFAULT 'Open' NOT NULL,
	"status" "job_status" DEFAULT 'Active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pass_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"status" "document_status" DEFAULT 'Not Started' NOT NULL,
	"file_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"initials" varchar(8) NOT NULL,
	"role_title" text NOT NULL,
	"sector" "sector" NOT NULL,
	"origin_country" text NOT NULL,
	"origin_country_code" varchar(3) NOT NULL,
	"years_experience" integer NOT NULL,
	"pass_track" "pass_track" NOT NULL,
	"status" "worker_status" DEFAULT 'Available' NOT NULL,
	"clerk_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workers_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "introductions" ADD CONSTRAINT "introductions_job_listing_id_job_listings_id_fk" FOREIGN KEY ("job_listing_id") REFERENCES "public"."job_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pass_documents" ADD CONSTRAINT "pass_documents_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "introductions_worker_job_unique" ON "introductions" USING btree ("worker_id","job_listing_id");--> statement-breakpoint
CREATE INDEX "introductions_worker_id_idx" ON "introductions" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "introductions_job_listing_id_idx" ON "introductions" USING btree ("job_listing_id");--> statement-breakpoint
CREATE INDEX "introductions_stage_idx" ON "introductions" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "job_listings_employer_id_idx" ON "job_listings" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "job_listings_sector_status_idx" ON "job_listings" USING btree ("sector","status");--> statement-breakpoint
CREATE INDEX "pass_documents_worker_id_idx" ON "pass_documents" USING btree ("worker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pass_documents_worker_type_unique" ON "pass_documents" USING btree ("worker_id","document_type");--> statement-breakpoint
CREATE INDEX "workers_sector_idx" ON "workers" USING btree ("sector");--> statement-breakpoint
CREATE INDEX "workers_status_idx" ON "workers" USING btree ("status");