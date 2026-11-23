# Supabase setup

The schema lives in `migrations/` and is applied with the Supabase CLI (already a dev dependency).

## 1. Create the project (Jithu's account)

1. supabase.com → New project → name `light-city-church`, region **London (eu-west-2)**, **Pro plan for production** (free projects pause after 7 days idle), save the database password.
2. Project Settings → API: copy the URL, the anon/publishable key and the service-role key into `.env.local` (see `.env.example`).
3. Authentication → Sign In / Providers → **turn OFF "Allow new users to sign up"** (staff are invite-only).
4. Authentication → URL configuration: Site URL `http://localhost:3000` (add the production URL later); add `http://localhost:3000/**` to redirect URLs.

## 2. Apply the schema

```bash
npx supabase login                  # Jithu logs in, or uses an access token
npx supabase link --project-ref <project-ref>
npx supabase db push                # applies supabase/migrations/*.sql
npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

## 3. Create the first super admin

Authentication → Users → **Invite user** (your email). Then in the SQL editor:

```sql
update public.profiles set role = 'super_admin', is_active = true where email = 'you@example.com';
```

## Testing the policies locally (no Docker needed)

With a local Postgres 15+:

```bash
createdb lcc_test
psql -d lcc_test -f supabase/tests/local_auth_stub.sql   # fakes Supabase's auth schema and roles
for f in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -d lcc_test -f "$f"; done
psql -d lcc_test -f supabase/tests/rls_test.sql          # each line says what to expect
```

## Migrations

| File | Contents |
|---|---|
| `…01_core.sql` | roles, profiles, permission matrix, `has_permission()`, activity log |
| `…02_media_cms.sql` | media library, pages + sections + versions, globals, devotionals, sermons, redirects, publish/restore functions |
| `…03_people_forms_events.sql` | people, form builder, enquiries inbox, subscribers, events + registrations, email templates/log |
| `…04_bookings.sql` | booking types, hosts, availability, bookings (no-double-booking constraint), status history |
| `…05_rls_policies.sql` | Row Level Security for every table, public read access, RPC lockdown, storage bucket |
| `…06_integrity_search_audit.sql` | media usage derived by triggers + delete guard, audit triggers, full-text search, rate limiter |
