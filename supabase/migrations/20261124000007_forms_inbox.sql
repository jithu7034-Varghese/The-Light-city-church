-- Phase 2: standard forms + email templates, enquiry inbox support (saved filters,
-- chart counts, convert to person), and two security hardenings found while building it.

-- ---------- 1. Fix: notes on sensitive (prayer) enquiries ----------
-- The generic policy only checked enquiries.view, so a viewer without the `sensitive`
-- permission could read notes on prayer requests they can't see. Notes now follow the
-- visibility of their parent enquiry (whose own RLS applies inside the subquery).
drop policy staff_select on public.enquiry_notes;
drop policy staff_insert on public.enquiry_notes;
drop policy staff_update on public.enquiry_notes;
drop policy staff_delete on public.enquiry_notes;

create policy notes_select on public.enquiry_notes for select to authenticated using (
  exists (select 1 from public.enquiries e where e.id = enquiry_notes.enquiry_id)
);
create policy notes_insert on public.enquiry_notes for insert to authenticated with check (
  author_id = (select auth.uid())
  and (select public.has_permission('enquiries', 'edit'))
  and exists (select 1 from public.enquiries e where e.id = enquiry_notes.enquiry_id)
);
create policy notes_delete on public.enquiry_notes for delete to authenticated using (
  (author_id = (select auth.uid()) or (select public.has_permission('enquiries', 'delete')))
  and exists (select 1 from public.enquiries e where e.id = enquiry_notes.enquiry_id)
);
-- (no update policy: notes are append-only; delete and re-add to correct one)

-- ---------- 2. Form policies enforced in the database ----------
-- Whatever code inserts an enquiry, a sensitive form's submissions are always sensitive
-- and always get the form's retention date.
create or replace function public.apply_form_policies()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_settings jsonb;
begin
  if new.form_id is null then
    return new;
  end if;
  select settings into v_settings from public.forms where id = new.form_id;
  if v_settings is null then
    return new;
  end if;
  new.is_sensitive := new.is_sensitive or coalesce((v_settings ->> 'sensitive')::boolean, false);
  if new.expires_at is null and (v_settings ->> 'retention_days') is not null then
    new.expires_at := new.created_at + make_interval(days => (v_settings ->> 'retention_days')::integer);
  end if;
  return new;
end $$;
revoke execute on function public.apply_form_policies() from public, anon, authenticated;

create trigger enquiries_apply_form_policies
  before insert on public.enquiries
  for each row execute function public.apply_form_policies();

-- ---------- 3. Saved inbox filters (per user) ----------
create table public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  module text not null,
  name text not null check (length(btrim(name)) between 1 and 60),
  query text not null check (length(query) <= 1000),
  created_at timestamptz not null default now(),
  unique (owner_id, module, name)
);
alter table public.saved_filters enable row level security;
revoke all on public.saved_filters from anon;
create policy saved_filters_own on public.saved_filters for all to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_staff()))
  with check (owner_id = (select auth.uid()) and (select public.is_staff()));

-- ---------- 4. Enquiries per day for the Overview chart ----------
-- SECURITY INVOKER: counts only the enquiries the caller is allowed to see.
create or replace function public.enquiry_daily_counts(p_days integer)
returns table (day date, total integer)
language sql stable security invoker set search_path = public
as $$
  with bounds as (
    select (now() at time zone 'Europe/London')::date as today,
           greatest(1, least(coalesce(p_days, 30), 366)) as n
  )
  select d::date as day, count(e.id)::integer as total
  from bounds b
  cross join generate_series(b.today - (b.n - 1), b.today, interval '1 day') as d
  left join public.enquiries e
    on (e.created_at at time zone 'Europe/London')::date = d::date
  group by d
  order by d;
$$;
revoke execute on function public.enquiry_daily_counts(integer) from public, anon;
grant execute on function public.enquiry_daily_counts(integer) to authenticated, service_role;

-- ---------- 5. Convert an enquiry into a person (contact) ----------
-- SECURITY INVOKER: needs contacts edit + enquiries edit through RLS. Reuses an existing
-- contact with the same email instead of creating a duplicate.
create or replace function public.convert_enquiry_to_contact(p_enquiry_id uuid)
returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  v_enquiry public.enquiries%rowtype;
  v_contact_id uuid;
  v_name text;
