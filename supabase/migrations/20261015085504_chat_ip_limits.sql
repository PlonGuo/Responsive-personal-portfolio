-- Additive: the deployed application's legacy tables and functions stay intact.
create table public.chat_ip_quotas (
  ip_key text primary key check (length(btrim(ip_key)) between 1 and 200),
  window_id uuid not null default gen_random_uuid(),
  window_start timestamptz not null default clock_timestamp(),
  request_count integer not null default 0 check (request_count between 0 and 30),
  token_count bigint not null default 0 check (token_count between 0 and 9007199254740991),
  unknown_usage_count integer not null default 0 check (unknown_usage_count >= 0),
  last_request timestamptz not null default clock_timestamp()
);
create table public.chat_usage_requests (
  request_id uuid primary key,
  ip_key text not null,
  window_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  settled_at timestamptz,
  report jsonb,
  check ((settled_at is null) = (report is null))
);
create index chat_usage_requests_created_at on public.chat_usage_requests (created_at);
create index chat_usage_requests_ip_window on public.chat_usage_requests (ip_key, window_id);

alter table public.chat_ip_quotas enable row level security;
alter table public.chat_usage_requests enable row level security;
revoke all on public.chat_ip_quotas, public.chat_usage_requests from public, anon, authenticated;
grant select, insert, update, delete on public.chat_ip_quotas, public.chat_usage_requests to service_role;

create function public.admit_chat_request(p_ip_key text, p_request_id uuid)
returns table (status text, window_id uuid)
language plpgsql security invoker set search_path = '' as $$
declare
  v_quota public.chat_ip_quotas%rowtype;
  v_request public.chat_usage_requests%rowtype;
  v_now timestamptz;
begin
  if p_ip_key is null or length(btrim(p_ip_key)) not between 1 and 200 or p_request_id is null then
    raise exception 'Invalid chat admission';
  end if;
  insert into public.chat_ip_quotas (ip_key) values (p_ip_key) on conflict (ip_key) do nothing;
  select q.* into strict v_quota from public.chat_ip_quotas q where q.ip_key = p_ip_key for update;
  -- Every operation locks quota before ledger, including idempotent re-entry.
  select r.* into v_request from public.chat_usage_requests r where r.request_id = p_request_id for update;
  if found then
    if v_request.ip_key <> p_ip_key or v_request.settled_at is not null then
      raise exception 'Chat admission identity conflict';
    end if;
    return query select 'allowed'::text, v_request.window_id;
    return;
  end if;
  v_now := clock_timestamp();
  if v_quota.window_start <= v_now - interval '1 hour' then
    update public.chat_ip_quotas q set window_id = gen_random_uuid(), window_start = v_now,
      request_count = 0, token_count = 0, unknown_usage_count = 0 where q.ip_key = p_ip_key
      returning q.* into v_quota;
  end if;
  if v_quota.request_count >= 30 or v_quota.token_count >= 100000 then
    return query select 'limited'::text, null::uuid;
    return;
  end if;
  insert into public.chat_usage_requests (request_id, ip_key, window_id, created_at)
    values (p_request_id, p_ip_key, v_quota.window_id, v_now);
  update public.chat_ip_quotas q set request_count = q.request_count + 1, last_request = v_now where q.ip_key = p_ip_key;
  return query select 'allowed'::text, v_quota.window_id;
end;
$$;

create function public.settle_chat_usage(p_request_id uuid, p_report jsonb)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  v_request public.chat_usage_requests%rowtype;
  v_part jsonb;
  v_attempts jsonb := '[]'::jsonb;
  v_values numeric[];
  v_value numeric;
  v_key text;
  v_total numeric;
  v_known numeric := 0;
  v_unknown integer := 0;
  v_normalized jsonb;
begin
  if p_request_id is null or p_report is null or jsonb_typeof(p_report) <> 'object'
    or not (p_report ?& array['attempts', 'termination'])
    or jsonb_typeof(p_report->'attempts') <> 'array'
    or jsonb_typeof(p_report->'termination') <> 'string'
    or p_report->>'termination' not in ('complete', 'aborted', 'error') then
    raise exception 'Invalid chat usage';
  end if;
  if jsonb_array_length(p_report->'attempts') > 2 then raise exception 'Invalid chat usage'; end if;
  for v_part in select value from jsonb_array_elements(p_report->'attempts') loop
    if jsonb_typeof(v_part) <> 'object' or not (v_part ?& array['provider','inputTokens','outputTokens','totalTokens'])
      or jsonb_typeof(v_part->'provider') <> 'string' or v_part->>'provider' not in ('legacy','deepseek','openai')
      or (v_part->>'provider' = 'legacy' and jsonb_array_length(p_report->'attempts') <> 1) then
      raise exception 'Invalid chat usage';
    end if;
    v_values := array[]::numeric[];
    foreach v_key in array array['inputTokens','outputTokens','totalTokens'] loop
      if jsonb_typeof(v_part->v_key) = 'null' then v_value := null;
      elsif jsonb_typeof(v_part->v_key) = 'number' then
        v_value := (v_part->>v_key)::numeric;
        if v_value < 0 or v_value > 9007199254740991 or trunc(v_value) <> v_value then
          raise exception 'Invalid chat usage';
        end if;
      else raise exception 'Invalid chat usage';
      end if;
      v_values := array_append(v_values, v_value);
    end loop;
    if v_values[1] + v_values[2] > 9007199254740991 then raise exception 'Invalid chat usage'; end if;
    v_total := coalesce(v_values[3], v_values[1] + v_values[2]);
    if v_total is null then v_unknown := 1; else v_known := v_known + v_total; end if;
    if v_known > 9007199254740991 then raise exception 'Invalid chat usage'; end if;
    v_attempts := v_attempts || jsonb_build_array(jsonb_build_object(
      'provider',v_part->>'provider','inputTokens',v_values[1],'outputTokens',v_values[2],'totalTokens',v_total));
  end loop;
  v_normalized := jsonb_build_object('attempts',v_attempts,'termination',p_report->>'termination');
  select r.* into strict v_request from public.chat_usage_requests r where r.request_id = p_request_id;
  -- The initial unlocked read only discovers the key; re-read under the common lock order.
  perform 1 from public.chat_ip_quotas q where q.ip_key = v_request.ip_key for update;
  if not found then raise exception 'Chat quota unavailable'; end if;
  select r.* into strict v_request from public.chat_usage_requests r where r.request_id = p_request_id for update;
  if v_request.settled_at is not null then
    if v_request.report = v_normalized then return 'already_settled'; end if;
    raise exception 'Chat usage settlement conflict';
  end if;
  update public.chat_ip_quotas q set token_count = q.token_count + v_known::bigint,
    unknown_usage_count = q.unknown_usage_count + v_unknown
    where q.ip_key = v_request.ip_key and q.window_id = v_request.window_id;
  update public.chat_usage_requests r set report = v_normalized, settled_at = clock_timestamp()
    where r.request_id = p_request_id;
  return 'settled';
end;
$$;
revoke all on function public.admit_chat_request(text,uuid), public.settle_chat_usage(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.admit_chat_request(text,uuid), public.settle_chat_usage(uuid,jsonb) to service_role;
