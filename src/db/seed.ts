import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";

import {
  employers,
  jobListings,
  workers,
  type NewEmployer,
  type NewJobListing,
  type NewWorker,
} from "./schema";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Add it to your .env.local file.");
}

const db = drizzle(neon(databaseUrl));

const workerSeed = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    fullName: "Nguyen Minh Anh",
    initials: "NA",
    roleTitle: "Construction Supervisor",
    sector: "Construction",
    originCountry: "Vietnam",
    originCountryCode: "VNM",
    yearsExperience: 9,
    passTrack: "EP Ready",
    status: "Available",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    fullName: "Aisyah Rahman",
    initials: "AR",
    roleTitle: "Guest Services Manager",
    sector: "Hospitality",
    originCountry: "Malaysia",
    originCountryCode: "MYS",
    yearsExperience: 7,
    passTrack: "S Pass Eligible",
    status: "Available",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    fullName: "Budi Santoso",
    initials: "BS",
    roleTitle: "Warehouse Operations Coordinator",
    sector: "Logistics",
    originCountry: "Indonesia",
    originCountryCode: "IDN",
    yearsExperience: 6,
    passTrack: "S Pass Eligible",
    status: "Introduction Requested",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    fullName: "Maria Santos",
    initials: "MS",
    roleTitle: "Facilities Technician",
    sector: "Facilities",
    originCountry: "Philippines",
    originCountryCode: "PHL",
    yearsExperience: 8,
    passTrack: "Work Permit",
    status: "Available",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    fullName: "Zaw Min Tun",
    initials: "ZT",
    roleTitle: "Senior Welder",
    sector: "Trades",
    originCountry: "Myanmar",
    originCountryCode: "MMR",
    yearsExperience: 10,
    passTrack: "Work Permit",
    status: "Available",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    fullName: "Linh Tran",
    initials: "LT",
    roleTitle: "Registered Nurse",
    sector: "Healthcare",
    originCountry: "Vietnam",
    originCountryCode: "VNM",
    yearsExperience: 5,
    passTrack: "In Verification",
    status: "Available",
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    fullName: "Jose Dela Cruz",
    initials: "JC",
    roleTitle: "Heavy Vehicle Driver",
    sector: "Logistics",
    originCountry: "Philippines",
    originCountryCode: "PHL",
    yearsExperience: 9,
    passTrack: "Work Permit",
    status: "Available",
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    fullName: "Siti Nurhayati",
    initials: "SN",
    roleTitle: "Sous Chef",
    sector: "Hospitality",
    originCountry: "Indonesia",
    originCountryCode: "IDN",
    yearsExperience: 7,
    passTrack: "S Pass Eligible",
    status: "Available",
  },
] satisfies NewWorker[];

const employerSeed = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    companyName: "Straits Build Pte Ltd",
    industry: "Construction",
    contactName: "Daniel Lim",
    contactEmail: "daniel.lim@straitsbuild.example",
    clerkUserId: "seed_employer_straits_build",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    companyName: "Marina Bay Hospitality Group",
    industry: "Hospitality",
    contactName: "Cheryl Tan",
    contactEmail: "cheryl.tan@marinabayhospitality.example",
    clerkUserId: "seed_employer_marina_bay",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    companyName: "Orchard Logistics",
    industry: "Logistics",
    contactName: "Marcus Goh",
    contactEmail: "marcus.goh@orchardlogistics.example",
    clerkUserId: "seed_employer_orchard_logistics",
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    companyName: "Raffles Facilities Mgmt",
    industry: "Facilities Management",
    contactName: "Priya Nair",
    contactEmail: "priya.nair@rafflesfacilities.example",
    clerkUserId: "seed_employer_raffles_facilities",
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    companyName: "Jurong Industrial Services",
    industry: "Industrial Trades",
    contactName: "Kelvin Ong",
    contactEmail: "kelvin.ong@jurongindustrial.example",
    clerkUserId: "seed_employer_jurong_industrial",
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    companyName: "Tanjong Freight Co.",
    industry: "Freight and Logistics",
    contactName: "Rachel Lee",
    contactEmail: "rachel.lee@tanjongfreight.example",
    clerkUserId: "seed_employer_tanjong_freight",
  },
] satisfies NewEmployer[];

const jobListingSeed = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    employerId: "20000000-0000-4000-8000-000000000001",
    roleTitle: "Construction Supervisor",
    sector: "Construction",
    passTrackRequired: "EP Ready",
    salaryRangeMin: 4500,
    salaryRangeMax: 6000,
    headcount: 2,
    urgency: "Urgent",
    status: "Active",
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    employerId: "20000000-0000-4000-8000-000000000002",
    roleTitle: "Guest Services Manager",
    sector: "Hospitality",
    passTrackRequired: "S Pass Eligible",
    salaryRangeMin: 3200,
    salaryRangeMax: 4200,
    headcount: 3,
    urgency: "Open",
    status: "Active",
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    employerId: "20000000-0000-4000-8000-000000000003",
    roleTitle: "Warehouse Operations Coordinator",
    sector: "Logistics",
    passTrackRequired: "S Pass Eligible",
    salaryRangeMin: 3000,
    salaryRangeMax: 4000,
    headcount: 4,
    urgency: "Urgent",
    status: "Active",
  },
  {
    id: "30000000-0000-4000-8000-000000000004",
    employerId: "20000000-0000-4000-8000-000000000004",
    roleTitle: "Facilities Technician",
    sector: "Facilities",
    passTrackRequired: "Work Permit",
    salaryRangeMin: 2200,
    salaryRangeMax: 3000,
    headcount: 5,
    urgency: "Open",
    status: "Active",
  },
  {
    id: "30000000-0000-4000-8000-000000000005",
    employerId: "20000000-0000-4000-8000-000000000005",
    roleTitle: "Senior Welder",
    sector: "Trades",
    passTrackRequired: "Work Permit",
    salaryRangeMin: 2400,
    salaryRangeMax: 3400,
    headcount: 6,
    urgency: "Urgent",
    status: "Active",
  },
  {
    id: "30000000-0000-4000-8000-000000000006",
    employerId: "20000000-0000-4000-8000-000000000006",
    roleTitle: "Heavy Vehicle Driver",
    sector: "Logistics",
    passTrackRequired: "Work Permit",
    salaryRangeMin: 2400,
    salaryRangeMax: 3200,
    headcount: 4,
    urgency: "Open",
    status: "Active",
  },
] satisfies NewJobListing[];

async function seed() {
  await db.insert(workers).values(workerSeed).onConflictDoNothing();
  await db.insert(employers).values(employerSeed).onConflictDoNothing();
  await db.insert(jobListings).values(jobListingSeed).onConflictDoNothing();

  console.log(
    `Seed complete: ${workerSeed.length} workers, ${employerSeed.length} employers, ${jobListingSeed.length} job listings.`,
  );
}

seed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
