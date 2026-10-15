create table if not exists public.contact_rate_limits (
  ip_key text primary key,
  request_count integer not null default 0,
  window_start timestamptz not null default now(),
  last_request timestamptz not null default now()
);

alter table public.contact_rate_limits enable row level security;
revoke all on public.contact_rate_limits from public, anon, authenticated;
grant select, insert, update on public.contact_rate_limits to service_role;

create or replace function public.consume_contact_rate_limit(p_ip_key text)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  insert into public.contact_rate_limits as limits (ip_key, request_count)
  values (p_ip_key, 1)
  on conflict (ip_key) do update set
    request_count = case
      when limits.window_start <= now() - interval '1 hour' then 1
      else limits.request_count + 1
    end,
    window_start = case
      when limits.window_start <= now() - interval '1 hour' then now()
      else limits.window_start
    end,
    last_request = now()
  returning request_count <= 5;
$$;

revoke all on function public.consume_contact_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_contact_rate_limit(text) to service_role;
