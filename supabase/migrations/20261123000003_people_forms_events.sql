-- People, form builder + enquiries inbox, subscribers, events + registrations, email

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null default '',
  last_name text not null default '',
  email citext unique,
  phone text,
  city text,
  address text,
  tags text[] not null default '{}',
  notes text,
  consent_marketing boolean not null default false,
  joined_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_name_idx on public.contacts (last_name, first_name);

create table public.contact_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Form builder: forms are data
create table public.forms (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  enquiry_type text not null,     -- prayer | testimony | contact | get_involved | salvation | loved_circle | consultation | volunteer | gift_aid | newsletter
  fields jsonb not null default '[]'::jsonb,
  -- {recipients: [], auto_reply: {enabled, template_key}, success_message, redirect_url, turnstile, retention_days, sensitive}
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.enquiry_status as enum ('unread', 'read', 'follow_up', 'closed');

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.forms (id) on delete set null,
  type text not null,
  name text,
  email citext,
  phone text,
  data jsonb not null default '{}'::jsonb,
  status public.enquiry_status not null default 'unread',
  assigned_to uuid references public.profiles (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  booking_id uuid,                 -- FK added in bookings migration
  source_page text,
  consent boolean not null default false,
  is_sensitive boolean not null default false,
  ip_hash text,
  expires_at timestamptz,          -- GDPR retention; cleared by cron
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_status_idx on public.enquiries (status, created_at desc);
create index enquiries_form_idx on public.enquiries (form_id, created_at desc);
create index enquiries_assigned_idx on public.enquiries (assigned_to);

create table public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  name text,
  source text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Events (services, conferences, Light Groups)
create type public.event_kind as enum ('service', 'conference', 'group', 'other');
create type public.event_status as enum ('scheduled', 'completed', 'cancelled', 'rescheduled');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  title text not null,
  kind public.event_kind not null default 'other',
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  description jsonb not null default '{"type": "doc", "content": []}'::jsonb,
  cover_media_id uuid references public.media (id) on delete set null,
  status public.event_status not null default 'scheduled',
  recurrence_rule text,            -- RFC 5545 RRULE, e.g. FREQ=WEEKLY;BYDAY=SU
  is_public boolean not null default true,
  registration_enabled boolean not null default false,
  capacity integer check (capacity is null or capacity > 0),
  waitlist_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at >= starts_at)
);
create index events_starts_idx on public.events (starts_at);

create type public.registration_status as enum ('registered', 'waitlisted', 'cancelled', 'attended');

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  name text not null,
  email citext not null,
  guests integer not null default 0 check (guests >= 0),
  status public.registration_status not null default 'registered',
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);

-- Email templates + log
create table public.email_templates (
  key text primary key,
  name text not null,
  subject text not null,
  body text not null,              -- HTML/markdown with {{variables}}
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  to_email citext not null,
  template_key text,
  entity_type text,
  entity_id text,
  status text not null default 'queued',   -- queued | sent | failed
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
create index email_log_created_idx on public.email_log (created_at desc);
