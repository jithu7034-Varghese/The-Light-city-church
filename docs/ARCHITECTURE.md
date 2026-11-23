# The Light City Church — Website + Admin CMS
## Architecture & Build Plan

This is the source of truth for rebuilding thelightcitychurch.org as a CMS-driven Next.js site with a full admin dashboard. It adapts the "Hueride admin + CMS" brief to a church, keeps the current Antigravity-built public design, and uses **Supabase** for the database, auth and file storage.

Work through the phases in order (section 10). Each phase ends with a demo, and nothing moves on until its "done when" list passes.

---

## 1. Goals

1. **Every word and image on the public site comes from the CMS.** No hardcoded copy, images, links, service times or social URLs.
2. **All the content from the old GoDaddy site is migrated:** pages, roughly 50 Daily Light devotionals, and photos. It's seeded so nothing is empty on first run.
3. **An admin dashboard** for prayer requests and enquiries, people, events, page content, devotionals, media, SEO, users and settings.
4. **A fast, server-rendered, SEO-correct public site.** Old URLs 301-redirect to the new ones so existing Google rankings carry over.

## 2. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** App Router + TypeScript (already in repo) | Read `node_modules/next/dist/docs/` before using an API; v16 renames `middleware` → **`proxy.ts`** and adds Cache Components (`"use cache"`, `cacheTag`, `updateTag`) |
| Database | **Supabase Postgres** | Schema lives in SQL migrations in `supabase/migrations/` (Supabase CLI) |
| Data access | `@supabase/ssr` + `@supabase/supabase-js` with generated types (`supabase gen types`) | No ORM: RLS does the authorisation, typed client does the queries |
| Auth | **Supabase Auth**: email + password, invite-by-email, password reset, TOTP 2FA | Roles stored in `profiles` |
| File storage | **Supabase Storage** bucket `media` (public read) | Uploads processed by `sharp`: WebP + responsive sizes |
| Admin styling | **Tailwind CSS v4**, scoped to `/admin` | Design tokens as CSS variables, shared with the public site |
| Public styling | Existing **CSS Modules** (keep the Antigravity look) | Refactored into section components |
| Forms / validation | `react-hook-form` + **Zod** (the same schemas on client and server) | |
| Rich text | **Tiptap** (stores JSON, rendered to semantic HTML on the server) | |
| Drag and drop | **dnd-kit** | Section order and item order |
| Charts | Recharts | Overview "Growth Trajectory" |
| Calendar | FullCalendar (or a light custom month/list view) | Events |
| Email | **Resend** (with SMTP as a fallback option in Settings) | New-enquiry notifications, invites |
| Spam protection | Cloudflare Turnstile + rate limit on public forms | |
| Toasts | `sonner` | |
| Hosting | **Vercel** + Supabase cloud (EU region, e.g. London) | The church is in the UK, so GDPR applies |

## 3. System overview

```mermaid
flowchart LR
  V[Visitor] -->|SSR pages| PUB[Next.js public site<br/>app/(site)]
  A[Admin user] --> ADM[Next.js admin<br/>app/admin]
  PUB -->|published content only<br/>anon key + RLS| DB[(Supabase Postgres)]
  PUB -->|form submit<br/>Server Action + Turnstile| DB
  ADM -->|Server Actions<br/>user session + RLS| DB
  ADM -->|upload → sharp → WebP sizes| ST[(Supabase Storage)]
  PUB -->|img srcset, lazy| ST
  ADM --> AUTH[Supabase Auth]
  DB -->|new enquiry| MAIL[Resend email]
  ADM -->|publish → updateTag| CACHE[Next cache]
  CACHE --> PUB
```

**Main idea:** a page is an ordered list of **sections**. Every section type is defined once in a code **registry** with three parts:

1. a **Zod schema** for its data,
2. an **admin editor form**,
3. a **public React component**.

The database stores `{ type, data, sort_order, visible }`. The public renderer looks up `type` in the registry and renders the component. Adding a new section type means adding one registry entry.

## 4. Repository structure (target)

