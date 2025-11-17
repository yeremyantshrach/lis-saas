# Agent Playbook

Welcome to the LIS SaaS workspace. This guide captures the expectations for future agents so work remains consistent with our stack and tooling policies.

## Stack Snapshot
- **Next.js 15 App Router** with Server Components and layouts. Follow the official App Router file conventions from the Context7 docs before adding or moving routes.
- **React 19** split into Server and Client Components. Keep interactive logic behind `\"use client\"` boundaries and compose client islands from server parents per the React RSC docs.
- **Better Auth 1.3 + Stripe plugin** powers authentication, orgs, lab teams, and billing. `src/lib/auth.ts` wires `betterAuth` with `admin`, `organization`, `customSession`, `openAPI`, and `@better-auth/stripe`. Run `pnpm auth:generate` after changing anything auth-related.
- **Drizzle ORM + PostgreSQL** for persistence. Schemas live under `src/lib/{auth,lab-tests,patients}` with migrations in `drizzle/`. Keep `drizzle.config.ts` accurate and generate migrations via `pnpm db:generate`.
- **Tailwind CSS 4 + shadcn/ui** provide UI primitives. Complementary tooling includes Radix UI, Tabler icons, TanStack Table, Sonner, DnD Kit, and Recharts.

## Directory Landmarks
- `src/app/(public-layout)` — marketing/auth/onboarding flows. Check `/verify-email` for the canonical `react-hook-form` + shadcn pattern.
- `src/app/[orgSlug]` — tenant dashboards and server components. `layout.tsx` enforces slug/session alignment before rendering children.
- `src/lib` — core logic:
  - `auth.ts`, `auth-client.ts`, `auth-redirects.ts`, and `auth/` permissions.
  - `helpers/` (auth/db/action/patient/lab-test) plus `try-catch.ts`.
  - `actions/` server actions grouped by concern.
  - `validations/` zod schemas.
  - `lab-tests/` + `patients/` schema/constants/helpers.
  - `storage/` adapters (local driver by default).
- `drizzle/` — SQL migrations; keep in sync with `src/lib/schema.ts`.
- `scripts/promote-admin.ts` — elevates a user via CLI.

## Core Principles

- Stay within the workspace sandbox and preserve existing changes.
- Default to TypeScript, React Server Components, and App Router conventions.
- After auth or schema tweaks, regenerate Better Auth typings (`pnpm auth:generate`) and keep Drizzle migrations in sync.
- Reuse shadcn/ui primitives; avoid bespoke styling unless necessary.
- Validate behaviour with relevant pnpm scripts when practical.

## Mandatory MCP Tooling

### 1. Context7 Documentation

**ALWAYS** use Context7 MCP to fetch library documentation before using any library (Next.js, React, Drizzle, etc.).

**Step 1:** Resolve the library ID

```json
{
  "recipient_name": "functions.mcp_context7_resolve-library-id",
  "parameters": {
    "libraryName": "next"
  }
}
```

**Step 2:** Fetch documentation with the resolved ID

```json
{
  "recipient_name": "functions.mcp_context7_get-library-docs",
  "parameters": {
    "context7CompatibleLibraryID": "/vercel/next.js/v14.2.5",
    "topic": "app router middleware",
    "tokens": 5000
  }
}
```

**Examples:**

- Before implementing Next.js routing: fetch `/vercel/next.js` docs on "routing" or "app directory"
- Before using React hooks: fetch `/facebook/react` docs on "hooks"
- Before schema changes: fetch `/drizzle-team/drizzle-orm` docs on "migrations"

### 2. Better Auth Knowledge Base

**ALWAYS** use Better Auth MCP when working with authentication, authorization, sessions, or permissions.

**Search for specific information:**

```json
{
  "recipient_name": "functions.mcp_better-auth_search",
  "parameters": {
    "query": "how to implement email verification",
    "mode": "balanced",
    "limit": 5
  }
}
```

