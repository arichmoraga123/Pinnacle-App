/** Placeholder values written when a profile row is created before onboarding. */
export const PENDING_ROLE_TITLE = "Profile pending";
export const PENDING_COUNTRY = "Pending";
export const PENDING_COMPANY = "Company pending";

export function isWorkerProfileComplete(worker: {
  roleTitle: string;
  originCountry: string;
}) {
  return (
    worker.roleTitle !== PENDING_ROLE_TITLE &&
    worker.originCountry !== PENDING_COUNTRY
  );
}

export function isEmployerProfileComplete(employer: { companyName: string }) {
  return employer.companyName !== PENDING_COMPANY;
}