```
src/
  app/
    (site)/                     # public website (server components)
      layout.tsx                # navbar + footer from CMS globals
      page.tsx                  # home  → renders page "home"
      [slug]/page.tsx           # about, ministries, gallery, contact, freedom-from-religion,
                                #   the-loved-circle, partner …  → renders page by slug
      devotionals/page.tsx      # blog index  (keep /blog → redirect, or keep /blog — decide once)
      devotionals/[slug]/page.tsx
      sitemap.ts  robots.ts
    admin/
      (auth)/login, reset-password, accept-invite, mfa
      (dashboard)/layout.tsx    # sidebar + topbar shell
        page.tsx                # Overview
        enquiries/  forms/  contacts/  events/  subscribers/
        bookings/                # calendar + list
        bookings/requests/       # consultation approval queue
        bookings/types/  bookings/availability/
        sermons/  announcements/  email-templates/
        pages/[slug]/           # section-based page editor
        navbar/  footer/
        devotionals/  media/  seo/
        users/  settings/  activity/
    api/
      preview/route.ts          # enables draftMode for live preview
      revalidate/route.ts       # optional webhook
      cron/reminders/route.ts   # booking reminders (Vercel Cron)
      cron/retention/route.ts   # GDPR auto-delete
    (site)/consultation/        # public booking flow
    (site)/booking/manage/[token]/  # reschedule / cancel without login
  cms/
    sections/                   # registry: hero.ts, text-image.ts, gallery.ts …
      registry.ts
    render/SectionRenderer.tsx
    queries.ts                  # getPublishedPage(slug), getGlobals(), getPost(slug)… ("use cache" + cacheTag)
  components/
    site/                       # public section components (CSS Modules, existing design)
    admin/ui/                   # design system: Button, Card, StatCard, Pill, Table, Modal, Drawer,
                                #   Input, Select, Toggle, Tabs, EmptyState, Skeleton, ConfirmDialog
    admin/editors/              # RichText, MediaPicker, LinkField, RepeaterList (dnd), SeoPanel
  lib/
    supabase/{server,client,admin}.ts   # admin = service role, server-only
    auth/permissions.ts         # can(user, module, action)
    media/process.ts            # sharp pipeline
    seo/{metadata,jsonld,checklist}.ts
    activity.ts                 # logActivity()
    validation/*.ts             # shared Zod schemas
  proxy.ts                      # protects /admin, refreshes the Supabase session, applies 301 redirects
supabase/
  migrations/*.sql
  seed/                         # JSON content migrated from the old site
  seed.ts                       # idempotent seed script (service role)
docs/ARCHITECTURE.md            # this file
```

Clean up first: delete `src/app/api/preorder` and `src/data/preorders.json` (leftovers from a product template). Remove the duplicated header, footer and animation helpers from the 7 page files once the shared layout exists.

## 5. Admin information architecture (Hueride brief → church)

| Brief item | Church version |
|---|---|
| Overview | **Overview** |
| INFORMATION · Form Inquiries | **INBOX · Enquiries**: one inbox for every public form submission (prayer request, testimony, contact, get involved/volunteer, salvation decision, Loved Circle, consultation request…), filterable by form |
| *(new)* | **INBOX · Form Submissions & Form Builder**: create and edit the public forms themselves (fields, required rules, recipients, auto-reply), and see the submissions for each form |
| *(new)* | **BOOKINGS · Consultation Requests**: requests from the public "Request a Consultation" page waiting for approval |
| Appointments | **BOOKINGS · Booking Management**: calendar and list of all bookings; availability, booking types, blackout dates |
| *(new)* | **BOOKINGS · Events & Registrations**: services, conferences and Light Groups; RSVPs, capacity, waitlist, check-in |
| Clients | **PEOPLE · People**: members and contacts (a profile with linked submissions, bookings, registrations and notes) |
| *(new)* | **PEOPLE · Subscribers**: devotional/newsletter sign-ups, CSV export |
| CONTENT MANAGEMENT | Navbar, **Home, About, Ministries, Gallery, Freedom from Religion, The Loved Circle, Give & Partner, Contact, Request a Consultation**, Footer, **Devotionals** (Blog Engine), **Sermons & Media**, Media Library, SEO Manager, **Announcements** |
| SYSTEM | **Users & Roles** (full user management), **Email Templates**, Settings, Activity Log |
| Footer of sidebar | Light Mode toggle, Sign Out |

Pages are rows in the `pages` table, so the sidebar's page list is generated. Adding a page in the CMS adds it to the sidebar.

### 5.1 Forms, submissions and enquiries

