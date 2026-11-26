-- Consultation requests & booking management

create table public.booking_types (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  description text,
  duration_min integer not null default 30 check (duration_min between 5 and 480),
  buffer_min integer not null default 10 check (buffer_min between 0 and 240),
  -- [{"kind": "in_person"|"online"|"phone", "detail": "Motorpoint Arena ..."}]
  locations jsonb not null default '[{"kind": "in_person"}]'::jsonb,
  requires_approval boolean not null default true,
  intake_form_id uuid references public.forms (id) on delete set null,
  min_notice_hours integer not null default 24 check (min_notice_hours >= 0),
  max_days_ahead integer not null default 60 check (max_days_ahead > 0),
  daily_cap integer check (daily_cap is null or daily_cap > 0),
  color text not null default '#3B82F6',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_type_hosts (
  booking_type_id uuid not null references public.booking_types (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (booking_type_id, user_id)
);

-- Weekly working hours per host (Europe/London local time)
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index availability_rules_user_idx on public.availability_rules (user_id, weekday);

-- Date-specific changes; user_id null = applies to everyone (church holiday)
create table public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  date date not null,
  is_blackout boolean not null default true,
  start_time time,
  end_time time,
  reason text,
  check (is_blackout or (start_time is not null and end_time is not null and end_time > start_time))
);
create index availability_overrides_date_idx on public.availability_overrides (date);

create type public.booking_status as enum
  ('requested', 'confirmed', 'rescheduled', 'cancelled', 'declined', 'completed', 'no_show');
create type public.location_kind as enum ('in_person', 'online', 'phone');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_type_id uuid not null references public.booking_types (id) on delete restrict,
  host_id uuid references public.profiles (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  name text not null,
  email citext not null,
  phone text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location_kind public.location_kind not null default 'in_person',
  location_detail text,            -- address, meeting link or phone number
  status public.booking_status not null default 'requested',
  intake jsonb not null default '{}'::jsonb,
  manage_token_hash text,          -- sha256 of the reschedule/cancel token
  reminder_24h_sent_at timestamptz,
  reminder_2h_sent_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- A host is assigned when the request is made, so the overlap guard below always applies
  constraint bookings_active_needs_host check (status not in ('requested', 'confirmed', 'rescheduled') or host_id is not null),
  -- No double-booking a host while a booking is active
  constraint bookings_no_overlap exclude using gist (
    host_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('requested', 'confirmed', 'rescheduled'))
);
create index bookings_starts_idx on public.bookings (starts_at);
create index bookings_status_idx on public.bookings (status);

create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,   -- null = the visitor / system
  from_status public.booking_status,
  to_status public.booking_status not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.enquiries
  add constraint enquiries_booking_fk foreign key (booking_id) references public.bookings (id) on delete set null;

-- Record every status change automatically
create or replace function public.log_booking_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.booking_events (booking_id, actor_id, from_status, to_status)
    values (new.id, auth.uid(), case when tg_op = 'UPDATE' then old.status end, new.status);
  end if;
  return new;
end $$;

create trigger bookings_status_log
  after insert or update of status on public.bookings
  for each row execute function public.log_booking_status();
