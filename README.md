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

### Posters, job codes and short links

On **Admin → Jobs → Post a job** staff can upload the recruitment poster
(JPG/PNG/WebP, up to 4 MB) and give the job its code (e.g. `PS0015`). Posters
show on the job board and homepage, and tapping one opens the application.
Every coded job also has a short link for social posts: `/j/PS0015`. Workers
can search by code too.

### Applications

Workers apply with a resume/CV and a recent photo (both optional and stored on
their profile for next time). A visitor who taps a poster and signs up lands back
on that job's application.

### Matching

`src/lib/matching.ts` scores every worker against every job (trade
similarity, sector, work-pass eligibility, experience) and always shows the
reasons. Workers see **Best matches for you** at the top of their job list
but can still browse everything. On each job's admin page Pinnacle staff see
**Suggested candidates** and can **Put forward** a worker, which adds them to
the pipeline. SC/PR-only roles are never suggested to foreign workers.

### Notifications

Email via [Resend](https://resend.com). Staff get an email for every new
application, introduction request and employer-posted job. Workers get an email
when their application moves stage, and employers get one when Pinnacle introduces
a candidate. The pipeline has one-tap WhatsApp links for every worker.

### File storage

Neon is a Postgres database, not file storage, so posters, resumes and photos go
in an S3-compatible bucket (Cloudflare R2 recommended). Files stay private and
are served through the app with permission checks:

- Posters are public.
- A worker's resume/photo can be seen by that worker and Pinnacle staff, and by
  an employer once Pinnacle has introduced the worker to them.

See the `S3_*` variables in `.env.local.example`.

Introductions move through `Requested → Pinnacle Review → Introduced →
Interview → Offer → Placed` (or `Declined`). Employers only see a worker's name
and contact details from **Introduced** onwards. Marking an introduction
**Placed** marks the worker as placed.

### Admins

Staff access comes from the admin email list. You manage it at
**Admin → Team**, and `a.rich.moraga@gmail.com` is on it from the first
migration. Anyone who signs up or signs in with a **verified** email on the
list becomes an admin automatically. Adding someone who already has an account
promotes them immediately. Removing them gives them back the role they chose at
sign-up. You can't remove yourself or the last admin.

From the command line, `npm run make-admin -- their@email.com` does the same
thing.

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