- **Form Builder.** Forms are data, not code. Each form has:
  - fields: text, email, phone, textarea, select, radio, checkbox, date, consent, hidden
  - per field: label, placeholder, help text, required, options, validation (min/max length, pattern)
  - field order set by drag and drop
  - settings: enquiry type, notification recipients, auto-reply email (on/off, template), success message or redirect URL, Turnstile on/off, data-retention period
- **Using a form on a page.** A `form` section type on any page takes a `form_id`, so the church can add a form anywhere without a developer.
- **Seeded forms:** Contact / Get Involved, Prayer Request & Testimony, Salvation Decision (Freedom from Religion), Join The Loved Circle, Newsletter, Request a Consultation, Volunteer.
- **Inbox (Enquiries):**
  - statuses Unread / Read / Follow-up / Closed
  - assign to a team member (e.g. a pastor) with an email notification
  - internal notes, convert to person, link to a booking, delete, bulk actions, CSV export per form
  - saved filters ("My assigned", "Prayer – unread")
- **Privacy.** Prayer requests are marked sensitive. Only roles with `enquiries.sensitive` can open them. Each form has its own retention period, and an auto-delete job removes old submissions (GDPR).

### 5.2 Consultation requests & booking management

- **Booking types** (CMS-editable): Pastoral consultation, Prayer & counselling session, Baptism enquiry, Wedding consultation, Child dedication, Hospital/home visit request, Meet the Pastor. Each type has:
  - duration and buffer time
  - location options: in person (venue/address), online (auto-attached video link field), or phone
  - who can take it (one or more staff hosts)
  - whether it needs approval or is instantly confirmed
  - intake questions (reuses the Form Builder)
  - minimum notice and booking window (e.g. 24 hours to 60 days ahead)
  - a daily cap
- **Availability:**
  - weekly working hours per host
  - date overrides and blackout dates (holidays, conference weeks)
  - time zone Europe/London
- **Public "Request a Consultation" page:**
  1. pick a type
  2. pick a slot from real availability, or send a "request a time" if none suit
  3. intake form + consent
  4. confirmation
- **Booking lifecycle:**
  - statuses: `requested → confirmed → completed`, or `cancelled` / `rescheduled` / `no_show` / `declined`
  - every status change emails the person (templates editable in the CMS) and attaches an **.ics calendar invite**
  - reminder emails 24 hours and 2 hours before
  - each confirmation email has a secure **reschedule/cancel link** (signed token, no login needed)
- **Admin views:**
  - **Consultation Requests** queue (approve / decline / propose a new time)
  - **Booking Management** calendar (day/week/month), filterable by host and type, plus a list view; drag a booking to reschedule; manual "book on behalf of"
  - each booking is linked to a **Person**, created automatically on first booking
- **Optional later:** two-way Google Calendar sync per host, and SMS reminders through Twilio.

### 5.3 Full user management

- Invite by email, resend or revoke an invite, edit profile, change role, deactivate or reactivate, delete with data handover.
- Roles: Super Admin, Admin, Pastor/Staff (sees their bookings and the enquiries assigned to them), Editor, Viewer. A **per-module permission matrix** covers view / edit / publish / delete / sensitive.
- Security:
  - require 2FA per role
  - active sessions list with "sign out everywhere"
  - session timeout
  - last-login and failed-attempt display
  - password policy
- Each user's personal settings: notification preferences (email on new enquiry, booking, assignment), working hours (used by booking availability), avatar and signature.

## 6. Design system

The brief asks to match a screenshot of the Hueride Overview page. **The screenshot wasn't attached**, so this follows the written spec. Add the screenshot to `docs/design/` when available.

- **Tokens** (CSS variables in `globals.css`, exposed to Tailwind via `@theme`):
  - dark (default): `--bg #0A0A0B`, `--surface #121214`, `--surface-2 #18181B`, `--border rgba(255,255,255,.08)`, `--text #FAFAFA`, `--muted #A1A1AA`, `--accent #3B82F6`, plus `success / warning / danger / info`
  - light: the inverse set under `[data-theme="light"]`
  - radius: `--radius-lg 20px`, `--radius-md 12px`
  - font: Outfit (already loaded)
- **Shell:**
  - fixed left sidebar (logo "Light City Admin", small uppercase group labels, active item gets a blue 3px left bar and a tinted background), collapses to a drawer below `lg`
  - top bar: global search ("Search people, enquiries, events…") with ⌘K, and a notification bell (unread enquiries + upcoming events)
