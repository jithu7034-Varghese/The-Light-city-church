-- RLS / integrity tests. Self-asserting: any failed check raises an exception, so
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- exits non-zero (this is what CI runs). Passing checks print "ok - <name>" as NOTICEs.
-- Run on a fresh database after local_auth_stub.sql and all migrations (see supabase/README.md).
\set ON_ERROR_STOP 1
\pset tuples_only on

-- ---------- Assertion helpers (SECURITY INVOKER, so they run as whatever role is set) ----------
create schema if not exists tests;
grant usage on schema tests to public;

create or replace function tests.eq(p_name text, p_actual text, p_expected text)
returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL %: expected %, got %', p_name, coalesce(p_expected, 'NULL'), coalesce(p_actual, 'NULL');
  end if;
  raise notice 'ok - %', p_name;
end $$;

-- Runs p_sql and passes only if it raises an error whose message contains p_pattern.
create or replace function tests.throws(p_name text, p_sql text, p_pattern text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm ilike '%' || p_pattern || '%' then
      raise notice 'ok - % (%)', p_name, sqlerrm;
      return;
    end if;
    raise exception 'FAIL %: expected error like "%", got "%"', p_name, p_pattern, sqlerrm;
  end;
  raise exception 'FAIL %: expected an error like "%", but it succeeded', p_name, p_pattern;
end $$;

grant execute on all functions in schema tests to public;

-- ---------- Fixtures ----------
insert into auth.users (id,email,raw_app_meta_data) values
 ('00000000-0000-0000-0000-000000000001','super@x','{"role":"super_admin"}'),
 ('00000000-0000-0000-0000-000000000002','editor@x','{"role":"editor"}'),
 ('00000000-0000-0000-0000-000000000003','viewer@x','{"role":"viewer"}'),
 ('00000000-0000-0000-0000-000000000004','pastor@x','{"role":"pastor"}');
select tests.eq('T0 invited profiles created active with roles',
  (select count(*)||':'||string_agg(role::text||'/'||is_active, ',' order by email) from profiles),
  '4:editor/true,pastor/true,super_admin/true,viewer/true');
insert into pages (slug,title) values ('about','About');
insert into page_sections (page_id,type,sort_order,data) select id,'hero',0,'{"heading":"Hello"}' from pages;
insert into globals(key,draft) values ('navbar','{"items":["secret draft"]}');
insert into enquiries(type,name,is_sensitive,data) values ('prayer','A',true,'{}'),('contact','B',false,'{}');
insert into booking_types(slug,name) values ('pastoral','Pastoral');

-- ---------- anon ----------
set role anon; select set_config('request.jwt.claim.sub','',false);
select tests.eq('T1 anon sees no draft page rows', (select count(*) from pages)::text, '0');
select tests.eq('T2 anon sees no enquiries', (select count(*) from enquiries)::text, '0');
select tests.eq('T3 anon reads published globals column', (select count(*) from (select key, published from globals) g)::text, '1');
select tests.throws('T3b anon cannot read globals draft', 'select draft from globals', 'permission denied');
select tests.throws('T3c anon cannot insert enquiries', $q$insert into enquiries(type) values ('spam')$q$, 'permission denied');
reset role;

-- ---------- editor publishes ----------
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
update page_sections set data='{"heading":"Edited"}';
select tests.eq('T4 editor publishes version 1', publish_page((select id from pages where slug='about'),'first')::text, '1');
select tests.eq('T5 editor sees no enquiries', (select count(*) from enquiries)::text, '0');
select tests.throws('T5b editor cannot change own role', $q$update profiles set role='admin' where id=auth.uid()$q$, 'Not allowed');
reset role;

set role anon; select set_config('request.jwt.claim.sub','',false);
select tests.eq('T6 anon sees published heading', (select snapshot->'sections'->0->'data'->>'heading' from page_versions), 'Edited');
reset role;

-- ---------- viewer ----------
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select tests.eq('T7 viewer sees non-sensitive enquiries only', (select count(*) from enquiries)::text, '1');
select tests.throws('T8 viewer cannot publish', 'select publish_page((select id from pages limit 1))', 'Not allowed to publish');
update page_sections set data='{"x":1}';
select tests.eq('T8b viewer edit has no effect', (select data->>'heading' from page_sections), 'Edited');
reset role;

-- ---------- pastor ----------
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
select tests.eq('T9 pastor sees sensitive enquiries too', (select count(*) from enquiries)::text, '2');
reset role;

-- ---------- super admin changes another user's role ----------
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
update profiles set role='admin' where email='editor@x';
select tests.eq('T10 super admin promoted editor', (select role::text from profiles where email='editor@x'), 'admin');
reset role;

-- ---------- double booking, media alt, restore ----------
insert into bookings(booking_type_id,host_id,name,email,starts_at,ends_at) select id,'00000000-0000-0000-0000-000000000004','V','v@x','2026-12-01 10:00+00','2026-12-01 10:30+00' from booking_types;
select tests.throws('T11 overlapping booking rejected',
  $q$insert into bookings(booking_type_id,host_id,name,email,starts_at,ends_at) select id,'00000000-0000-0000-0000-000000000004','W','w@x','2026-12-01 10:15+00','2026-12-01 10:45+00' from booking_types$q$,
  'bookings_no_overlap');
select tests.eq('T12 booking_events logged', (select count(*) from booking_events)::text, '1');
select tests.throws('T13 media without alt rejected', $q$insert into media(file_name,storage_path,mime,alt) values ('a.jpg','a.jpg','image/jpeg','  ')$q$, 'media_alt_check');
select restore_page_version((select id from page_versions limit 1));
select tests.eq('T14 restore into draft', (select count(*)||' sections, unpublished='||(select has_unpublished_changes from pages) from page_sections), '1 sections, unpublished=true');

-- ===== Security regression tests (from the architecture review) =====
update page_sections set data='{"heading":"UNPUBLISHED DRAFT"}';
set role anon; select set_config('request.jwt.claim.sub','',false);
select tests.throws('S1 anon cannot call publish_page', $q$select publish_page((select id from pages where slug='about'))$q$, 'permission denied for function');
select tests.throws('S2 anon cannot call publish_global', $q$select publish_global('navbar')$q$, 'permission denied for function');
select tests.throws('S3 anon cannot read media.uploaded_by', 'select uploaded_by from media', 'permission denied');
reset role;
select tests.eq('S4 live heading unchanged by draft edits', (select snapshot->'sections'->0->'data'->>'heading' from page_versions where is_published), 'Edited');

-- authenticated user without permission calling RPC
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select tests.throws('S5 viewer cannot publish globals', $q$select publish_global('navbar')$q$, 'Not allowed');
reset role;

-- stranger who somehow created an account (public signup is disabled, this is defence in depth)
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000000ff','stranger@x');
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000ff',false);
select tests.eq('S6 stranger profile is inactive', (select is_active::text from profiles where id=(select auth.uid())), 'false');
select tests.eq('S7 stranger sees no enquiries', (select count(*) from enquiries)::text, '0');
select tests.eq('S8 stranger sees only own profile', (select count(*) from profiles)::text, '1');
select tests.throws('S9 stranger cannot self-activate', 'update profiles set is_active=true where id=(select auth.uid())', 'Not allowed');
-- Phase 1 (auth): an inactive account gets nothing from the permission matrix or the activity log
select tests.eq('A1 stranger cannot read the permission matrix', (select count(*) from role_permissions)::text, '0');
select tests.throws('A2 stranger cannot write activity',
  $q$insert into activity_log(actor_id,action,module,entity_type) values (auth.uid(),'login','users','session')$q$,
  'row-level security');
reset role;

-- Phase 1 (auth): what the admin session + logActivity() rely on, as an active viewer
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select tests.eq('A3 staff reads own role permissions', (select count(*) from role_permissions where role='viewer')::text, '16');
insert into activity_log(actor_id,action,module,entity_type,summary) values (auth.uid(),'login','users','session','Signed in');
select tests.throws('A4 cannot log activity as someone else',
  $q$insert into activity_log(actor_id,action,module,entity_type) values ('00000000-0000-0000-0000-000000000001','login','users','session')$q$,
  'row-level security');
select tests.eq('A5 viewer cannot read the activity log', (select count(*) from activity_log)::text, '0');
update profiles set full_name='Val Viewer' where id=auth.uid();
select tests.eq('A6 user updates own name (accept invite)', (select full_name from profiles where id=auth.uid()), 'Val Viewer');
select tests.throws('A7 user cannot change own MFA requirement', 'update profiles set require_mfa = not require_mfa where id=auth.uid()', 'Not allowed');
reset role;
select tests.eq('A8 own login activity recorded', (select count(*) from activity_log where action='login' and actor_id='00000000-0000-0000-0000-000000000003')::text, '1');

-- service role can still publish (seed script / server jobs)
set role service_role; select set_config('request.jwt.claim.role','service_role',false);
select tests.eq('S10 service role publishes version 2', publish_page((select id from pages where slug='about'))::text, '2');
select tests.eq('S11 rate limit allows 3 per window', (select string_agg(check_rate_limit('t:1',3,60)::text, ',') from generate_series(1,5)), 'true,true,true,false,false');
select set_config('request.jwt.claim.role','',false);
reset role;

-- ---------- media usage derived + delete guard ----------
insert into media(id,file_name,storage_path,mime,alt) values ('11111111-1111-1111-1111-111111111111','hero.jpg','hero.jpg','image/jpeg','Church worship');
update page_sections set data='{"heading":"Hi","image":{"mediaId":"11111111-1111-1111-1111-111111111111"}}';
select tests.eq('S12 media usage derived from draft', (select count(*) from media_usage where media_id='11111111-1111-1111-1111-111111111111' and field_path='draft')::text, '1');
select tests.throws('S13 used media cannot be deleted', $q$delete from media where id='11111111-1111-1111-1111-111111111111'$q$, 'still used');
update page_sections set data='{"heading":"Hi"}';
select tests.eq('S14 draft usage removed with reference', (select count(*) from media_usage where field_path='draft')::text, '0');

-- ---------- booking host required; audit log; search ----------
select tests.throws('S15 active booking needs a host',
  $q$insert into bookings(booking_type_id,name,email,starts_at,ends_at) select id,'X','x@x','2026-12-02 10:00+00','2026-12-02 10:30+00' from booking_types$q$,
  'bookings_active_needs_host');
select tests.eq('S16 audit triggers cover key tables', (select string_agg(distinct entity_type, ',') from activity_log where action <> 'login'), 'booking_types,globals,media,pages,profiles');
select tests.eq('S17 full-text search on enquiries', (select count(*) from enquiries where search @@ plainto_tsquery('simple','B'))::text, '1');

select 'ALL RLS TESTS PASSED';
