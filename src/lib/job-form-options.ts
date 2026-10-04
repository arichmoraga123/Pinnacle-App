import type { JobFormOptions } from "@/components/job-form";
import {
  CURRENCIES,
  JOB_STATUSES,
  JOB_PASS_TRACKS,
  JOB_URGENCIES,
  SECTORS,
} from "@/lib/options";

export const JOB_FORM_OPTIONS: JobFormOptions = {
  sectors: SECTORS,
  passTracks: JOB_PASS_TRACKS,
  urgencies: JOB_URGENCIES,
  statuses: JOB_STATUSES,
  currencies: CURRENCIES,
};
