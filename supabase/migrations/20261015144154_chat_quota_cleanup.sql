-- Additive cleanup only. Legacy tables, functions and schedules stay intact.
create or replace function public.cleanup_chat_quotas()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_cutoff timestamptz := statement_timestamp() - interval '24 hours';
  v_pending_cutoff timestamptz := statement_timestamp() - interval '48 hours';
  v_quota record;
  v_rows integer;
  v_requests integer := 0;
  v_quotas integer := 0;
begin
  -- Use the same quota-before-ledger lock order as admission and settlement.
  -- Busy IPs wait until the next cleanup instead of blocking live chat.
  for v_quota in select q.ip_key,q.window_start,q.last_request
    from public.chat_ip_quotas q order by q.ip_key for update skip locked
  loop
    delete from public.chat_usage_requests r where r.ip_key=v_quota.ip_key and (
      (r.created_at < v_cutoff and r.settled_at < v_cutoff)
      or (r.settled_at is null and r.created_at < v_pending_cutoff
        and v_quota.window_start < v_cutoff and v_quota.last_request < v_cutoff)
    );
    get diagnostics v_rows = row_count;
    v_requests := v_requests + v_rows;
    -- A retained ledger still needs its IP row for idempotent/late settlement.
    delete from public.chat_ip_quotas q where q.ip_key=v_quota.ip_key
      and q.window_start < v_cutoff and q.last_request < v_cutoff
      and not exists(select 1 from public.chat_usage_requests r where r.ip_key=q.ip_key);
    get diagnostics v_rows = row_count;
    v_quotas := v_quotas + v_rows;
  end loop;
  -- Orphaned ledgers can only expire after their full retention period.
  delete from public.chat_usage_requests r where not exists(
    select 1 from public.chat_ip_quotas q where q.ip_key=r.ip_key
  ) and ((r.created_at < v_cutoff and r.settled_at < v_cutoff)
    or (r.settled_at is null and r.created_at < v_pending_cutoff));
  get diagnostics v_rows = row_count;
  return jsonb_build_object('quotas',v_quotas,'requests',v_requests+v_rows);
end;
$$;
revoke all on function public.cleanup_chat_quotas() from public, anon, authenticated;
grant execute on function public.cleanup_chat_quotas() to service_role;

-- pg_cron is preloaded by Supabase; enabling it does not alter other schedules.
create extension if not exists pg_cron with schema pg_catalog;
do $$
declare v_job record; v_job_id bigint;
begin
  if current_setting('cron.timezone',true) not in ('GMT','UTC','Etc/UTC')
    or current_setting('cron.timezone',true) is null then
    raise exception 'Chat cleanup requires a UTC cron timezone';
  end if;
  for v_job in select * from cron.job where jobname='portfolio-chat-quota-cleanup' loop
    if v_job.username <> current_user or v_job.database <> current_database()
      or btrim(v_job.command) <> 'select public.cleanup_chat_quotas();' then
      raise exception 'Existing chat cleanup job has different ownership or command';
    end if;
  end loop;
  select cron.schedule('portfolio-chat-quota-cleanup','17 4 * * *','select public.cleanup_chat_quotas();') into v_job_id;
  perform cron.alter_job(v_job_id,active:=true);
end;
$$;