- **Components:**
  - StatCard: icon, uppercase label, big number, status pill (LIFETIME, ATTENTION NEEDED, PUBLISHED, CONNECTED)
  - Table: uppercase headers, row hover, status pills, outlined action buttons, pagination
  - Toasts, ConfirmDialog, EmptyState, skeleton loaders
- **Theme toggle:** stored in a cookie plus `localStorage`, applied server-side through `data-theme` so there's no flash.

## 7. Data model (Supabase / Postgres)

All tables have `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at`, and RLS enabled.

**Users & permissions**
- `profiles` (id → auth.users, full_name, avatar_media_id, role `super_admin|admin|editor|viewer`, is_active, last_seen_at)
- `role_permissions` (role, module, can_view, can_edit, can_publish, can_delete). Modules: `enquiries, forms, bookings, contacts, events, subscribers, pages, globals, posts, sermons, media, seo, email_templates, users, settings, activity`. Plus a `sensitive` action for prayer requests
- SQL function `has_permission(module text, action text) returns boolean`, used in every RLS policy and mirrored in `lib/auth/permissions.ts`

**Page CMS**
- `pages` (slug unique, title, status `draft|published`, has_unpublished_changes, seo jsonb, published_at, updated_by)
- `page_sections` (page_id, type, sort_order, visible, data jsonb). This is the **working draft** the editor writes to
- `page_versions` (page_id, version int, snapshot jsonb `{sections, seo, title}`, note, created_by, created_at, is_published bool)
  - **Publish:** snapshot the draft into a new version, mark it published, then `updateTag('page:'+slug)`
  - **Restore:** copy a snapshot back into `page_sections` as a draft
  - **Public site** reads only the published snapshot
- `globals` (key `navbar|footer|site`, draft jsonb, published jsonb, versions handled the same way as pages)

**Devotionals (blog)**
- `posts` (slug unique, title, content jsonb [Tiptap], excerpt, featured_media_id, author_name, author_id, status `draft|scheduled|published`, published_at, seo jsonb, legacy_url)
- `categories`, `tags`, `post_categories`, `post_tags`
- Scheduled posts: the public query filters `status='published' OR (status='scheduled' AND published_at <= now())`, so no cron is needed

**Media**
- `media_folders` (name, parent_id)
- `media` (folder_id, file_name, storage_path, mime, size, width, height, variants jsonb `{320,640,1024,1600: path}`, blurhash/lqip, **alt text not null check (length > 0)**, title, caption, uploaded_by)
- `media_usage` (media_id, entity_type `page|post|global`, entity_id, field_path). Rebuilt whenever an entity is saved by walking its JSON for media ids. It powers "used in…" and the delete warning

**Forms & enquiries**
- `forms` (slug, name, enquiry_type, fields jsonb [ordered field definitions], settings jsonb {recipients[], auto_reply, success_message, redirect_url, turnstile, retention_days, sensitive}, is_active)
- `enquiries`: one row per form submission (form_id, type, name, email, phone, data jsonb [all answers], status `unread|read|follow_up|closed`, assigned_to, contact_id, booking_id null, source_page, consent bool, ip_hash, expires_at)
- `enquiry_notes` (enquiry_id, author_id, body)

**Bookings**
- `booking_types` (slug, name, description, duration_min, buffer_min, locations jsonb, requires_approval, intake_form_id, min_notice_hours, max_days_ahead, daily_cap, color, is_active)
- `booking_type_hosts` (booking_type_id, user_id)
- `availability_rules` (user_id, weekday, start_time, end_time)
- `availability_overrides` (user_id null = everyone, date, start_time null, end_time null, is_blackout, reason)
- `bookings` (booking_type_id, host_id, contact_id, starts_at, ends_at, location_kind, location_detail, status `requested|confirmed|rescheduled|cancelled|declined|completed|no_show`, intake jsonb, manage_token_hash, reminder_24h_sent_at, reminder_2h_sent_at, cancel_reason)
- `booking_events` (booking_id, actor_id null, from_status, to_status, note, created_at): audit trail
- A Postgres exclusion constraint on `(host_id, tstzrange(starts_at, ends_at))` for active statuses prevents double-booking
- Slot computation: `lib/bookings/slots.ts` takes rules, subtracts overrides, existing bookings and buffers, then applies notice/window/cap

