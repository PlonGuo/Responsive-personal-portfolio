-- Isolated database only. Refuse to run a global cleanup against visitor data.
-- Run with psql -v ON_ERROR_STOP=1; all fixtures and deletes are rolled back.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '15s';
do $$ begin
  if current_setting('portfolio.isolated_cleanup_test', true) is distinct from 'on' then
    raise exception 'Run only in an isolated cleanup test database';
  end if;
end $$;
create temporary table cleanup_fixture (label text primary key, ip text, wid uuid, rid uuid, should_survive boolean);
insert into cleanup_fixture values
 ('old-settled','p4-cleanup-old',gen_random_uuid(),gen_random_uuid(),false),
 ('active','p4-cleanup-active',gen_random_uuid(),gen_random_uuid(),true),
 ('recent-request','p4-cleanup-recent-request',gen_random_uuid(),gen_random_uuid(),true),
 ('recent-settlement','p4-cleanup-recent-settlement',gen_random_uuid(),gen_random_uuid(),true),
 ('pending-young','p4-cleanup-pending-young',gen_random_uuid(),gen_random_uuid(),true),
 ('pending-expired','p4-cleanup-pending-expired',gen_random_uuid(),gen_random_uuid(),false),
 ('pending-active','p4-cleanup-pending-active',gen_random_uuid(),gen_random_uuid(),true),
 ('current-window','p4-cleanup-current',gen_random_uuid(),gen_random_uuid(),true),
 ('created-young','p4-cleanup-created-young',gen_random_uuid(),gen_random_uuid(),true),
 ('orphan-expired','p4-cleanup-orphan-expired',gen_random_uuid(),gen_random_uuid(),false),
 ('orphan-young','p4-cleanup-orphan-young',gen_random_uuid(),gen_random_uuid(),true);
insert into public.chat_ip_quotas (ip_key,window_id,window_start,last_request)
 select ip,wid,case when label in ('active','current-window','pending-active') then now()-interval '30 minutes' else now()-interval '72 hours' end,
 case when label='recent-request' then now()-interval '1 hour' when label in ('active','current-window','pending-active') then now()-interval '30 minutes' else now()-interval '72 hours' end
 from cleanup_fixture where label not like 'orphan-%';
insert into public.chat_usage_requests(request_id,ip_key,window_id,created_at,settled_at,report)
 select rid,ip,wid,
 case when label in ('pending-young','orphan-young') then now()-interval '36 hours' when label in ('created-young','active','current-window','recent-request') then now()-interval '1 hour' else now()-interval '72 hours' end,
 case when label like 'pending-%' or label like 'orphan-%' then null when label in ('recent-settlement','active','current-window','recent-request') then now()-interval '30 minutes' else now()-interval '49 hours' end,
 case when label like 'pending-%' or label like 'orphan-%' then null else '{"attempts":[],"termination":"complete"}'::jsonb end
 from cleanup_fixture;
-- A settled old ledger may be deleted under an active IP, but its live ledger must survive.
insert into public.chat_usage_requests(request_id,ip_key,window_id,created_at,settled_at,report)
 select gen_random_uuid(),ip,gen_random_uuid(),now()-interval '72 hours',now()-interval '49 hours','{"attempts":[],"termination":"complete"}'::jsonb
 from cleanup_fixture where label='active';
select public.cleanup_chat_quotas();
do $$ declare f record; begin
 for f in select * from cleanup_fixture loop
  if exists(select 1 from public.chat_usage_requests where request_id=f.rid) <> f.should_survive then
    raise exception 'Unexpected ledger retention: %',f.label;
  end if;
 end loop;
 if exists(select 1 from public.chat_ip_quotas where ip_key in('p4-cleanup-old','p4-cleanup-pending-expired')) then
   raise exception 'Expired empty quota must be removed';
 end if;
 if not exists(select 1 from public.chat_ip_quotas where ip_key='p4-cleanup-active') then
   raise exception 'Active quota must survive cleanup';
 end if;
 if not exists(select 1 from public.chat_ip_quotas where ip_key='p4-cleanup-recent-settlement') then
   raise exception 'Keep quota while retained ledgers still require it';
 end if;
 if (select count(*) from public.chat_usage_requests where ip_key='p4-cleanup-active')<>1 then
   raise exception 'Old settled ledger should expire under an active IP';
 end if;
end $$;
-- Re-entry must not remove protected rows or change any retained state.
create temporary table retained_ledgers as select * from public.chat_usage_requests;
select public.cleanup_chat_quotas();
do $$ begin
 if exists((select * from retained_ledgers except select * from public.chat_usage_requests)
   union all (select * from public.chat_usage_requests except select * from retained_ledgers)) then
   raise exception 'Cleanup is not idempotent';
 end if;
 if has_function_privilege('anon','public.cleanup_chat_quotas()','execute') or has_function_privilege('authenticated','public.cleanup_chat_quotas()','execute') then
   raise exception 'Client role can run cleanup';
 end if;
 if not has_function_privilege('service_role','public.cleanup_chat_quotas()','execute') then raise exception 'Service role cannot run cleanup'; end if;
end $$;
set local role anon;
do $$ begin
 begin perform public.cleanup_chat_quotas(); raise exception 'Anon unexpectedly executed cleanup';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
 begin perform public.cleanup_chat_quotas(); raise exception 'Authenticated unexpectedly executed cleanup';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
select public.cleanup_chat_quotas();
reset role;
rollback;
