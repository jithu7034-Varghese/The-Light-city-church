-- Core: extensions, roles, profiles, permissions, activity log
create extension if not exists citext;
create extension if not exists btree_gist;

create type public.app_role as enum ('super_admin', 'admin', 'pastor', 'editor', 'viewer');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Profiles (one per auth user)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext,
  full_name text not null default '',
  avatar_media_id uuid,
  role public.app_role not null default 'viewer',
  is_active boolean not null default false,
  require_mfa boolean not null default false,
  notification_prefs jsonb not null default '{"new_enquiry": true, "new_booking": true, "assignment": true}'::jsonb,
  signature text,
  timezone text not null default 'Europe/London',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Per-module permission matrix
create table public.role_permissions (
  role public.app_role not null,
  module text not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  can_publish boolean not null default false,
  can_delete boolean not null default false,
  can_sensitive boolean not null default false,
  primary key (role, module)
);

-- True only for requests made with the service-role key (seed script, server-side jobs).
-- Never infer "trusted" from a missing user: anonymous API calls also have no user.
create or replace function public.is_service_role()
returns boolean
language sql stable
as $$
  -- coalesce(..., false): with no JWT at all this must be FALSE, never NULL
  -- (NULL would make "not is_service_role()" NULL and silently skip permission checks)
  select coalesce(
    coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
    ) = 'service_role',
    false);
$$;

-- Permission check used by every RLS policy (mirrored in src/lib/auth/permissions.ts)
create or replace function public.has_permission(p_module text, p_action text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and p.role = 'super_admin'
  ) or coalesce((
    select case p_action
      when 'view' then rp.can_view
      when 'edit' then rp.can_edit
      when 'publish' then rp.can_publish
      when 'delete' then rp.can_delete
      when 'sensitive' then rp.can_sensitive
      else false end
    from public.profiles p
    join public.role_permissions rp on rp.role = p.role
    where p.id = auth.uid() and p.is_active and rp.module = p_module
  ), false);
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active);
$$;

-- Create a profile when an auth user is created.
-- Only admin invites (server-side, service role) set app_metadata.role. Anyone else who
-- manages to create an account gets an INACTIVE profile with no access at all.
-- (Public sign-up is also disabled in supabase/config.toml and the dashboard.)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_role public.app_role := (new.raw_app_meta_data ->> 'role')::public.app_role;
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(v_role, 'viewer'),
    v_role is not null
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stop users changing their own role/active flag; only super admins can grant super_admin
create or replace function public.guard_profile_changes()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if public.is_service_role() or (auth.uid() is null and session_user in ('postgres', 'supabase_admin')) then
    return new; -- server-side jobs, migrations
  end if;
  if auth.uid() is null then
    raise exception 'Not allowed';
  end if;
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active
      or new.require_mfa is distinct from old.require_mfa) then
    if not public.has_permission('users', 'edit') then
      raise exception 'Not allowed to change role or status';
    end if;
    if new.id = auth.uid() then
      raise exception 'You cannot change your own role or status';
    end if;
    if (new.role = 'super_admin' or old.role = 'super_admin')
       and not exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin') then
      raise exception 'Only a super admin can grant or remove super admin';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- Activity log (append-only)
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,          -- create | update | delete | publish | restore | login | ...
  module text not null,
  entity_type text not null,
  entity_id text,
  summary text not null default '',
  diff jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_created_idx on public.activity_log (created_at desc);
create index activity_log_actor_idx on public.activity_log (actor_id);

-- Default permission matrix (editable later in Users & Roles)
insert into public.role_permissions (role, module, can_view, can_edit, can_publish, can_delete, can_sensitive)
select r.role::public.app_role, m.module,
  case
    when r.role = 'admin' then true
    when r.role = 'pastor' then m.module in ('enquiries','forms','bookings','contacts','events','subscribers','posts','sermons','media')
    when r.role = 'editor' then m.module in ('pages','globals','posts','sermons','media','seo','events')
    when r.role = 'viewer' then m.module in ('enquiries','contacts','events','bookings','pages','globals','posts','sermons','media','seo')
  end,
  case
    when r.role = 'admin' then m.module not in ('users')
    when r.role = 'pastor' then m.module in ('enquiries','bookings','contacts','events','posts','sermons','media')
    when r.role = 'editor' then m.module in ('pages','globals','posts','sermons','media','seo','events')
    else false
  end,
  case
    when r.role = 'admin' then true
    when r.role = 'pastor' then m.module in ('posts','sermons')
    when r.role = 'editor' then m.module in ('pages','globals','posts','sermons','seo')
    else false
  end,
  case
    when r.role = 'admin' then m.module not in ('users','activity')
    when r.role = 'editor' then m.module in ('posts','sermons','media')
    else false
  end,
  r.role in ('admin', 'pastor')
from (values ('admin'), ('pastor'), ('editor'), ('viewer')) as r(role)
cross join (values
  ('enquiries'), ('forms'), ('bookings'), ('contacts'), ('events'), ('subscribers'),
  ('pages'), ('globals'), ('posts'), ('sermons'), ('media'), ('seo'),
  ('email_templates'), ('users'), ('settings'), ('activity')
) as m(module);