**Events & registrations**
- `event_registrations` (event_id, contact_id, name, email, guests int, status `registered|waitlisted|cancelled|attended`, checked_in_at)

**Email**
- `email_templates` (key e.g. `booking_confirmed`, subject, body rich text with `{{variables}}`, is_active)
- `email_log` (to, template_key, entity, status, provider_id, error)
- Reminders and retention cleanup run as Vercel Cron jobs (`/api/cron/*`, protected by a secret) every 15 minutes / daily

**People**
- `contacts` (first_name, last_name, email unique, phone, city, address, tags text[], notes, joined_at, consent_marketing)
- `contact_notes` (contact_id, author_id, body)
- `events` (title, slug, kind `service|conference|group|other`, starts_at, ends_at, all_day, location, description, cover_media_id, status `scheduled|completed|cancelled|rescheduled`, recurrence_rule null, registration_enabled, capacity, waitlist_enabled). Pastoral appointments live in `bookings`, not here
- `subscribers` (email unique, name, source, confirmed_at, unsubscribed_at)

**SEO & system**
- `redirects` (from_path unique, to_path, status_code 301/302, hits, last_hit_at)
- `activity_log` (actor_id, action `create|update|delete|publish|restore|login…`, entity_type, entity_id, summary, diff jsonb)
- `site_settings` lives in `globals.site`: site name, logo, favicon, contact details, service times, social links, analytics IDs (GA4, GSC verification, GTM, Meta Pixel), SMTP/Resend, notification recipients, default meta/OG

**RLS summary**
- `anon` can `select` only published `page_versions`, the published `globals`, published `posts`, `media`, and `redirects`. It gets **no** direct inserts: public forms go through a Server Action that validates, checks Turnstile, rate-limits and writes with the service role.
- `authenticated` access is governed by `has_permission()`. Viewer is read-only. Only Super Admin can manage users, roles and settings.

## 8. Section library

Each section is a registry entry with a schema, an editor and a component. Repeatable items (cards, slides, FAQs, images) are arrays that can be reordered with dnd-kit.

| Type | Fields (all editable) | Used on |
|---|---|---|
| `hero` | eyebrow, heading, subheading, buttons[{label, href, style}], background image/video, overlay | all pages |
| `text_image` | heading, rich text, image, image side, buttons[] | About, Loved Circle |
| `scripture` | verse text, reference | Home (Acts 26:18), Freedom from Religion |
| `service_times` | heading, text, items[{day, time, venue, address, map link}], CTA | Home, Contact |
| `cards_grid` | heading, intro, items[{icon/image, title, text, link}] | Core values, Ministries |
| `people` | items[{photo, name, role, bio}] | Pastors |
| `gallery` | heading, images[{media, caption}], layout | Gallery, Home |
| `video` | heading, YouTube URL, caption | Home "My Daily Light", Podcast |
| `latest_posts` | heading, count, category filter | Home |
| `testimonials` | items[{quote, name, role, photo}] | Home |
| `faq` | items[{question, answer}] (emits FAQ JSON-LD) | any |
| `stats` | items[{value, label}] | any |
| `cta` | heading, text, buttons[] | many |
| `giving` | heading, text, PayPal link(s), bank details (optional, rich text) | Home, Give & Partner |
| `form` | heading, intro, **form_id** (picks a form from the Form Builder), layout | Contact, Freedom from Religion, Loved Circle, Home, anywhere |
| `booking` | heading, intro, which booking types to offer | Request a Consultation |
| `upcoming_events` | heading, count, kinds, show "Register" button | Home, Events |
| `sermons` | heading, series/speaker filter, count | Home, Sermons |
| `announcement_bar` | site-wide notice text, link, colour, start/end dates (stored in globals) | all pages |
| `newsletter` | heading, text, button label | Home |
| `directions` | items[{mode: car/tram/park&ride, text}], map embed | Contact |
| `rich_text` | rich text | Privacy Policy, misc |

**Editor UX:**
- left: the list of sections (drag to reorder, eye icon to show/hide, ⋯ menu to duplicate or delete)
- centre: the form for the selected section
- right: **live preview** in an iframe on `/api/preview?slug=` (Next `draftMode`)
- top: status pill (Draft changes / Published), **Save draft**, **Publish**, **Version history** drawer with restore
- "Add section" opens the library modal with thumbnails

