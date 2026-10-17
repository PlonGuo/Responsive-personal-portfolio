\set ON_ERROR_STOP on
begin;
set local role service_role;
do $$
declare
  k text := 'p4-test-' || gen_random_uuid()::text;
  old_key text;
  rid uuid := gen_random_uuid();
  old_rid uuid;
  win uuid;
  result record;
  rpt jsonb := '{"attempts":[{"provider":"deepseek","inputTokens":30,"outputTokens":7,"totalTokens":37}],"termination":"complete"}';
  bad jsonb;
  settled text;
  i integer;
begin
  select * into result from public.admit_chat_request(k,rid);
  if result.status <> 'allowed' then raise exception 'first admission failed'; end if;
  win := result.window_id;
  perform public.admit_chat_request(k,rid);
  if (select request_count from public.chat_ip_quotas where ip_key=k) <> 1 then raise exception 'reentry spent twice'; end if;
  settled := public.settle_chat_usage(rid,rpt);
  if settled <> 'settled' or public.settle_chat_usage(rid,rpt) <> 'already_settled' then raise exception 'settlement status'; end if;
  if (select token_count from public.chat_ip_quotas where ip_key=k) <> 37 then raise exception 'double accounting'; end if;
  begin
    perform public.settle_chat_usage(rid,jsonb_set(rpt,'{attempts,0,totalTokens}','38'));
    raise exception 'expected conflicting report rejection';
  exception when raise_exception then
    if sqlerrm <> 'Chat usage settlement conflict' then raise; end if;
  end;
  begin
    perform public.admit_chat_request(k,rid);
    raise exception 'settled identity reused';
  exception when raise_exception then
    if sqlerrm <> 'Chat admission identity conflict' then raise; end if;
  end;
  for i in 2..30 loop
    select * into result from public.admit_chat_request(k,gen_random_uuid());
    if result.status <> 'allowed' then raise exception 'unexpected early quota'; end if;
  end loop;
  select * into result from public.admit_chat_request(k,gen_random_uuid());
  if result.status <> 'limited' then raise exception '31st request admitted'; end if;
  if (select count(*) from public.chat_usage_requests where ip_key=k) <> 30 then raise exception 'rejection created ledger'; end if;
  update public.chat_ip_quotas set window_start=clock_timestamp()-interval '1 hour' where ip_key=k;
  old_rid := gen_random_uuid();
  select * into result from public.admit_chat_request(k,old_rid);
  if result.status <> 'allowed' or result.window_id=win then raise exception 'window not reset'; end if;
  if (select request_count from public.chat_ip_quotas where ip_key=k) <> 1 then raise exception 'window count not reset'; end if;
  if (select token_count from public.chat_ip_quotas where ip_key=k) <> 0 then raise exception 'window usage not reset'; end if;
  -- Late settlement must leave the new window untouched, but remain in its ledger.
  select request_id into rid from public.chat_usage_requests where ip_key=k and window_id=win and report is null limit 1;
  perform public.settle_chat_usage(rid,rpt);
  if (select token_count from public.chat_ip_quotas where ip_key=k) <> 0 then raise exception 'old usage polluted new window'; end if;
  if not exists(select 1 from public.chat_usage_requests where request_id=rid and report=rpt) then raise exception 'late usage lost'; end if;
  -- Mixed known/unknown usage counts known totals and flags the request once.
  perform public.settle_chat_usage(old_rid,'{"attempts":[{"provider":"deepseek","inputTokens":null,"outputTokens":null,"totalTokens":null},{"provider":"openai","inputTokens":30,"outputTokens":7,"totalTokens":null}],"termination":"aborted"}');
  if (select token_count from public.chat_ip_quotas where ip_key=k) <> 37
    or (select unknown_usage_count from public.chat_ip_quotas where ip_key=k) <> 1 then raise exception 'mixed usage lost'; end if;
  rid := gen_random_uuid();
  perform public.admit_chat_request(k,rid);
  foreach bad in array array[
    'null'::jsonb, '{}'::jsonb,
    jsonb_set(rpt,'{attempts,0,totalTokens}','-1'),
    jsonb_set(rpt,'{attempts,0,totalTokens}','1.2'),
    jsonb_set(rpt,'{attempts,0,totalTokens}','"37"'),
    jsonb_set(rpt,'{attempts,0,totalTokens}','9007199254740992'),
    jsonb_set(rpt,'{attempts,0,inputTokens}','9007199254740991'),
    '{"attempts":[{"provider":"deepseek","totalTokens":3}],"termination":"complete"}'::jsonb,
    '{"attempts":[{"provider":"legacy","inputTokens":null,"outputTokens":null,"totalTokens":null},{"provider":"openai","inputTokens":0,"outputTokens":0,"totalTokens":0}],"termination":"complete"}'::jsonb
  ] loop
    begin
      perform public.settle_chat_usage(rid,bad);
      raise exception 'expected invalid usage rejection';
    exception when raise_exception then
      if sqlerrm <> 'Invalid chat usage' then raise; end if;
    end;
  end loop;
  if (select settled_at from public.chat_usage_requests where request_id=rid) is not null then raise exception 'invalid usage settled'; end if;
  perform public.settle_chat_usage(rid,'{"attempts":[],"termination":"error"}');
  -- A total exactly at the threshold blocks the next admission.
  update public.chat_ip_quotas set token_count=100000 where ip_key=k;
  select * into result from public.admit_chat_request(k,gen_random_uuid());
  if result.status <> 'limited' then raise exception 'token threshold bypassed'; end if;
  old_key := k;
  k := k || '-other';
  begin
    perform public.admit_chat_request(k,rid);
    raise exception 'expected identity conflict';
  exception when raise_exception then
    if sqlerrm <> 'Chat admission identity conflict' then raise; end if;
  end;
  if exists(select 1 from public.chat_ip_quotas where ip_key=k) then raise exception 'failed transaction leaked quota'; end if;
  if (select token_count from public.chat_ip_quotas where ip_key=old_key) <> 100000 then raise exception 'failed transaction altered original quota'; end if;
end $$;
reset role;
do $$
begin
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('chat_ip_quotas','chat_usage_requests') and not c.relrowsecurity) then raise exception 'RLS disabled'; end if;
  if has_table_privilege('anon','public.chat_ip_quotas','SELECT')
    or has_table_privilege('authenticated','public.chat_usage_requests','UPDATE')
    or has_function_privilege('anon','public.admit_chat_request(text,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.settle_chat_usage(uuid,jsonb)','EXECUTE') then raise exception 'public role privileges leaked'; end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform public.admit_chat_request('p4-denied',gen_random_uuid());
    raise exception 'anonymous admission allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin
    perform public.settle_chat_usage(gen_random_uuid(),'{}');
    raise exception 'authenticated settlement allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
