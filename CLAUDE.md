@AGENTS.md

# Project: The Light City Church website + admin CMS

- The architecture and phased build plan live in `docs/ARCHITECTURE.md`. Read it before starting any task and follow the current phase.
- Stack: Next.js 16 (App Router, `proxy.ts` not `middleware`), Supabase (Postgres + Auth + Storage), Tailwind v4 for `/admin`, existing CSS Modules for the public site.
- The public site must read all content from the CMS — never hardcode copy, images or links.
- Schema changes go in `supabase/migrations/*.sql`; regenerate types after each migration.
- Every mutating Server Action: validate with Zod, check `can(user, module, action)`, call `logActivity()`.