## 9. Cross-cutting requirements

- **Media pipeline:**
  - upload (drag and drop, multiple) → validate type (jpg/png/webp/gif/svg*, mp4 optional) and size (≤10 MB)
  - `sharp` converts to WebP at 320/640/1024/1600 widths and generates an LQIP
  - the result is stored in Storage and a `media` row is created
  - the **alt text field is required** before the upload is saved
  - the public `<CmsImage>` renders `srcset`, `sizes`, `loading="lazy"` (eager for heroes) and the blur placeholder
  - *SVG gets sanitised
- **SEO:**
  - a `seo` jsonb column on pages and posts holds: meta title/description (with counters), slug, canonical, index/follow, OG/Twitter title/description/image, focus keyword, JSON-LD types
  - `generateMetadata()` reads it and falls back to the site defaults
  - JSON-LD: `Church` (a subtype of Organization/LocalBusiness), `Event`, `Article` for devotionals, `FAQPage`, `BreadcrumbList`
  - the SEO Manager has a status table, redirects, a robots.txt editor, and `sitemap.ts` generated from pages and posts
- **Old-URL redirects (seeded):**
  - `/dailylightdevotional/f/:slug` → `/devotionals/:slug`
  - `/contact-us` → `/contact`
  - `/freedom-from-religion` stays as it is
  - `/partner-with-us` → `/give`
- **Security:**
  - permission checks in every Server Action and route handler, as well as RLS
  - Zod on every input
  - rich text sanitised on render
  - Turnstile and rate limiting on public forms
  - the service-role key is used only in server-only modules
  - optional TOTP 2FA (Supabase MFA)
  - idle session timeout (30 minutes, configurable)
- **Activity log:** `logActivity()` is called in every mutating action.
- **Quality:**
  - validation messages, confirm-before-delete, toasts, loading skeletons, and empty states on every list
  - Lighthouse ≥ 90 on the public pages
- **GDPR (UK):**
  - consent checkbox on forms
  - privacy policy page
  - a delete/export-person action in People
  - prayer requests visible only to roles that have permission

## 10. Build phases

Each phase is one Claude Code session or a few. Commit at the end of each one. Phases 0–6 follow the order in the original brief; bookings come after the CMS because they reuse the Form Builder, email templates and People.

