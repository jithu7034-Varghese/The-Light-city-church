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
        enquiries/  contacts/  events/
        pages/[slug]/           # section-based page editor
        navbar/  footer/
        devotionals/  media/  seo/
        users/  settings/  activity/
    api/
      preview/route.ts          # enables draftMode for live preview
      revalidate/route.ts       # optional webhook
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
| INFORMATION · Form Inquiries | **PEOPLE · Enquiries & Prayer**: all public form submissions, typed: Prayer request, Testimony, Get involved / Volunteer, Contact, Salvation decision (Freedom from Religion), Loved Circle sign-up |
| Clients | **People**: members and contacts (a profile with linked enquiries, events and notes) |
| Appointments | **Events & Appointments**: Sunday services, conferences, Light Groups, and pastoral appointments linked to a person |
| *(new)* | **Subscribers**: devotional/newsletter sign-ups, CSV export |
| CONTENT MANAGEMENT | Navbar, **Home, About, Ministries, Gallery, Freedom from Religion, The Loved Circle, Give & Partner, Contact**, Footer, **Devotionals** (Blog Engine), Media Library, SEO Manager |
| SYSTEM | Users & Roles, Settings, Activity Log |
| Footer of sidebar | Light Mode toggle, Sign Out |

Pages are rows in the `pages` table, so the sidebar's page list is generated. Adding a page in the CMS adds it to the sidebar.

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
- `role_permissions` (role, module, can_view, can_edit, can_publish, can_delete). Modules: `enquiries, contacts, events, subscribers, pages, globals, posts, media, seo, users, settings, activity`
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

**People & forms**
- `enquiries` (type, name, email, phone, city, subject, message, interest, status `unread|read|follow_up|closed`, contact_id, source_page, consent bool, meta jsonb, ip_hash)
- `enquiry_notes` (enquiry_id, author_id, body)
- `contacts` (first_name, last_name, email unique, phone, city, address, tags text[], notes, joined_at, consent_marketing)
- `contact_notes` (contact_id, author_id, body)
- `events` (title, kind `service|conference|group|appointment|other`, starts_at, ends_at, all_day, location, description, contact_id null, status `scheduled|completed|cancelled|rescheduled`, recurrence_rule null)
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
| `prayer_form` / `contact_form` / `signup_form` | heading, intro, which fields, enquiry type, success message | Contact, Freedom from Religion, Loved Circle, Home |
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

Each phase is one Claude Code session or a few. Commit at the end of each one.

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

### Phase 2: Overview + Enquiries
- Public forms (prayer, contact, get involved, salvation, Loved Circle, newsletter) are wired to a Server Action that validates, checks Turnstile, inserts the row and emails the configured recipients.
- Enquiries list:
  - search, filters (type, status, date range)
  - detail drawer, internal notes
  - status changes, convert to person, delete, CSV export
- Overview:
  - 4 stat cards (Total Enquiries, Unread, Published Devotionals, Published Pages)
  - Growth Trajectory chart (7/30/90 days)
  - Action Items generated from real data: unread enquiries, events in the next 7 days, pages/posts missing SEO fields, media without alt text
  - Recent Enquiries table
- **Done when:** submitting the live contact form shows up on the Overview within seconds and sends an email.

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

### Phase 7: People, Events, Subscribers, Users & Roles, Settings, Activity
- People profiles (linked enquiries, events, notes, GDPR export/delete).
- Events: month and list views, create/edit/reschedule/cancel, link to a person. Public "Upcoming events" section type.
- Subscribers list and CSV export.
- Users: invite, edit role, deactivate. Per-module permission matrix editor (Super Admin only).
- Settings: site identity, contact, service times, socials, SMTP/Resend, notifications, analytics IDs, backup/export (JSON dump of the content tables).
- Activity Log: filterable by user, module and date.

### Phase 8: Content QA & launch
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
