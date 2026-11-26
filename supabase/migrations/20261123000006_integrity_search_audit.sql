-- Integrity, audit, search and rate limiting — enforced in the database, not left to app code

-- ---------- Media usage is DERIVED from stored content ----------
-- Convention: every media reference inside JSON content is an object containing "mediaId": "<uuid>".
-- Usage rows are rebuilt by triggers whenever the owning content changes, so they cannot drift.
create or replace function public.extract_media_ids(doc jsonb)
returns setof uuid
language sql immutable
as $$
  select distinct (v #>> '{}')::uuid
  from jsonb_path_query(coalesce(doc, '{}'::jsonb), 'lax $.**.mediaId') as v
  where jsonb_typeof(v) = 'string'
    and (v #>> '{}') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

create or replace function public.sync_media_usage(p_entity_type text, p_entity_id text, p_field text, p_doc jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.media_usage
   where entity_type = p_entity_type and entity_id = p_entity_id and field_path = p_field;
  insert into public.media_usage (media_id, entity_type, entity_id, field_path)
  select m.id, p_entity_type, p_entity_id, p_field
  from public.extract_media_ids(p_doc) as ids(id)
  join public.media m on m.id = ids.id
  on conflict do nothing;
end $$;

create or replace function public.media_usage_from_page_sections()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_page uuid := coalesce(new.page_id, old.page_id);
begin
  -- one usage set per page draft, plus the currently published snapshot
  perform public.sync_media_usage('page', v_page::text, 'draft',
    (select coalesce(jsonb_agg(data), '[]'::jsonb) from public.page_sections where page_id = v_page));
  return null;
end $$;
create trigger page_sections_media_usage
  after insert or update or delete on public.page_sections
  for each row execute function public.media_usage_from_page_sections();

create or replace function public.media_usage_from_page_versions()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.is_published then
    perform public.sync_media_usage('page', new.page_id::text, 'published', new.snapshot);
  end if;
  return null;
end $$;
create trigger page_versions_media_usage
  after insert or update of is_published on public.page_versions
  for each row execute function public.media_usage_from_page_versions();

create or replace function public.media_usage_from_globals()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.sync_media_usage('global', new.key, 'draft', new.draft);
  perform public.sync_media_usage('global', new.key, 'published', new.published);
  return null;
end $$;
create trigger globals_media_usage
  after insert or update on public.globals
  for each row execute function public.media_usage_from_globals();

create or replace function public.media_usage_from_posts()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.sync_media_usage('post', new.id::text, 'content',
    jsonb_build_object('content', new.content, 'featured', jsonb_build_object('mediaId', new.featured_media_id),
                       'og', new.seo));
  return null;
end $$;
create trigger posts_media_usage
  after insert or update on public.posts
  for each row execute function public.media_usage_from_posts();

create or replace function public.media_usage_from_sermons()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.sync_media_usage('sermon', new.id::text, 'content',
    jsonb_build_object('notes', new.notes, 'thumb', jsonb_build_object('mediaId', new.thumbnail_media_id), 'og', new.seo));
  return null;
end $$;
create trigger sermons_media_usage
  after insert or update on public.sermons
  for each row execute function public.media_usage_from_sermons();

-- Clean usage rows when the owner is deleted
create or replace function public.media_usage_cleanup()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  delete from public.media_usage where entity_type = tg_argv[0] and entity_id = old.id::text;
  return null;
end $$;
create trigger pages_media_cleanup after delete on public.pages
  for each row execute function public.media_usage_cleanup('page');
create trigger posts_media_cleanup after delete on public.posts
  for each row execute function public.media_usage_cleanup('post');
create trigger sermons_media_cleanup after delete on public.sermons
  for each row execute function public.media_usage_cleanup('sermon');

-- Block deleting media that is still in use (the UI shows where it is used)
create or replace function public.prevent_delete_used_media()
returns trigger language plpgsql
as $$
begin
  if exists (select 1 from public.media_usage where media_id = old.id) then
    raise exception 'Image is still used on % place(s). Replace it there first.',
      (select count(*) from public.media_usage where media_id = old.id)
      using errcode = 'P0001', hint = 'media_in_use';
  end if;
  return old;
end $$;
create trigger media_prevent_delete_used
  before delete on public.media
  for each row execute function public.prevent_delete_used_media();

-- ---------- Audit trail via triggers (cannot be skipped by any code path) ----------
create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_diff jsonb;
  v_id text := coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'key', v_old ->> 'key');
begin
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('from', v_old -> k, 'to', v_new -> k))
      into v_diff
      from jsonb_object_keys(v_new) as k
     where k not in ('updated_at', 'editing_heartbeat_at', 'editing_by', 'last_seen_at')
       and (v_new -> k) is distinct from (v_old -> k)
       and k not in ('content', 'data', 'draft', 'published', 'snapshot', 'notes', 'body');  -- big blobs: record key only
    if v_diff is null then
      return null;  -- nothing meaningful changed
    end if;
  end if;

  insert into public.activity_log (actor_id, action, module, entity_type, entity_id, summary, diff)
  values (
    auth.uid(),
    lower(tg_op),
    tg_argv[0],
    tg_table_name,
    v_id,
    coalesce(v_new ->> 'title', v_new ->> 'name', v_new ->> 'slug', v_old ->> 'title', v_old ->> 'name', ''),
    v_diff
  );
  return null;
end $$;

do $$
declare r record;
begin
  for r in select * from (values
    ('pages', 'pages'), ('globals', 'globals'), ('posts', 'posts'), ('sermons', 'sermons'),
    ('media', 'media'), ('forms', 'forms'), ('booking_types', 'bookings'), ('events', 'events'),
    ('redirects', 'seo'), ('email_templates', 'email_templates'),
    ('profiles', 'users'), ('role_permissions', 'users'), ('contacts', 'contacts')
  ) as t(tbl, module)
  loop
    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.audit_row_change(%2$L)',
      r.tbl, r.module);
  end loop;
