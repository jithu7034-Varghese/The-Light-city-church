-- Media library, page CMS (sections + versions), globals, devotionals, sermons, redirects

-- ---------- Media ----------
create table public.media_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.media_folders (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.media_folders (id) on delete set null,
  file_name text not null,
  storage_path text not null unique,
  mime text not null,
  size_bytes integer not null default 0,
  width integer,
  height integer,
  variants jsonb not null default '{}'::jsonb,   -- {"320": "path", "640": "path", ...}
  lqip text,                                      -- tiny blurred placeholder (data URL)
  alt text not null check (length(btrim(alt)) > 0),
  title text,
  caption text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index media_folder_idx on public.media (folder_id);

alter table public.profiles
  add constraint profiles_avatar_fk foreign key (avatar_media_id) references public.media (id) on delete set null;

-- Where each media item is used (rebuilt on every save of the owning entity)
create table public.media_usage (
  media_id uuid not null references public.media (id) on delete cascade,
  entity_type text not null check (entity_type in ('page', 'post', 'global', 'sermon', 'event', 'booking_type')),
  entity_id text not null,
  field_path text not null,
  primary key (media_id, entity_type, entity_id, field_path)
);
create index media_usage_entity_idx on public.media_usage (entity_type, entity_id);

-- ---------- Pages ----------
create type public.publish_status as enum ('draft', 'published');

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,          -- 'home', 'about', 'contact', ...
  title text not null,
  status public.publish_status not null default 'draft',
  has_unpublished_changes boolean not null default true,
  seo jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  published_at timestamptz,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Working draft sections
create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  type text not null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index page_sections_page_idx on public.page_sections (page_id, sort_order);

-- Immutable published snapshots / history
create table public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,               -- {"title", "seo", "sections": [{id,type,visible,data}]}
  note text,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (page_id, version)
);
create unique index page_versions_one_published on public.page_versions (page_id) where is_published;

-- ---------- Globals (navbar, footer, site settings, announcement bar) ----------
create table public.globals (
  key text primary key check (key in ('navbar', 'footer', 'site', 'announcement')),
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  has_unpublished_changes boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.global_versions (
  id uuid primary key default gen_random_uuid(),
  key text not null references public.globals (key) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (key, version)
);

-- ---------- Devotionals (blog) ----------
create type public.post_status as enum ('draft', 'scheduled', 'published');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  title text not null,
  content jsonb not null default '{"type": "doc", "content": []}'::jsonb,   -- Tiptap JSON
  excerpt text,
  featured_media_id uuid references public.media (id) on delete set null,
  author_name text not null default 'Pastor Ronnie Dube',
  author_id uuid references public.profiles (id) on delete set null,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  seo jsonb not null default '{}'::jsonb,
  legacy_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_schedule_needs_date check (status = 'draft' or published_at is not null)
);
create index posts_published_idx on public.posts (status, published_at desc);

create table public.post_categories (
  post_id uuid not null references public.posts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (post_id, category_id)
);

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ---------- Sermons ----------
create table public.sermons (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  title text not null,
  speaker text,
  series text,
  scripture text,
  preached_on date,
  youtube_id text,
  audio_url text,
  notes jsonb not null default '{"type": "doc", "content": []}'::jsonb,
  thumbnail_media_id uuid references public.media (id) on delete set null,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sermons_schedule_needs_date check (status = 'draft' or published_at is not null)
);

-- ---------- Redirects ----------
create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (from_path like '/%'),
  to_path text not null,
  status_code integer not null default 301 check (status_code in (301, 302, 307, 308)),
  hits integer not null default 0,
  last_hit_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Publishing functions (atomic, permission-checked) ----------
create or replace function public.publish_page(p_page_id uuid, p_note text default null)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_version integer;
  v_snapshot jsonb;
begin
  if auth.uid() is not null and not public.has_permission('pages', 'publish') then
    raise exception 'Not allowed to publish pages';
  end if;

  select jsonb_build_object(
    'title', p.title,
    'seo', p.seo,
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'type', s.type, 'visible', s.visible, 'data', s.data)
                       order by s.sort_order)
      from public.page_sections s where s.page_id = p.id
    ), '[]'::jsonb)
  ) into v_snapshot
  from public.pages p where p.id = p_page_id;

  if v_snapshot is null then
    raise exception 'Page not found';
  end if;

  select coalesce(max(version), 0) + 1 into v_version from public.page_versions where page_id = p_page_id;

  update public.page_versions set is_published = false where page_id = p_page_id and is_published;
  insert into public.page_versions (page_id, version, snapshot, note, is_published, created_by)
  values (p_page_id, v_version, v_snapshot, p_note, true, auth.uid());

  update public.pages
     set status = 'published', has_unpublished_changes = false, published_at = now(), updated_by = auth.uid()
   where id = p_page_id;

  return v_version;
end $$;

-- Copy a version back into the working draft (does not publish)
create or replace function public.restore_page_version(p_version_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_page_id uuid;
  v_snapshot jsonb;
begin
  if auth.uid() is not null and not public.has_permission('pages', 'edit') then
    raise exception 'Not allowed to edit pages';
  end if;

  select page_id, snapshot into v_page_id, v_snapshot from public.page_versions where id = p_version_id;
  if v_page_id is null then
    raise exception 'Version not found';
  end if;

  delete from public.page_sections where page_id = v_page_id;
  insert into public.page_sections (page_id, type, sort_order, visible, data)
  select v_page_id, s ->> 'type', (ord - 1)::int, coalesce((s ->> 'visible')::boolean, true), coalesce(s -> 'data', '{}'::jsonb)
  from jsonb_array_elements(v_snapshot -> 'sections') with ordinality as t(s, ord);

  update public.pages
     set title = coalesce(v_snapshot ->> 'title', title),
         seo = coalesce(v_snapshot -> 'seo', seo),
         has_unpublished_changes = true,
         updated_by = auth.uid()
   where id = v_page_id;
end $$;

create or replace function public.publish_global(p_key text)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_version integer;
  v_draft jsonb;
  v_module text := case when p_key = 'site' then 'settings' else 'globals' end;
begin
  if auth.uid() is not null and not public.has_permission(v_module, 'publish') then
    raise exception 'Not allowed to publish %', p_key;
  end if;

  select draft into v_draft from public.globals where key = p_key;
  if v_draft is null then
    raise exception 'Global not found';
  end if;

  select coalesce(max(version), 0) + 1 into v_version from public.global_versions where key = p_key;
  insert into public.global_versions (key, version, snapshot, created_by) values (p_key, v_version, v_draft, auth.uid());
  update public.globals
     set published = v_draft, has_unpublished_changes = false, published_at = now(), updated_by = auth.uid()
   where key = p_key;
  return v_version;
end $$;

-- Mark page as changed whenever its draft sections change
create or replace function public.touch_page_from_section()
returns trigger language plpgsql as $$
begin
  update public.pages set has_unpublished_changes = true, updated_at = now()
   where id = coalesce(new.page_id, old.page_id);
  return null;
end $$;

create trigger page_sections_touch_page
  after insert or update or delete on public.page_sections
  for each row execute function public.touch_page_from_section();
