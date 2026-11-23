# Supabase setup

The schema lives in `migrations/` and is applied with the Supabase CLI (already a dev dependency).

## 1. Create the project (Jithu's account)

1. supabase.com → New project → name `light-city-church`, region **London (eu-west-2)**, **Pro plan for production** (free projects pause after 7 days idle), save the database password.
2. Project Settings → API: copy the URL, the anon/publishable key and the service-role key into `.env.local` (see `.env.example`).
3. Authentication → Sign In / Providers → **turn OFF "Allow new users to sign up"** (staff are invite-only).
4. Authentication → URL configuration: Site URL `http://localhost:3000` (use the production URL in the production project); add `http://localhost:3000/**` to redirect URLs. Invite and reset emails link to `{{ .SiteURL }}/api/auth/confirm`, so the Site URL must be the site that should receive them.
5. Authentication → **Email Templates**: paste `templates/invite.html` into **Invite user** and `templates/recovery.html` into **Reset password** (subjects are in `config.toml`). Without this, the default links skip `/api/auth/confirm` and sign-in from email fails.
6. Authentication → **Multi-Factor** → enable **TOTP (authenticator app)**. Super Admins and Admins must set it up at first sign-in.
7. Authentication → **Passwords**: minimum length **12**, and turn on leaked-password protection (Pro).
8. Optional (Pro): Authentication → Sessions → inactivity timeout. The admin also signs people out after 30 minutes idle in the browser.
9. Before going live, set up custom SMTP (Resend) under Authentication → Emails. The built-in sender is heavily rate-limited and only for testing.

## 2. Apply the schema

```bash
npx supabase login                  # Jithu logs in, or uses an access token
npx supabase link --project-ref <project-ref>
npx supabase db push                # applies supabase/migrations/*.sql
npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

## 3. Create the first super admin

Do these in order (an invite made from the dashboard has no role, so the account starts inactive):

1. Authentication → Users → **Invite user** (your email). **Don't click the email link yet.**
2. In the SQL editor:
   ```sql
   update public.profiles set role = 'super_admin', is_active = true where email = 'you@example.com';
   ```
3. Now click **Accept invite** in the email → set your name and password → scan the QR code to set up 2FA → you land on `/admin`.

If the link expired, send the invite again from the dashboard. Once the admin Users screen exists, invite other staff from there: it sets their role so their account is active straight away. Until then, repeat steps 1–3 with their email and role.

## Testing the policies locally (no Docker needed)

With a local Postgres 15+:

```bash
createdb lcc_test
psql -d lcc_test -f supabase/tests/local_auth_stub.sql   # fakes Supabase's auth schema and roles
for f in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -d lcc_test -f "$f"; done
psql -v ON_ERROR_STOP=1 -d lcc_test -f supabase/tests/rls_test.sql
```

The test file is self-asserting: each passing check prints `ok - <name>`, and the first failing one stops with `FAIL <name>: expected …, got …` and a non-zero exit code. CI (`.github/workflows/ci.yml`) runs exactly these commands on every push. Add a check with `tests.eq(name, actual, expected)` or `tests.throws(name, sql, error_pattern)` for every new table or policy.

## Migrations

| File | Contents |
|---|---|
| `…01_core.sql` | roles, profiles, permission matrix, `has_permission()`, activity log |
| `…02_media_cms.sql` | media library, pages + sections + versions, globals, devotionals, sermons, redirects, publish/restore functions |
| `…03_people_forms_events.sql` | people, form builder, enquiries inbox, subscribers, events + registrations, email templates/log |
| `…04_bookings.sql` | booking types, hosts, availability, bookings (no-double-booking constraint), status history |
| `…05_rls_policies.sql` | Row Level Security for every table, public read access, RPC lockdown, storage bucket |
| `…06_integrity_search_audit.sql` | media usage derived by triggers + delete guard, audit triggers, full-text search, rate limiter |
