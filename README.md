# Pinnacle

Pinnacle is a placement agency's website. Singapore employers post jobs,
foreign workers apply online, and Pinnacle staff sit in the middle. They
screen candidates, make introductions, and track each placement and its
commission.

## How it works

| Who                  | What they can do                                                                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public**           | Browse open jobs at `/jobs` (company names are hidden; only the industry is shown).                                                                                                                                                          |
| **Worker**           | Build a profile, apply to jobs with a message, track each application's stage, withdraw before review.                                                                                                                                       |
| **Employer**         | Set up a company profile, post/edit/pause/close jobs, see candidates per job (anonymised until Pinnacle introduces them), browse the talent pool and request introductions.                                                                  |
| **Admin (Pinnacle)** | Pipeline of every application and introduction request, with stage, internal notes and commission tracking. Post jobs on behalf of any client, add client companies that have no login, manage workers' availability and verified pass type. |

Introductions move through `Requested → Pinnacle Review → Introduced →
Interview → Offer → Placed` (or `Declined`). Employers only see a worker's name
and contact details from **Introduced** onwards. Marking an introduction
**Placed** marks the worker as placed.

### Making someone an admin

Admins can't sign themselves up. Have the person create an account at
`/sign-up` (either role works), then run:

```bash
npm run make-admin -- their@email.com
```

They sign out and back in, and they land on `/admin/pipeline`.

## Stack

- **Framework:** Next.js 14 (App Router, `src/` directory)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom color tokens
- **Database:** Drizzle ORM + `@neondatabase/serverless` (`drizzle-orm/neon-http`)
- **Auth:** Clerk (roles stored in `publicMetadata.role`)
- **Validation:** Zod
- **Tooling:** ESLint + Prettier

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.local.example .env.local
```

Fill in `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
and `CLERK_WEBHOOK_SIGNING_SECRET`. Also follow the session-token note at the
bottom of `.env.local.example`.

3. Create the tables (and optionally load demo data):

```bash
npm run db:migrate
npm run db:seed
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/
    page.tsx      # Landing page
    jobs/         # Public job board + job detail / apply
    worker/       # Worker: browse, applications, profile (+ actions.ts)
    employer/     # Employer: jobs, candidates, talent browse, company (+ actions.ts)
    admin/        # Pinnacle staff: pipeline, jobs, employers, workers (+ actions.ts)
  components/     # Shared UI (header, cards, forms)
  db/             # Drizzle client, schema, shared queries, seed
  lib/            # Auth/session helpers, validation, formatting, options
scripts/          # make-admin
drizzle/          # SQL migrations
drizzle.config.ts
tailwind.config.ts
```

## Database scripts

Drizzle Kit is wired up via npm scripts (requires `DATABASE_URL` in the
environment):

- `npm run db:generate` – generate SQL migrations from the schema
- `npm run db:migrate` – apply migrations
- `npm run db:push` – push the schema directly to the database
- `npm run db:studio` – open Drizzle Studio

## Design tokens

Custom Tailwind colors:

| Token      | Hex       |
| ---------- | --------- |
| `ink`      | `#14213D` |
| `paper`    | `#F1F3EF` |
| `amber`    | `#E3A039` |
| `teal`     | `#1F6F6B` |
| `stampRed` | `#B23A2E` |
| `graphite` | `#232B36` |

Fonts (via `next/font/google`): Space Grotesk (display), IBM Plex Sans (body),
IBM Plex Mono (data/labels).
