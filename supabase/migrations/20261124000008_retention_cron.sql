-- Phase 2: GDPR retention. Enquiries past their expires_at (set from each form's
-- retention_days by the apply_form_policies trigger) are deleted daily, with their notes.

create or replace function public.purge_expired_enquiries()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.enquiries where expires_at is not null and expires_at < now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end $$;
revoke execute on function public.purge_expired_enquiries() from public, anon, authenticated;
grant execute on function public.purge_expired_enquiries() to service_role;

-- Schedule it with pg_cron (Supabase: https://supabase.com/docs/guides/cron/install).
-- Plain Postgres without pg_cron (CI, local tests) skips scheduling; the function is still tested.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    grant usage on schema cron to postgres;
    grant all privileges on all tables in schema cron to postgres;
    -- 03:15 UTC daily. Scheduling by name replaces an existing job of the same name.
    perform cron.schedule('purge-expired-enquiries', '15 3 * * *', 'select public.purge_expired_enquiries()');
  else
    raise notice 'pg_cron is not available: purge_expired_enquiries() is not scheduled on this database';
  end if;
end $$;