**Chat for complex multi-turn questions:**

```json
{
  "recipient_name": "functions.mcp_better-auth_chat",
  "parameters": {
    "messages": [
      {
        "role": "system",
        "content": "You are helping with a Next.js SaaS app using Better Auth."
      },
      {
        "role": "user",
        "content": "How do I add custom fields to the session payload using the customSession plugin?"
      }
    ]
  }
}
```

**Examples:**

- Before modifying `src/lib/auth.ts`: search Better Auth for "server configuration"
- Before adding permissions: search for "organization permissions" or "RBAC"
- Before implementing email flows: chat about "email verification resend logic"

### 3. shadcn Component Registry

**ALWAYS** use shadcn MCP when implementing or modifying UI components.

**Step 1:** List available components

```json
{
  "recipient_name": "functions.mcp_shadcn_get_project_registries",
  "parameters": {}
}
```

**Step 2:** Search for the component

```json
{
  "recipient_name": "functions.mcp_shadcn_search_items_in_registries",
  "parameters": {
    "registries": ["@shadcn"],
    "query": "data-table"
  }
}
```

**Step 3:** Get usage examples

```json
{
  "recipient_name": "functions.mcp_shadcn_get_item_examples_from_registries",
  "parameters": {
    "registries": ["@shadcn"],
    "query": "data-table-demo"
  }
}
```

**Step 4:** Get the add command

```json
{
  "recipient_name": "functions.mcp_shadcn_get_add_command_for_items",
  "parameters": {
    "items": ["@shadcn/data-table"]
  }
}
```

**Examples:**

- Before creating a new form: search for "form" and get examples
- Before implementing tables: get "data-table-demo" examples
- Before adding dialogs: search for "dialog" or "modal"

## Next.js Best Practices

- Prefer Server Components for data-fetching routes; fall back to Client Components only for interactivity.
- Use route handlers or server actions for mutations; keep client-side state minimal.
- Reuse `src/lib/auth-redirects.ts` for guarding routes rather than duplicating logic.
- Honour multi-tenant routing: derive organization slug from session data (`activeOrganizationSlug`) and validate URLs in `[orgSlug]` routes.

## Authentication & Permissions

- `src/lib/auth.ts` configures Better Auth with Drizzle (`databaseHooks.session.create.before` sets `activeOrganizationId`, `activeOrganizationSlug`, and `activeLabId`), the organization plugin (teams → labs naming), admin plugin, custom session enrichment, and the Stripe plugin (v2025-08-27). Confirm `env` secrets exist before changing it and rerun `pnpm auth:generate`.
- Clients mirror the same capabilities via `src/lib/auth-client.ts`, which layers `adminClient`, `organizationClient`, `customSessionClient`, and inferred additional fields. Keep client typings in lockstep with server roles/fields.
- Guard routes and layouts with `requireAuthenticated`, `redirectIfAuthenticated`, and `requireGlobalAdmin` from `src/lib/auth/auth-redirects.ts` to avoid client-side race conditions.
- All server mutations must call `requirePermission` (`src/lib/server-permissions.ts`). It reads the Better Auth session, verifies membership via `safeGetUserMember`, and redirects unauthorized users.
- Keep permission strings centralized: update Access Control definitions in `src/lib/auth/*.ts`, expose them via helpers, and reuse `getNavigationItems`/`usePermissions` so UI and nav gating stay consistent.
- Invitations, verification, and reset flows already live in `src/lib/emails/*`; reuse those utilities instead of rolling new email logic.
- Before touching auth/session logic, consult the Better Auth MCP (search or chat) for the relevant topic (server configuration, organizations, multi-session, etc.).

## Database, RLS, and Helpers

