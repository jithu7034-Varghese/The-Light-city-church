\set ON_ERROR_STOP 0
\pset tuples_only on
insert into auth.users (id,email,raw_app_meta_data) values
 ('00000000-0000-0000-0000-000000000001','super@x','{"role":"super_admin"}'),
 ('00000000-0000-0000-0000-000000000002','editor@x','{"role":"editor"}'),
 ('00000000-0000-0000-0000-000000000003','viewer@x','{"role":"viewer"}'),
 ('00000000-0000-0000-0000-000000000004','pastor@x','{"role":"pastor"}');
select 'profiles created: '||count(*)||' roles '||string_agg(role::text,',' order by email) from profiles;
insert into pages (slug,title) values ('about','About');
insert into page_sections (page_id,type,sort_order,data) select id,'hero',0,'{"heading":"Hello"}' from pages;
insert into globals(key,draft) values ('navbar','{"items":["secret draft"]}');
insert into enquiries(type,name,is_sensitive,data) values ('prayer','A',true,'{}'),('contact','B',false,'{}');
insert into booking_types(slug,name) values ('pastoral','Pastoral');

-- anon
set role anon; select set_config('request.jwt.claim.sub','',false);
select 'T1 anon sees draft page rows (expect 0): '||count(*) from pages;
select 'T2 anon enquiries (expect 0): '||count(*) from enquiries;
select 'T3 anon globals published only: '||count(*) from (select key, published from globals) g;
select 'T3b anon globals draft (expect error):'; select draft from globals;
insert into enquiries(type) values ('spam');
reset role;

-- editor publishes
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
update page_sections set data='{"heading":"Edited"}';
select 'T4 editor publish version: '||publish_page((select id from pages where slug='about'),'first');
select 'T5 editor sees enquiries (expect 0): '||count(*) from enquiries;
update profiles set role='admin' where id=auth.uid();
reset role;

set role anon; select set_config('request.jwt.claim.sub','',false);
select 'T6 anon published heading: '||(snapshot->'sections'->0->'data'->>'heading') from page_versions;
reset role;

-- viewer
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select 'T7 viewer enquiries non-sensitive only (expect 1): '||count(*) from enquiries;
select 'T8 viewer publish (expect error):'; select publish_page((select id from pages limit 1));
update page_sections set data='{"x":1}'; select 'T8b viewer edit affected (expect unchanged): '||(data->>'heading') from page_sections;
reset role;

-- pastor
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
select 'T9 pastor enquiries incl sensitive (expect 2): '||count(*) from enquiries;
reset role;

-- super admin changes editor role ok, cannot change own
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
update profiles set role='admin' where email='editor@x';
select 'T10 editor now: '||role from profiles where email='editor@x';
reset role;

-- double booking + media alt
insert into bookings(booking_type_id,host_id,name,email,starts_at,ends_at) select id,'00000000-0000-0000-0000-000000000004','V','v@x','2026-12-01 10:00+00','2026-12-01 10:30+00' from booking_types;
select 'T11 overlapping booking (expect error):';
insert into bookings(booking_type_id,host_id,name,email,starts_at,ends_at) select id,'00000000-0000-0000-0000-000000000004','W','w@x','2026-12-01 10:15+00','2026-12-01 10:45+00' from booking_types;
select 'T12 booking_events logged: '||count(*) from booking_events;
select 'T13 media without alt (expect error):';
insert into media(file_name,storage_path,mime,alt) values ('a.jpg','a.jpg','image/jpeg','  ');
select 'T14 restore + version count';
select restore_page_version((select id from page_versions limit 1)); select count(*)||' sections, unpublished='||(select has_unpublished_changes from pages) from page_sections;
