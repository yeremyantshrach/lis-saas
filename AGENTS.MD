# Agent Playbook

Welcome to the LIS SaaS workspace. This guide captures the expectations for future agents so work remains consistent with our stack and tooling policies.

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

## Better Auth Guidance

- Centralise permissions in `src/lib/auth/*.ts` and avoid sprinkling resource/action strings throughout components—use helpers like `SideNavBuilder`.
- When roles change, update both Access Control definitions and associated client typings.
- Leverage database hooks and `customSession` to enrich session payloads instead of ad-hoc queries in components.

## shadcn/UI Workflows

- Stick to provided primitives (`Sidebar`, `NavMain`, etc.) and extend via composition rather than editing library files.
- Maintain token-based styling (Tailwind variables) and keep accessibility attributes intact.
- For new icons, prefer existing icon sets (`@tabler/icons-react`) already in use.

## Typical Workflow

1. Inspect the existing implementation (`rg`, `sed`) without mutating files.
2. Consult required documentation via MCP (Context7, Better Auth, shadcn).
3. Plan multi-step tasks using `update_plan`.
4. Implement changes using `apply_patch` for deterministic diffs.
5. Run available pnpm scripts/tests when safe; report skipped validations.
6. Summarise changes referencing exact file paths (`src/...:line`).

## Validation & Handoff

- After touching auth or navigation logic, confirm the side nav reflects permission gates via unit tests or manual reasoning.
- Document assumptions and pending verifications in the final response.
- Suggest next steps only when they provide clear value (e.g., run `pnpm lint`, add tests).

Keep this guide nearby whenever you tackle new work. Consistency across agents keeps the project predictable and maintainable. Happy shipping!