- Use the shared `Pool` + Drizzle instance from `src/lib/database.ts`; never spin up ad-hoc pools in actions.
- Postgres RLS policies rely on custom `lis.*` settings. Helpers such as `applyLabTestRlsContext` (lab tests) and the patient helpers set those configs—follow their patterns whenever you query protected tables.
- Patient schemas (`src/lib/patients/schema.ts`) join against `auth` tables and enforce access by organization/lab. Wrap reads/mutations in transactions that set `lis.current_user_id`, `lis.active_lab_id`, `lis.active_organization_id`, and `lis.is_global_admin`.
- Normalize JSON columns when Drizzle migrations lag (`ensureLabDetailColumnsAreJson` in lab tests) and favour the helper wrappers:
  - `src/lib/helpers/db-helpers.ts` – `safe*` DB queries that return `[data, error]`.
  - `src/lib/helpers/auth-helpers.ts` – Better Auth API wrappers (sign-in, org/team CRUD, invitations, verification, password reset).
  - `src/lib/helpers/action-helpers.ts` – `ActionResult`, `createSuccessResult`, `createErrorResult`, `handleActionError`, and `revalidateOrgPaths`.
  - `src/lib/try-catch.ts` – promise wrapper returning `[result, error]`.

## Server Actions & Validations

- Actions in `src/lib/actions/*` should:
  1. Authorize with `requirePermission`.
  2. Validate inputs with the relevant zod schema in `src/lib/validations`.
  3. Call Better Auth or Drizzle via the helper functions (`tryCatch`, `safe*` wrappers).
  4. Return an `ActionResult` and revalidate affected paths (`revalidateOrgPaths` or `revalidatePath`).
- Always import `headers()` when calling Better Auth APIs so cookie/session headers flow through.
- Prefer server actions + progressive enhancement over client-side fetches; mirror the pattern used by `member-actions.ts` or `patient-actions.ts`.

## shadcn/UI Workflows

- Stick to provided primitives (`Sidebar`, `NavMain`, etc.) and extend via composition rather than editing library files.
- Maintain token-based styling (Tailwind variables) and keep accessibility attributes intact.
- For new icons, prefer existing icon sets (`@tabler/icons-react`) already in use.

## Storage & File Handling

- `src/lib/storage/index.ts` exposes `storage`, defaulting to `LocalStorageAdapter`. Override with env vars (`FILE_STORAGE_DRIVER`, `FILE_STORAGE_ROOT`, `FILE_STORAGE_PUBLIC_PREFIX`) instead of editing caller code.
- `LocalStorageAdapter` (`src/lib/storage/local/adapter.ts`) writes to `public/uploads` and returns a public URL. Implement additional drivers by conforming to `StorageAdapter` in `src/lib/storage/types.ts`.
- Reuse the composable uploader in `src/components/ui/file-upload.tsx` (Dropzone, Trigger, List, Item Preview/Delete) for any document or media flow so UX remains consistent across the app.

## Tooling, Scripts, and Environment

- Use `pnpm` for everything. Key scripts: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm auth:generate`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`, `pnpm dev:email`, and `pnpm promote-admin`.
- `src/lib/env.ts` enforces required keys (`BETTER_AUTH_*`, `POSTGRES_*`, `STRIPE_*`, `RESEND_*`). Update env validation when adding new secrets and load `.env` locally via `env-config.ts`.
- Keep dependencies aligned with `package.json` (React 19, Next 15.5.x, Drizzle 0.44.x, Better Auth 1.3.x, Tailwind 4, etc.). Document any upgrades in the handoff summary.

## Typical Workflow

1. Inspect the existing implementation (`rg`, `sed`) without mutating files.
2. Consult required documentation via MCP (Context7, Better Auth, shadcn).
3. Plan multi-step tasks using `update_plan`.
4. Implement changes using `apply_patch` for deterministic diffs.
5. Run available pnpm scripts/tests when safe; report skipped validations.
6. Summarise changes referencing exact file paths (`src/...:line`).

## Validation & Tooling Checks

