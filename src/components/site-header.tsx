import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { Container } from "@/components/container";
import type { UserRole } from "@/lib/auth/roles";
import { getCurrentRole } from "@/lib/session";

const NAV: Record<
  UserRole | "guest",
  Array<{ href: string; label: string }>
> = {
  guest: [{ href: "/jobs", label: "Jobs" }],
  worker: [
    { href: "/worker/browse", label: "Find jobs" },
    { href: "/worker/applications", label: "My applications" },
    { href: "/worker/profile", label: "Profile" },
  ],
  employer: [
    { href: "/employer/jobs", label: "My jobs" },
    { href: "/employer/browse", label: "Browse talent" },
    { href: "/employer/profile", label: "Company" },
  ],
  admin: [
    { href: "/admin/pipeline", label: "Pipeline" },
    { href: "/admin/jobs", label: "Jobs" },
    { href: "/admin/employers", label: "Employers" },
    { href: "/admin/workers", label: "Workers" },
  ],
};

export async function SiteHeader() {
  const role = await getCurrentRole();
  const links = NAV[role ?? "guest"];

  return (
    <header className="border-b border-ink/10 bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold text-ink"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded bg-ink text-xs text-amber"
          >
            P
          </span>
          Pinnacle
        </Link>

        <nav className="-mx-2 flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded px-2 py-1 text-graphite transition hover:bg-ink/5 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <SignedOut>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/sign-in"
              className="whitespace-nowrap text-graphite hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="hidden whitespace-nowrap rounded-md bg-ink px-3 py-1.5 font-semibold text-white hover:bg-graphite sm:inline-flex"
            >
              Get started
            </Link>
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </Container>
    </header>
  );
}