### Phase 0: Foundations
- Set up the Supabase project (EU), the Supabase CLI, `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `TURNSTILE_*`), and `.env.example`.
- Install Tailwind v4, Zod, react-hook-form, dnd-kit, Tiptap, sharp, sonner and recharts.
- Write the first migration (all tables, enums, `has_permission`, RLS policies) and generate the types.
- Remove the preorder leftovers. Fix the lockfile and the lint errors.
- **Done when:** `npm run build` passes and `supabase db reset` creates the schema.

### Phase 1: Admin layout, auth, design system
- `proxy.ts` session handling and the `/admin` guard. Login, reset password, invite acceptance and optional MFA.
- Admin shell (sidebar, top bar, mobile drawer, theme toggle) and the UI kit components.
- **Done when:** an invited user can log in and see an empty dashboard in dark and light mode on desktop and mobile.

### Phase 2: Overview, Form Builder & Enquiries
- **Form Builder:** create and edit forms (fields, ordering, validation, recipients, auto-reply, success message, retention). Seed the 7 standard forms.
- One generic Server Action `submitForm(formSlug, data)` builds a Zod schema from the form definition, checks Turnstile, rate-limits, inserts the enquiry, emails the recipients and sends the auto-reply.
- Enquiries inbox:
  - search, filters (form, status, assignee, date range), saved filters
  - detail drawer, internal notes, assign to a team member
  - status changes, convert to person, bulk actions, delete, CSV export
  - sensitive (prayer) gating
- Email templates + `email_log` (Resend).
- Overview:
  - 4 stat cards (Total Enquiries · LIFETIME, Unread · ATTENTION NEEDED, Devotionals · PUBLISHED, Pending Consultations · ATTENTION NEEDED)
  - Growth Trajectory chart (7/30/90 days)
  - Action Items generated from real data: unread enquiries, consultation requests awaiting approval, bookings and events in the next 7 days, pages/posts missing SEO fields, media without alt text
  - Recent Enquiries table
- **Done when:** submitting a live form shows up on the Overview within seconds, emails the team, and sends the auto-reply.

### Phase 3: Media Library
- Grid and list views, folders, search, multi-upload with drag and drop, the processing pipeline, the details panel (alt text required, title, caption, file name), replace file, "used in" list, delete with an in-use warning.
- A `MediaPicker` modal reused by every editor.
- Seed: upload every image in `public/church`, `public/ronny` and the others, with written alt text.

### Phase 4: Section-based Page CMS
- Section registry and `SectionRenderer`. Convert every existing public page (Home, About, Ministries, Gallery, Contact) into sections, **keeping the current visual design** by moving the JSX and CSS Modules into `components/site/sections/*`.
- Add the new pages from the old site: Freedom from Religion, The Loved Circle, Give & Partner, Privacy Policy.
- Page editor:
  - edit, add from the library, duplicate, delete, show/hide
  - drag-and-drop ordering of sections and items
  - rich text, MediaPicker
- Draft → Preview → Publish, version history with restore, and `updateTag` revalidation.
- Navbar CMS (logo, items, dropdowns, order, CTA) and Footer CMS (columns, links, contact, socials, copyright).
- **Done when:** none of the public pages contains hardcoded copy. `grep` for literal text in `components/site` finds only fallback strings.

### Phase 5: SEO
- SEO panel on every page and post (counters, Google preview, social preview, checklist, JSON-LD selection).
- SEO Manager: status table, redirects CRUD (applied in `proxy.ts` from a cached list), robots editor, sitemap, default meta/OG, analytics IDs injected in the layout.

### Phase 6: Devotionals (Blog Engine)
- Post list with filters, the editor (Tiptap, featured image, excerpt, categories, tags, author, draft/scheduled/published, SEO), and preview.
- Public index (category filter, pagination) and the article page (related posts, Article JSON-LD).
- Seed all migrated devotionals and the legacy-URL redirects.

### Phase 7: Consultations & Booking Management
- Booking types, hosts, weekly availability, overrides/blackouts, and the slot engine with tests (DST, buffers, notice, caps, double-booking constraint).
- Public "Request a Consultation" page (the `booking` section): type → slot → intake → confirmation, plus the "request a time" fallback.
- Emails at every status change, with an .ics attachment and a signed reschedule/cancel link. Reminder cron (24 h / 2 h).
- Admin:
  - Consultation Requests queue (approve / decline / propose a time)
  - Booking Management calendar (day/week/month, drag to reschedule, filter by host and type) and list view
  - book on behalf of someone
- **Done when:** a visitor books a pastoral consultation, the pastor approves it from the queue, the visitor gets a confirmation with a calendar invite and a reminder, and can reschedule from the email link.

### Phase 8: People, Events, Subscribers, Users & Roles, Settings, Activity
- People profiles (linked enquiries, bookings, registrations, notes, GDPR export/delete).
- Events:
  - month and list views, create/edit/cancel, recurring services
  - registrations/RSVP with capacity, waitlist and check-in list (printable, or mobile check-in)
  - public `upcoming_events` section and event pages
- Subscribers list and CSV export.
- Users: full user management (section 5.3): invite, roles incl. Pastor/Staff, permission matrix, 2FA requirement, sessions, deactivate.
- Settings: site identity, contact, service times, socials, SMTP/Resend, notifications, analytics IDs, backup/export (JSON dump of the content tables).
- Activity Log: filterable by user, module and date.

### Phase 9: Content QA & launch
- Check every page against the old site, run Lighthouse and an accessibility pass, test the forms, check the redirects.
- Deploy to Vercel, move the domain off GoDaddy (DNS), submit the sitemap in Search Console.

## 11. Content migration (old site → seed)

Sources:
- `thelightcitychurch.org`: Home, About, Freedom from Religion, The Loved Circle, Contact Us, Partner with us, Privacy Policy, and the `dailylightdevotional` blog (about 50 posts in its RSS feed, possibly older ones too)
- the "Partner with TLCC" page is behind a member login. Get its content from the church.

Process:
1. Capture the text verbatim into `supabase/seed/pages/*.json` (section-shaped) and `supabase/seed/posts/*.json`. 11 devotionals are already in `src/data/blogs.json`.
2. `supabase/seed.ts` (idempotent upserts by slug) creates the pages, sections, the first published version, the globals (navbar, footer, site settings), the posts and the redirects, and uploads the images.
3. Replace placeholder content (the made-up testimonies, Unsplash stock photos) with real church content or remove it. Ask the church for real testimonies and photos.

Known facts to seed:
- Sundays 10:30am, Motorpoint Arena, Bolero Square, Nottingham NG1 1LA
- Pastors Ronnie & Annalene Dube
- mission: "We are passionate about empowering every man, woman, and child to live in the fulness of their inheritance in Christ."
- giving is through PayPal
- socials: Facebook, Instagram, X, YouTube (confirm the exact handles)

## 12. Open questions for the church / team

1. The Hueride Overview screenshot: share it so the admin can match it exactly.
2. Who are the admins, and which roles should they have?
3. "Appointments": are pastoral appointments needed, or just events?
4. Exact social handles, a contact email, and who should receive enquiry emails.
5. Giving: keep the PayPal links only, or add bank-transfer details or a provider like Stripe later?
6. Blog URL: `/devotionals` (recommended, matches the brand "Daily Light") or `/blog`.
7. Domain/DNS access (currently GoDaddy) for launch.
8. Booking: which pastors/staff take consultations, their weekly hours, which consultation types to offer, and whether each needs approval.
9. Is an online-meeting link (Zoom/Google Meet) needed for online consultations?

## 13. Suggested extras (prioritised)

The extras that make the most difference for a church website, beyond the original brief. **P1** is worth building in the phases above. **P2** comes after launch. **P3** is optional.

| Priority | Feature | Why | Where it fits |
|---|---|---|---|
| P1 | **Sermons & Media**: sermon library from YouTube (series, speaker, scripture, date, notes), auto-import from the church's YouTube channel, audio **podcast RSS feed** | The old site already has YouTube + a podcast; sermons are the most visited content on church sites | New CMS module + `sermons` section; after Phase 6 |
| P1 | **Announcement bar**: scheduled site-wide notice ("Venue change this Sunday", "Conference registration open") | Saves editing pages for short-term news | Globals; Phase 4 |
| P1 | **Live-stream banner**: "We're live now" with a link, toggled manually or by schedule | Sunday online viewers | Globals; Phase 4 |
| P1 | **Gift Aid + giving page**: keep PayPal, add a UK **Gift Aid declaration form** (stored with consent, CSV export for HMRC claims) | UK churches can reclaim 25% on eligible donations | Form Builder + Give page; Phase 2/4 |
| P1 | **Event registration**: RSVP, capacity, waitlist, check-in | Conferences and special services | Phase 8 (included above) |
| P1 | **WhatsApp click-to-chat** button (the old site has one) | Fastest way people contact the church | Settings + footer; Phase 4 |
| P2 | **Newsletter sending**: compose and send to subscribers from admin (Resend Broadcasts or Mailchimp sync), double opt-in, unsubscribe | Daily Light devotional by email | After launch |
| P2 | **Prayer team workflow**: assign prayer requests to the prayer team, "prayed for" status, optional reply to the requester | Turns the inbox into a ministry tool | Enquiries extension |
| P2 | **Volunteer sign-up & rota**: teams (worship, media, welcome), availability, monthly rota, email reminders | Common church need | New module |
| P2 | **Light Groups directory**: group, leader, day/time, online/in-person, "join this group" form | Old site mentions online Light Groups | `cards_grid` + form; or own module |
| P2 | **Admin analytics**: page views, top devotionals, form conversion (Vercel Analytics / GA4 API) | Shows the team what's working | Overview tab |
| P2 | **Notifications centre**: in-app bell with assignments, new bookings and mentions; email digest | Already in the top bar design | Phase 1 bell → real feed |
| P3 | **Public prayer wall** (moderated) | Community engagement | Later |
| P3 | **Member area**: members log in to see their bookings and registrations and update their details | Replaces the old GoDaddy "Sign in / Partner with TLCC" member pages | Later |
| P3 | **Multilingual content** | Only if the congregation needs it | Later |

**Always-on hygiene** (part of every phase):
- automated daily database backups (Supabase PITR) and the export in Settings
- error tracking (Sentry)
- uptime monitoring
- accessibility (WCAG AA)
- cookie consent banner (only if analytics or Meta Pixel are enabled)
- a short **admin user guide** page inside the dashboard, so church volunteers can edit content without help