- Run `pnpm lint` after every material code change before handing work back. If lint cannot run, call it out explicitly in the final summary.
- Pair auth/schema edits with `pnpm auth:generate` to refresh Better Auth typings and avoid client/server drift.
- Never land schema changes without `pnpm db:generate` (new migration) and `pnpm db:migrate` (applied locally).
- When a feature depends on other scripts (`pnpm dev:email` for email templates, etc.), run them and record outcomes so the user knows what was validated or skipped.

## Validation & Handoff

- After touching auth or navigation logic, confirm the side nav reflects permission gates via unit tests or manual reasoning.
- Document assumptions and pending verifications in the final response.
- Suggest next steps only when they provide clear value (e.g., run `pnpm lint`, add tests).

## Working Agreements & Gotchas

- Always resolve libraries/topics with Context7 before changing framework-specific code (Next.js routing, React RSC patterns, Drizzle migrations, etc.).
- Any auth/session/permission change requires a Better Auth MCP lookup (search or chat) so server and client plugins remain in sync.
- Use the shadcn MCP registry (list/search/examples/add) before creating or editing components to keep styling consistent.
- Preserve multi-tenant invariants:
  - Derive org context through `safeGetSession`/`requirePermission` rather than bespoke queries.
  - Validate `[orgSlug]` params against `session.session.activeOrganizationSlug` and redirect if they diverge.
  - Revalidate affected org paths after every mutation via `revalidateOrgPaths` or `revalidatePath`.
- After DB schema tweaks run `pnpm db:generate` + `pnpm db:migrate`; after auth changes rerun `pnpm auth:generate`.

## Input & Form Standards

- **Validate with Zod + react-hook-form**: keep schemas in `src/lib/validations` and hydrate forms with `useForm` + `zodResolver` (see `/verify-email` for the canonical pattern). Map server-action errors back via `setError` using the `ActionResult.errors` object.
- **Use shared field primitives**: compose inputs with `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, and `FieldError` from `src/components/ui/field.tsx` to maintain alignment, helper copy, and ARIA wiring.
- **Preferred controls**: default to `Input`, `Textarea`, `Select`, `Switch`, `file-upload`, etc., from `src/components/ui`. Custom inputs must expose consistent `data-slot` and ARIA attributes so Field styling continues to work.
- **Length/value limits**: rely on `src/lib/constants/limits.ts` (e.g., `DEFAULT_TEXT_INPUT_MAX_LENGTH`, `DEFAULT_TEXTAREA_MAX_LENGTH`, pathogen/patient-specific caps) and add new exports there when needed.
- **Async submissions**: wrap server actions in `startTransition`, disable the submit `Button`, and surface status via Sonner toasts. Server actions should always return an `ActionResult`.
- **File uploads**: reuse the shadcn file-upload compound component for drag/drop, previews, and deletion states.

## UI/UX Standards

- **Token-driven styling**: use Tailwind tokens + shadcn primitives—avoid bespoke hex colors or spacing. Honour layout tokens like `--sidebar-width`/`--header-height` from `[orgSlug]/layout.tsx`.
- **Server-first rendering**: keep data fetching in Server Components and limit Client Components to interactivity. Follow the React RSC docs pulled via Context7.
- **Navigation consistency**: update `getNavigationItems` and rely on `AppSidebar` + `usePermissions` for gating rather than sprinkling permission strings.
- **Feedback patterns**: use Sonner for global toasts, `FieldError` for inline errors, `Skeleton` for placeholders, and Radix `AlertDialog/Dialog` for confirmations.
- **Multi-step flows**: mimic the patient wizard cards (identity/contact/billing/insurance/documents) for any new wizard—cards per step, `FieldGroup` spacing, sticky footers, and consistent copy decks.
- **Data-heavy widgets**: lean on TanStack Table wrappers, `src/components/ui/calendar.tsx`, and Recharts for dashboards; ensure charts/tables respect tenant scoping.

Keep this guide nearby whenever you tackle new work. Consistency across agents keeps the project predictable and maintainable. Happy shipping!
