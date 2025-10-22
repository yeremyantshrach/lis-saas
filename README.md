# LIS SaaS

Multi-tenant laboratory information system starter built on Next.js 15 with Better Auth, Drizzle ORM, and Stripe integration. The app ships with an onboarding flow, organization-aware dashboards, and opinionated access control for both admins and lab roles.

## Tech Stack
- Next.js 15 (App Router, React 19, Server Components, Server Actions)
- TypeScript, Tailwind CSS 4, shadcn/ui component primitives
- Better Auth 1.3 for authentication, organizations, and admin tooling
- Drizzle ORM with PostgreSQL
- Stripe plugin for subscription/customer lifecycle
- DnD Kit, TanStack Table, Recharts, Radix UI, Sonner notifications

## Core Features
- **Authentication & Access Control**: Better Auth server (`src/lib/auth.ts`) with organization + admin plugins, server-only redirect utilities (`src/lib/auth-redirects.ts`), and a typed React client (`src/lib/auth-client.ts`).
- **Multi-Tenancy**: Each user can belong to a single organization; organization dashboards are accessed via `/[orgSlug]/dashboard` and guarded in `src/app/[orgSlug]/layout.tsx`.
- **Onboarding Flow**: Users without an organization are routed to `/onboarding`, where a server action (`createOrganizationAction`) provisions the org and redirects to the new dashboard.
- **UI Shell**: Reusable sidebar/layout primitives, nav user menu, and responsive cards/tables for lab operations.
- **Infrastructure Ready**: Drizzle migrations, Dockerfile, and docker-compose setup for local Postgres + app container.

## Project Structure (selected)
```
src/
  app/
    (public-layout)/          # Marketing/auth/onboarding routes
    [orgSlug]/                # Organization-aware dashboard
  components/                 # shadcn-style UI + layout primitives
  lib/
    auth.ts                   # Better Auth server configuration
    auth-client.ts            # Auth client with plugin wiring
    auth-redirects.ts         # Server-only redirect helpers
    database.ts               # Drizzle Postgres connection
    env.ts                    # Env variable validation
    validations/              # zod schemas (e.g., organization)
```

## Prerequisites
- Node.js 20+
- pnpm (Corepack is enabled in the Dockerfile)
- PostgreSQL 15+ (local instance or Docker)
- Stripe account + secret/webhook keys

## Environment Variables
Create an `.env.local` (or export in your shell) with:

| Key | Description |
| --- | --- |
| `BETTER_AUTH_SECRET` | Secret used by Better Auth for signing tokens |
| `BETTER_AUTH_URL` | Base URL that Better Auth uses for callbacks (e.g., `http://localhost:3000`) |
| `POSTGRES_HOST` | Database host |
| `POSTGRES_PORT` | Database port (number) |
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

`src/lib/env.ts` will throw at boot if any of these are missing or malformed.

## Installation
```bash
pnpm install
```

### Database setup
1. Ensure Postgres is running and matches your `.env.local`.
2. Generate Better Auth schema types (optional, but recommended after auth config changes):
   ```bash
   pnpm auth:generate
   ```
3. Generate or migrate Drizzle schema:
   ```bash
   pnpm db:generate   # create migrations from current schema
   pnpm db:migrate    # apply migrations to the configured database
   ```
4. Optional: interactive DB explorer  
   ```bash
   pnpm db:studio
   ```

### Running locally
```bash
pnpm dev
```
Visit [http://localhost:3000](http://localhost:3000).

### Linting & formatting
```bash
pnpm lint
```

### Production build
```bash
pnpm build
pnpm start
```

### Docker (optional)
```bash
docker compose up --build
```
This launches Postgres and the Next.js app (`pnpm start`) behind port 3000.

## Authentication & Routing Model
- Server components call helpers in `src/lib/auth-redirects.ts` to enforce access:
  - `requireAuthenticated(fromPath)` redirects unauthenticated users to `/sign-in?from=...`.
  - `redirectIfAuthenticated()` sends signed-in users to their default destination.
  - `getPostAuthRedirect()` selects `/[orgSlug]/dashboard` if an active org exists, otherwise `/onboarding`.
- Public routes (`/(public-layout)`) call these helpers on the server so pages never render the wrong state.
- Organization layout (`src/app/[orgSlug]/layout.tsx`) ensures:
  1. User is signed in.
  2. An organization is active.
  3. The URL slug matches the active organization (otherwise it redirects).
- Better Auth session enrichment (`src/lib/auth.ts`) sets `session.activeOrganizationId` and `activeOrganizationSlug` so guards and the React client can reference them directly.

## Stripe Integration
The Stripe plugin (`@better-auth/stripe`) is configured in `src/lib/auth.ts`. Provide valid Stripe credentials and webhook secret to enable automatic customer creation and billing hooks. Webhooks should target Better Auth’s configured base URL.

## Scripts
| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js in development with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm auth:generate` | Regenerate Better Auth schema/types |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema without migrations (careful in prod) |
| `pnpm db:studio` | Launch Drizzle Studio |

## Development Tips
- Favor server components for auth-protected content and use `requireAuthenticated` early to avoid rendering placeholders.
- After adjusting Better Auth plugins or schema, run `pnpm auth:generate` to keep `src/lib/auth-schema.ts` in sync.
- UI components follow the shadcn pattern; create new components via the `shadcn` CLI if needed.
- Database helpers are exported from `src/lib/database.ts`; reuse the shared `db` instance in server code.

## Future Enhancements
- Stripe webhook handler route
- Organization management (invite members, roles)
- Automated tests for auth flows and server actions

---
Questions or suggestions? Open an issue or reach out to the maintainers. Happy building!