begin
  select * into v_enquiry from public.enquiries where id = p_enquiry_id;
  if not found then
    raise exception 'Enquiry not found';
  end if;
  if v_enquiry.contact_id is not null then
    return v_enquiry.contact_id;
  end if;

  if v_enquiry.email is not null then
    select id into v_contact_id from public.contacts where email = v_enquiry.email;
  end if;

  if v_contact_id is null then
    v_name := btrim(coalesce(v_enquiry.name, ''));
    insert into public.contacts (first_name, last_name, email, phone, city)
    values (
      split_part(v_name, ' ', 1),
      btrim(substr(v_name, length(split_part(v_name, ' ', 1)) + 1)),
      v_enquiry.email,
      v_enquiry.phone,
      nullif(v_enquiry.data ->> 'city', '')
    )
    returning id into v_contact_id;
  end if;

  update public.enquiries set contact_id = v_contact_id where id = p_enquiry_id;
  if not found then
    raise exception 'Not allowed to update this enquiry';
  end if;
  return v_contact_id;
end $$;
revoke execute on function public.convert_enquiry_to_contact(uuid) from public, anon;
grant execute on function public.convert_enquiry_to_contact(uuid) to authenticated;

-- ---------- 6. Email templates ----------
-- {{var}} is HTML-escaped; {{{var}}} is inserted as-is and only used for HTML the server builds.
insert into public.email_templates (key, name, subject, body) values
('enquiry_notification', 'Staff: new enquiry',
 'New {{form_name}} from {{name}}',
 '<p>A new <strong>{{form_name}}</strong> was sent from the website.</p>{{{details}}}<p><a href="{{admin_url}}">Open it in the admin</a></p>'),
('auto_reply_contact', 'Auto-reply: contact / get involved',
 'Thank you for getting in touch',
 '<p>Hi {{name}},</p><p>Thank you for contacting The Light City Church. A member of our welcome team will get back to you shortly.</p><p>Every blessing,<br>The Light City Church</p>'),
('auto_reply_prayer', 'Auto-reply: prayer & testimony',
 'We''re standing with you in prayer',
 '<p>Hi {{name}},</p><p>Thank you for sharing with us. Our prayer team has received your message and will be joining our faith with yours.</p><p>Every blessing,<br>The Light City Church</p>'),
('auto_reply_salvation', 'Auto-reply: salvation decision',
 'Welcome to the family of God!',
 '<p>Hi {{name}},</p><p>Congratulations on the most important decision of your life! We would love to help you grow in your new life in Christ, and someone from our team will be in touch soon.</p><p>Every blessing,<br>The Light City Church</p>'),
('auto_reply_loved_circle', 'Auto-reply: The Loved Circle',
 'Welcome to The Loved Circle',
 '<p>Hi {{name}},</p><p>Thank you for joining The Loved Circle! We can''t wait to get to know you. We''ll be in touch soon.</p><p>With so much love,<br>Annalene</p>'),
('auto_reply_newsletter', 'Auto-reply: newsletter',
 'Thanks for signing up',
 '<p>Thank you for signing up to hear from The Light City Church. You''ll receive our Daily Devotional, monthly newsletter and news about special conferences and events.</p>'),
('auto_reply_volunteer', 'Auto-reply: volunteer',
 'Thank you for offering to serve',
 '<p>Hi {{name}},</p><p>Thank you for offering to volunteer with The Light City Church. Someone from the team will contact you about the next steps.</p><p>Every blessing,<br>The Light City Church</p>')
on conflict (key) do nothing;

-- ---------- 7. Standard forms (R1). R2's Form Builder edits these same rows ----------
-- Field shape: {id, key, type, label, required, placeholder?, options?: [{value,label}], max_length?}
-- Types: text | email | phone | textarea | select | checkbox | consent
-- Fields marked "old site" are copied from supabase/seed/old-site-content.json.
-- Sensitive (special-category data: only staff with the `sensitive` permission see them):
--   prayer (12-month retention) and salvation. Contact / Get Involved is kept for 24 months.
-- Recipients start empty: the app falls back to ENQUIRY_RECIPIENTS until staff set them per form.
insert into public.forms (slug, name, enquiry_type, fields, settings) values
('get-involved', 'Contact / Get Involved', 'contact',
 '[
   {"id":"fld_gi_name","key":"name","type":"text","label":"Name","required":true},
   {"id":"fld_gi_email","key":"email","type":"email","label":"Email","required":true},
   {"id":"fld_gi_phone","key":"phone","type":"phone","label":"Phone Number","required":false},
   {"id":"fld_gi_subject","key":"subject","type":"text","label":"Subject","required":false},
   {"id":"fld_gi_message","key":"message","type":"textarea","label":"Message","required":true}
 ]'::jsonb,
 '{"recipients":[],"auto_reply":{"enabled":true,"template_key":"auto_reply_contact"},
   "success_message":"Thank you. A member of our welcome or pastoral team will get back to you shortly.",
   "submit_label":"SEND","turnstile":true,"sensitive":false,"retention_days":730}'::jsonb),

