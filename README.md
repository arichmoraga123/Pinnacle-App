# Pinnacle

Next.js 14 (App Router) + TypeScript scaffold styled with Tailwind CSS, using
Drizzle ORM against Neon's serverless Postgres driver.

## Stack

- **Framework:** Next.js 14 (App Router, `src/` directory)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom color tokens
- **Database:** Drizzle ORM + `@neondatabase/serverless` (`drizzle-orm/neon-http`)
- **Auth (planned):** Clerk
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

Fill in `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`.

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/          # App Router routes, layout, and global styles
  components/   # Shared UI components
  db/           # Drizzle client (index.ts) and schema (schema.ts)
  lib/          # Utilities (cn, etc.)
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
