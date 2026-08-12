import { relations } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const sectorEnum = pgEnum("sector", [
  "Construction",
  "Hospitality",
  "Logistics",
  "Facilities",
  "Trades",
  "Healthcare",
]);

export const passTrackEnum = pgEnum("pass_track", [
  "EP Ready",
  "S Pass Eligible",
  "Work Permit",
  "In Verification",
]);

export const workerStatusEnum = pgEnum("worker_status", [
  "Available",
  "Introduction Requested",
  "Placed",
  "Inactive",
]);

export const jobUrgencyEnum = pgEnum("job_urgency", [
  "Open",
  "Urgent",
  "Filled",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "Active",
  "Paused",
  "Closed",
]);

export const introductionInitiatorEnum = pgEnum("introduction_initiator", [
  "employer",
  "worker",
]);

export const introductionStageEnum = pgEnum("introduction_stage", [
  "Requested",
  "Pinnacle Review",
  "Introduced",
  "Interview",
  "Offer",
  "Placed",
  "Declined",
]);

export const commissionStatusEnum = pgEnum("commission_status", [
  "Not Applicable",
  "Pending",
  "Invoiced",
  "Paid",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "Passport",
  "Work Permit Application",
  "EP Application",
  "Medical Check",
  "Offer Letter",
  "Other",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "Not Started",
  "Submitted",
  "Under Review",
  "Approved",
  "Rejected",
]);

export const adminRoleEnum = pgEnum("admin_role", [
  "Pinnacle Staff",
  "Pinnacle Owner",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const workers = pgTable(
  "workers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    initials: varchar("initials", { length: 8 }).notNull(),
    roleTitle: text("role_title").notNull(),
    sector: sectorEnum("sector").notNull(),
    originCountry: text("origin_country").notNull(),
    originCountryCode: varchar("origin_country_code", { length: 3 }).notNull(),
    yearsExperience: integer("years_experience").notNull(),
    passTrack: passTrackEnum("pass_track").notNull(),
    status: workerStatusEnum("status").default("Available").notNull(),
    clerkUserId: text("clerk_user_id").unique(),
    ...timestamps,
  },
  (table) => [
    index("workers_sector_idx").on(table.sector),
    index("workers_status_idx").on(table.status),
  ],
);

export const employers = pgTable("employers", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  ...timestamps,
});

export const jobListings = pgTable(
  "job_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => employers.id, { onDelete: "cascade" }),
    roleTitle: text("role_title").notNull(),
    sector: sectorEnum("sector").notNull(),
    passTrackRequired: passTrackEnum("pass_track_required").notNull(),
    salaryRangeMin: integer("salary_range_min").notNull(),
    salaryRangeMax: integer("salary_range_max").notNull(),
    currency: varchar("currency", { length: 3 }).default("SGD").notNull(),
    headcount: integer("headcount").default(1).notNull(),
    urgency: jobUrgencyEnum("urgency").default("Open").notNull(),
    status: jobStatusEnum("status").default("Active").notNull(),
    ...timestamps,
  },
  (table) => [
    index("job_listings_employer_id_idx").on(table.employerId),
    index("job_listings_sector_status_idx").on(table.sector, table.status),
  ],
);

export const introductions = pgTable(
  "introductions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    jobListingId: uuid("job_listing_id")
      .notNull()
      .references(() => jobListings.id, { onDelete: "cascade" }),
    initiatedBy: introductionInitiatorEnum("initiated_by").notNull(),
    stage: introductionStageEnum("stage").default("Requested").notNull(),
    commissionAmount: numeric("commission_amount", {
      precision: 12,
      scale: 2,
    }),
    commissionStatus: commissionStatusEnum("commission_status")
      .default("Not Applicable")
      .notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("introductions_worker_job_unique").on(
      table.workerId,
      table.jobListingId,
    ),
    index("introductions_worker_id_idx").on(table.workerId),
    index("introductions_job_listing_id_idx").on(table.jobListingId),
    index("introductions_stage_idx").on(table.stage),
  ],
);

export const passDocuments = pgTable(
  "pass_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    documentType: documentTypeEnum("document_type").notNull(),
    status: documentStatusEnum("status").default("Not Started").notNull(),
    fileUrl: text("file_url"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("pass_documents_worker_id_idx").on(table.workerId),
    uniqueIndex("pass_documents_worker_type_unique").on(
      table.workerId,
      table.documentType,
    ),
  ],
);

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name").notNull(),
  role: adminRoleEnum("role").notNull(),
});

export const workersRelations = relations(workers, ({ many }) => ({
  introductions: many(introductions),
  passDocuments: many(passDocuments),
}));

export const employersRelations = relations(employers, ({ many }) => ({
  jobListings: many(jobListings),
}));

export const jobListingsRelations = relations(
  jobListings,
  ({ one, many }) => ({
    employer: one(employers, {
      fields: [jobListings.employerId],
      references: [employers.id],
    }),
    introductions: many(introductions),
  }),
);

export const introductionsRelations = relations(
  introductions,
  ({ one }) => ({
    worker: one(workers, {
      fields: [introductions.workerId],
      references: [workers.id],
    }),
    jobListing: one(jobListings, {
      fields: [introductions.jobListingId],
      references: [jobListings.id],
    }),
  }),
);

export const passDocumentsRelations = relations(
  passDocuments,
  ({ one }) => ({
    worker: one(workers, {
      fields: [passDocuments.workerId],
      references: [workers.id],
    }),
  }),
);

export type Worker = typeof workers.$inferSelect;
export type NewWorker = typeof workers.$inferInsert;
export type Employer = typeof employers.$inferSelect;
export type NewEmployer = typeof employers.$inferInsert;
export type JobListing = typeof jobListings.$inferSelect;
export type NewJobListing = typeof jobListings.$inferInsert;
export type Introduction = typeof introductions.$inferSelect;
export type NewIntroduction = typeof introductions.$inferInsert;
export type PassDocument = typeof passDocuments.$inferSelect;
export type NewPassDocument = typeof passDocuments.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
