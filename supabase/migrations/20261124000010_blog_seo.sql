-- Devotionals upgrade + per-item SEO fields.
--
-- Categories: the many-to-many already exists (public.categories + public.post_categories,
-- with RLS under the 'posts' module since migration 05), so this migration reuses it instead
-- of creating a second, parallel pair of tables. It adds an audit trigger to categories so
-- category add/rename/delete is logged by the database.
--
-- posts.author_id used to point at the staff profile that created the post. It is renamed to
-- created_by, and author_id now points at the new public.authors table (the byline shown on
-- the site). Existing bylines (posts.author_name) are turned into authors and linked.
--
-- SEO: seo_title / seo_description / seo_keywords / seo_image_url on posts and pages. The
-- old seo jsonb values are copied in. Pages keep going through publish_page(): the snapshot's
-- "seo" object is now built from these columns, so SEO edits go live when the page is published.

-- ---------- Authors ----------
create table public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  position text check (position is null or length(position) <= 120),
  photo_media_id uuid references public.media (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.authors
  for each row execute function public.set_updated_at();

-- ---------- Posts ----------
alter table public.posts rename column author_id to created_by;
alter table public.posts rename constraint posts_author_id_fkey to posts_created_by_fkey;

alter table public.posts
  add column author_id uuid references public.authors (id) on delete set null,
  add column updated_display_at timestamptz,
  add column seo_title text check (seo_title is null or length(seo_title) <= 120),
  add column seo_description text check (seo_description is null or length(seo_description) <= 320),
  add column seo_keywords text check (seo_keywords is null or length(seo_keywords) <= 500),
  add column seo_image_url text check (seo_image_url is null or (length(seo_image_url) <= 1000 and seo_image_url ~ '^(https?://|/)'));
create index posts_author_idx on public.posts (author_id);

-- Existing bylines become authors (one per distinct name) and are linked.
insert into public.authors (name)
select distinct btrim(author_name) from public.posts where btrim(coalesce(author_name, '')) <> '';
update public.posts p set author_id = a.id from public.authors a where a.name = btrim(p.author_name);

update public.posts set
  seo_title = nullif(btrim(seo ->> 'title'), ''),
  seo_description = nullif(btrim(seo ->> 'description'), '')
where seo <> '{}'::jsonb;

-- ---------- Pages ----------
alter table public.pages
  add column seo_title text check (seo_title is null or length(seo_title) <= 120),
  add column seo_description text check (seo_description is null or length(seo_description) <= 320),
  add column seo_keywords text check (seo_keywords is null or length(seo_keywords) <= 500),
  add column seo_image_url text check (seo_image_url is null or (length(seo_image_url) <= 1000 and seo_image_url ~ '^(https?://|/)'));

update public.pages set
  seo_title = nullif(btrim(seo ->> 'title'), ''),
  seo_description = nullif(btrim(seo ->> 'description'), '')
where seo <> '{}'::jsonb;

-- Same function as migration 02, except the snapshot's seo now comes from the seo_* columns.
create or replace function public.publish_page(p_page_id uuid, p_note text default null)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_version integer;
  v_snapshot jsonb;
begin
  if not public.is_service_role() and not public.has_permission('pages', 'publish') then
    raise exception 'Not allowed to publish pages';
  end if;

  select jsonb_build_object(
    'title', p.title,
    'seo', jsonb_strip_nulls(jsonb_build_object(
      'title', p.seo_title, 'description', p.seo_description, 'keywords', p.seo_keywords, 'image', p.seo_image_url)),
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'type', s.type, 'schema_version', s.schema_version, 'visible', s.visible, 'data', s.data)
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
revoke execute on function public.publish_page(uuid, text) from public, anon;

-- ---------- RLS ----------
alter table public.authors enable row level security;
create policy staff_select on public.authors for select to authenticated using ((select public.has_permission('posts', 'view')));
create policy staff_insert on public.authors for insert to authenticated with check ((select public.has_permission('posts', 'edit')));
create policy staff_update on public.authors for update to authenticated
  using ((select public.has_permission('posts', 'edit'))) with check ((select public.has_permission('posts', 'edit')));
create policy staff_delete on public.authors for delete to authenticated using ((select public.has_permission('posts', 'delete')));
-- Visitors see an author only while they have a live devotional.
create policy public_read on public.authors for select to anon, authenticated using (
  exists (
    select 1 from public.posts p
    where p.author_id = authors.id
      and (p.status = 'published' or (p.status = 'scheduled' and p.published_at <= now()))
  )
);
revoke insert, update, delete on public.authors from anon;

-- ---------- Audit (so the admin actions don't need logActivity for these) ----------
create trigger audit_authors after insert or update or delete on public.authors
  for each row execute function public.audit_row_change('posts');
create trigger audit_categories after insert or update or delete on public.categories
  for each row execute function public.audit_row_change('posts');
