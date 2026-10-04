import {
  commissionStatusEnum,
  introductionStageEnum,
  jobStatusEnum,
  jobUrgencyEnum,
  passTrackEnum,
  sectorEnum,
  workerStatusEnum,
} from "@/db/schema";

export const SECTORS = sectorEnum.enumValues;
export const PASS_TRACKS = passTrackEnum.enumValues;
export const JOB_URGENCIES = jobUrgencyEnum.enumValues;
export const JOB_STATUSES = jobStatusEnum.enumValues;
export const INTRODUCTION_STAGES = introductionStageEnum.enumValues;
export const COMMISSION_STATUSES = commissionStatusEnum.enumValues;
export const WORKER_STATUSES = workerStatusEnum.enumValues;

export type Sector = (typeof SECTORS)[number];
export type PassTrack = (typeof PASS_TRACKS)[number];
export type IntroductionStage = (typeof INTRODUCTION_STAGES)[number];

/** Stages at which Pinnacle has shared the worker's identity with the employer. */
export const REVEALED_STAGES: readonly IntroductionStage[] = [
  "Introduced",
  "Interview",
  "Offer",
  "Placed",
];

/** Stages where an application is still in progress. */
export const OPEN_STAGES: readonly IntroductionStage[] = [
  "Requested",
  "Pinnacle Review",
  "Introduced",
  "Interview",
  "Offer",
];

export const CURRENCIES = ["SGD", "USD", "MYR"] as const;

export const COUNTRIES: ReadonlyArray<{ code: string; name: string }> = [
  { code: "BGD", name: "Bangladesh" },
  { code: "KHM", name: "Cambodia" },
  { code: "CHN", name: "China" },
  { code: "IND", name: "India" },
  { code: "IDN", name: "Indonesia" },
  { code: "MYS", name: "Malaysia" },
  { code: "MMR", name: "Myanmar" },
  { code: "NPL", name: "Nepal" },
  { code: "PAK", name: "Pakistan" },
  { code: "PHL", name: "Philippines" },
  { code: "LKA", name: "Sri Lanka" },
  { code: "THA", name: "Thailand" },
  { code: "VNM", name: "Vietnam" },
  { code: "OTH", name: "Other" },
];
