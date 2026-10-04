/**
 * Worker ↔ job matching.
 *
 * Deliberately simple and explainable: every score comes with the reasons
 * behind it, so Pinnacle staff can see why a candidate was suggested and
 * overrule it. Scores are 0–100.
 *
 *   Role/trade similarity  up to 35
 *   Same sector                  25
 *   Pass type eligibility  up to 25
 *   Experience             up to 15
 */

type MatchWorker = {
  roleTitle: string;
  sector: string;
  passTrack: string;
  yearsExperience: number;
  summary?: string | null;
};

type MatchJob = {
  roleTitle: string;
  sector: string;
  passTrackRequired: string;
  description?: string | null;
};

export type Match = {
  score: number;
  /** False when the worker can't legally take the job (e.g. SC/PR only). */
  eligible: boolean;
  reasons: string[];
};

const STOPWORDS = new Set([
  "and",
  "or",
  "the",
  "a",
  "an",
  "of",
  "for",
  "in",
  "at",
  "to",
  "with",
  "staff",
  "worker",
  "senior",
  "junior",
  "assistant",
  "executive",
  "officer",
  "general",
  "team",
  "member",
  "crew",
]);

const LOCAL = "Singaporean / PR";
// Higher tiers can take roles hired under lower tiers.
const PASS_RANK: Record<string, number> = {
  "Work Permit": 1,
  "S Pass Eligible": 2,
  "EP Ready": 3,
};

function tokens(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((t) => (t.length > 4 ? t.replace(/(ers|er|ing|s)$/, "") : t))
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function overlap(a: Set<string>, b: Set<string>) {
  return Array.from(a).filter((t) => b.has(t));
}

export function scoreMatch(worker: MatchWorker, job: MatchJob): Match {
  const reasons: string[] = [];
  let score = 0;

  // Eligibility first: local-only roles need a Singaporean / PR.
  if (job.passTrackRequired === LOCAL && worker.passTrack !== LOCAL) {
    return {
      score: 0,
      eligible: false,
      reasons: ["Role is for Singaporeans / PRs only"],
    };
  }

  // Role similarity: title against title, then title against the worker's summary.
  const jobTokens = tokens(job.roleTitle);
  const titleHits = overlap(jobTokens, tokens(worker.roleTitle));
  if (titleHits.length > 0) {
    score += Math.round(
      35 *
        Math.min(
          1,
          titleHits.length / Math.max(1, Math.min(jobTokens.size, 2)),
        ),
    );
    reasons.push(`Trade matches (${worker.roleTitle})`);
  } else if (worker.summary) {
    const summaryHits = overlap(jobTokens, tokens(worker.summary));
    if (summaryHits.length > 0) {
      score += 15;
      reasons.push(`Relevant experience mentioned (${summaryHits.join(", ")})`);
    }
  }

  if (worker.sector === job.sector) {
    score += 25;
    reasons.push(`Same sector (${job.sector})`);
  }

  if (worker.passTrack === LOCAL) {
    score += 25;
    reasons.push("Singaporean / PR — no work pass needed");
  } else if (worker.passTrack === job.passTrackRequired) {
    score += 25;
    reasons.push(`${job.passTrackRequired} ✓`);
  } else if (
    (PASS_RANK[worker.passTrack] ?? 0) >
    (PASS_RANK[job.passTrackRequired] ?? 99)
  ) {
    score += 15;
    reasons.push(
      `${worker.passTrack} (qualifies for ${job.passTrackRequired})`,
    );
  } else if (worker.passTrack === "In Verification") {
    score += 8;
    reasons.push("Pass type still being verified");
  }

  if (worker.yearsExperience > 0) {
    score += Math.round(Math.min(worker.yearsExperience, 10) * 1.5);
    reasons.push(`${worker.yearsExperience} yrs experience`);
  }

  return { score: Math.min(100, score), eligible: true, reasons };
}

export function matchLabel(score: number) {
  if (score >= 70) return "Strong match";
  if (score >= 45) return "Good match";
  return null;
}