('prayer', 'Prayer & Testimony', 'prayer',
 '[
   {"id":"fld_pr_name","key":"name","type":"text","label":"Name","required":true},
   {"id":"fld_pr_email","key":"email","type":"email","label":"Email","required":true},
   {"id":"fld_pr_phone","key":"phone","type":"phone","label":"Phone Number","required":false},
   {"id":"fld_pr_kind","key":"kind","type":"select","label":"I would like to share","required":true,
    "options":[{"value":"prayer","label":"A prayer request"},{"value":"testimony","label":"A testimony"}]},
   {"id":"fld_pr_message","key":"message","type":"textarea","label":"Your prayer request or testimony","required":true},
   {"id":"fld_pr_share","key":"may_share","type":"checkbox","label":"You may share my testimony to encourage others (prayer requests are never shared)","required":false},
   {"id":"fld_pr_consent","key":"consent","type":"consent","label":"I agree to The Light City Church keeping these details for 12 months so the prayer team can pray for me and contact me.","required":true}
 ]'::jsonb,
 '{"recipients":[],"auto_reply":{"enabled":true,"template_key":"auto_reply_prayer"},
   "success_message":"Thank you. Our prayer team will be standing in agreement with you.",
   "submit_label":"SEND","turnstile":true,"sensitive":true,"retention_days":365}'::jsonb),

('salvation', 'Salvation decision', 'salvation',
 '[
   {"id":"fld_sv_name","key":"name","type":"text","label":"Name","required":false},
   {"id":"fld_sv_email","key":"email","type":"email","label":"Email","required":true},
   {"id":"fld_sv_city","key":"city","type":"text","label":"City","required":true},
   {"id":"fld_sv_optin","key":"newsletter_opt_in","type":"checkbox","label":"Sign up for our email list for updates, promotions, and more.","required":false}
 ]'::jsonb,
 '{"recipients":[],"auto_reply":{"enabled":true,"template_key":"auto_reply_salvation"},
   "success_message":"Welcome to the family of God! We will be in touch soon.",
   "submit_label":"SEND","turnstile":true,"sensitive":true,"subscribe_field":"newsletter_opt_in"}'::jsonb),

('loved-circle', 'Join The Loved Circle', 'loved_circle',
 '[
   {"id":"fld_lc_name","key":"name","type":"text","label":"Name","required":true},
   {"id":"fld_lc_email","key":"email","type":"email","label":"Email","required":true},
   {"id":"fld_lc_city","key":"city","type":"text","label":"City","required":true},
   {"id":"fld_lc_phone","key":"phone","type":"phone","label":"Contact Number","required":true}
 ]'::jsonb,
 '{"recipients":[],"auto_reply":{"enabled":true,"template_key":"auto_reply_loved_circle"},
   "success_message":"Thank you for joining The Loved Circle! We will be in touch soon.",
   "submit_label":"SEND","turnstile":true,"sensitive":false}'::jsonb),

('newsletter', 'Newsletter', 'newsletter',
 '[
   {"id":"fld_nl_email","key":"email","type":"email","label":"Email","required":true}
 ]'::jsonb,
 '{"recipients":[],"auto_reply":{"enabled":true,"template_key":"auto_reply_newsletter"},
   "success_message":"Thank you for signing up!",
   "submit_label":"SIGN UP","turnstile":true,"sensitive":false,"subscribe":true,"notify_staff":false}'::jsonb),

('volunteer', 'Volunteer', 'volunteer',
 '[
   {"id":"fld_vo_name","key":"name","type":"text","label":"Name","required":true},
   {"id":"fld_vo_email","key":"email","type":"email","label":"Email","required":true},
   {"id":"fld_vo_phone","key":"phone","type":"phone","label":"Phone Number","required":false},
   {"id":"fld_vo_area","key":"area","type":"select","label":"Where would you like to serve?","required":true,
    "options":[{"value":"welcome","label":"Welcome team"},{"value":"worship","label":"Worship & music"},
               {"value":"kids","label":"Kids church"},{"value":"media","label":"Media & tech"},
               {"value":"prayer","label":"Prayer team"},{"value":"other","label":"Somewhere else"}]},
   {"id":"fld_vo_availability","key":"availability","type":"text","label":"When are you usually available?","required":false},
   {"id":"fld_vo_message","key":"message","type":"textarea","label":"Tell us a little about yourself","required":false}
 ]'::jsonb,
 '{"recipients":[],"auto_reply":{"enabled":true,"template_key":"auto_reply_volunteer"},
   "success_message":"Thank you for offering to serve! We will be in touch soon.",
   "submit_label":"SEND","turnstile":true,"sensitive":false}'::jsonb)
on conflict (slug) do nothing;
