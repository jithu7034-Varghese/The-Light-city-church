-- Salvation decisions are kept 12 months, as the privacy policy says (same as prayer requests).
update public.forms
   set settings = settings || '{"retention_days": 365}'::jsonb
 where slug = 'salvation';

-- Submissions received before this change get the same 12 months from when they arrived,
-- so the daily purge (purge_expired_enquiries) covers them too.
update public.enquiries e
   set expires_at = e.created_at + interval '365 days'
  from public.forms f
 where e.form_id = f.id
   and f.slug = 'salvation'
   and e.expires_at is null;
