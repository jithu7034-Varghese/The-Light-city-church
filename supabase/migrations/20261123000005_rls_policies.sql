-- Row Level Security, public (anon) read access, updated_at triggers, storage bucket
--
-- Model:
--   * Staff (authenticated + active profile) access is governed by has_permission(module, action).
--   * The public site reads ONLY published content. It never writes directly: public form
--     submissions and bookings go through Server Actions that use the service role after
--     validation, Turnstile and rate limiting.

-- ---------- updated_at triggers on every table that has the column ----------
do $$
declare r record;
begin
  for r in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      r.table_name);
  end loop;
end $$;

-- ---------- Generic staff policies: table -> permission module ----------
do $$
declare r record;
begin
  for r in select * from (values
    ('media_folders', 'media'), ('media', 'media'), ('media_usage', 'media'),
    ('pages', 'pages'), ('page_sections', 'pages'), ('page_versions', 'pages'),
    ('global_versions', 'globals'),
    ('categories', 'posts'), ('tags', 'posts'), ('posts', 'posts'),
    ('post_categories', 'posts'), ('post_tags', 'posts'),
    ('sermons', 'sermons'),
    ('redirects', 'seo'),
    ('contacts', 'contacts'), ('contact_notes', 'contacts'),
    ('forms', 'forms'),
    ('enquiry_notes', 'enquiries'),
    ('subscribers', 'subscribers'),
    ('events', 'events'), ('event_registrations', 'events'),
    ('email_templates', 'email_templates'), ('email_log', 'email_templates'),
    ('booking_types', 'bookings'), ('booking_type_hosts', 'bookings'),
    ('availability_rules', 'bookings'), ('availability_overrides', 'bookings'),
    ('booking_events', 'bookings')
  ) as t(tbl, module)
  loop
    execute format('alter table public.%I enable row level security', r.tbl);
    execute format('create policy staff_select on public.%I for select to authenticated using (public.has_permission(%L, ''view''))', r.tbl, r.module);
    execute format('create policy staff_insert on public.%I for insert to authenticated with check (public.has_permission(%L, ''edit''))', r.tbl, r.module);
    execute format('create policy staff_update on public.%I for update to authenticated using (public.has_permission(%L, ''edit'')) with check (public.has_permission(%L, ''edit''))', r.tbl, r.module, r.module);
    execute format('create policy staff_delete on public.%I for delete to authenticated using (public.has_permission(%L, ''delete''))', r.tbl, r.module);
  end loop;
end $$;

-- Hosts manage their own working hours and see their own booking history
create policy own_availability on public.availability_rules
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_overrides on public.availability_overrides
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Profiles ----------
alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());          -- staff can see colleagues (names for assignment)
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid()); -- role/status changes blocked by trigger
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.has_permission('users', 'edit')) with check (public.has_permission('users', 'edit'));
create policy profiles_delete_admin on public.profiles for delete to authenticated
  using (public.has_permission('users', 'delete'));

-- ---------- Role permissions (only super admins change the matrix) ----------
alter table public.role_permissions enable row level security;
create policy role_permissions_select on public.role_permissions for select to authenticated using (public.is_staff());
create policy role_permissions_write on public.role_permissions for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_active and role = 'super_admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_active and role = 'super_admin'));

-- ---------- Activity log (append-only) ----------
alter table public.activity_log enable row level security;
create policy activity_select on public.activity_log for select to authenticated using (public.has_permission('activity', 'view'));
create policy activity_insert on public.activity_log for insert to authenticated with check (actor_id = auth.uid() and public.is_staff());

-- ---------- Globals (site settings use the 'settings' module) ----------
alter table public.globals enable row level security;
create policy globals_staff_select on public.globals for select to authenticated
  using (public.has_permission(case when key = 'site' then 'settings' else 'globals' end, 'view'));
create policy globals_staff_update on public.globals for update to authenticated
  using (public.has_permission(case when key = 'site' then 'settings' else 'globals' end, 'edit'))
  with check (public.has_permission(case when key = 'site' then 'settings' else 'globals' end, 'edit'));

-- ---------- Enquiries: sensitive (prayer) gating + assigned staff ----------
alter table public.enquiries enable row level security;
create policy enquiries_select on public.enquiries for select to authenticated using (
  (public.has_permission('enquiries', 'view') and (not is_sensitive or public.has_permission('enquiries', 'sensitive')))
  or assigned_to = auth.uid()
);
create policy enquiries_update on public.enquiries for update to authenticated
  using (public.has_permission('enquiries', 'edit') or assigned_to = auth.uid())
  with check (public.has_permission('enquiries', 'edit') or assigned_to = auth.uid());
create policy enquiries_delete on public.enquiries for delete to authenticated
  using (public.has_permission('enquiries', 'delete'));

-- ---------- Bookings: permission or own (host) ----------
alter table public.bookings enable row level security;
create policy bookings_select on public.bookings for select to authenticated
  using (public.has_permission('bookings', 'view') or host_id = auth.uid());
create policy bookings_insert on public.bookings for insert to authenticated
  with check (public.has_permission('bookings', 'edit'));
create policy bookings_update on public.bookings for update to authenticated
  using (public.has_permission('bookings', 'edit') or host_id = auth.uid())
  with check (public.has_permission('bookings', 'edit') or host_id = auth.uid());
create policy bookings_delete on public.bookings for delete to authenticated
  using (public.has_permission('bookings', 'delete'));

-- ---------- Public read access (anon + authenticated) ----------
create policy public_read on public.media for select to anon, authenticated using (true);
create policy public_read on public.pages for select to anon, authenticated using (status = 'published');
create policy public_read on public.page_versions for select to anon, authenticated using (is_published);
create policy public_read on public.globals for select to anon, authenticated using (true);
create policy public_read on public.categories for select to anon, authenticated using (true);
create policy public_read on public.tags for select to anon, authenticated using (true);
create policy public_read on public.post_categories for select to anon, authenticated using (true);
create policy public_read on public.post_tags for select to anon, authenticated using (true);
create policy public_read on public.posts for select to anon, authenticated using (
  status = 'published' or (status = 'scheduled' and published_at <= now())
);
create policy public_read on public.sermons for select to anon, authenticated using (
  status = 'published' or (status = 'scheduled' and published_at <= now())
);
create policy public_read on public.redirects for select to anon, authenticated using (true);
create policy public_read on public.events for select to anon, authenticated using (is_public);
create policy public_read on public.booking_types for select to anon, authenticated using (is_active);
create policy public_read on public.forms for select to anon, authenticated using (is_active);

-- Anon may only see the published half of globals and the public half of forms
revoke select on public.globals from anon;
grant select (key, published, published_at) on public.globals to anon;
revoke select on public.forms from anon;
grant select (id, slug, name, enquiry_type, fields, is_active) on public.forms to anon;

-- Anon never writes directly
revoke insert, update, delete on all tables in schema public from anon;

-- ---------- Storage: public 'media' bucket (uploads happen server-side) ----------
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('media', 'media', true, 10485760,
            array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'])
    on conflict (id) do nothing;
  end if;
end $$;