end $$;

-- enquiries: only status / assignment changes and deletes are audited (not the private message body)
create or replace function public.audit_enquiry_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.activity_log (actor_id, action, module, entity_type, entity_id, summary)
    values (auth.uid(), 'delete', 'enquiries', 'enquiries', old.id::text, coalesce(old.type, ''));
  elsif new.status is distinct from old.status or new.assigned_to is distinct from old.assigned_to then
    insert into public.activity_log (actor_id, action, module, entity_type, entity_id, summary, diff)
    values (auth.uid(), 'update', 'enquiries', 'enquiries', new.id::text, coalesce(new.type, ''),
      jsonb_build_object('status', jsonb_build_object('from', old.status, 'to', new.status),
                         'assigned_to', jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to)));
  end if;
  return null;
end $$;
create trigger audit_enquiries after update or delete on public.enquiries
  for each row execute function public.audit_enquiry_change();

-- ---------- Full-text search (admin global search) ----------
alter table public.enquiries add column search tsvector generated always as (
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(email::text, '') || ' ' || coalesce(phone, '') || ' ' ||
                        coalesce(data ->> 'message', '') || ' ' || coalesce(data ->> 'subject', ''))
) stored;
create index enquiries_search_idx on public.enquiries using gin (search);

alter table public.contacts add column search tsvector generated always as (
  to_tsvector('simple', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' ||
                        coalesce(email::text, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(city, ''))
) stored;
create index contacts_search_idx on public.contacts using gin (search);

alter table public.posts add column search tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
) stored;
create index posts_search_idx on public.posts using gin (search);

create index bookings_name_email_idx on public.bookings (lower(name), email);

-- ---------- Rate limiting for public forms and booking requests ----------
create table public.rate_limits (
  key text not null,              -- e.g. 'form:prayer:<ip_hash>'
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;   -- no policies: service role only

-- Returns true if the request is allowed. Called only from server code with the service role.
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  if not public.is_service_role() then
    raise exception 'Not allowed';
  end if;
  insert into public.rate_limits (key, window_start) values (p_key, v_window)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_hits <= p_max;
end $$;

revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.sync_media_usage(text, text, text, jsonb) from public, anon, authenticated;
