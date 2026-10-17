/** Explicit Management API verification; never invokes global cleanup on visitor data. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

function managementToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  if (process.platform !== 'darwin') throw new Error('Management credential missing');
  let token = execFileSync('security', ['find-generic-password', '-s', 'Supabase CLI', '-a', 'supabase', '-w'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (token.startsWith('go-keyring-base64:')) token = Buffer.from(token.slice(18), 'base64').toString();
  if (token.startsWith('go-keyring-encoded:')) token = Buffer.from(token.slice(19), 'hex').toString();
  return token;
}

export async function verifyChatCleanup() {
  const ref = new URL(process.env.SUPABASE_PROJECT_URL ?? '').hostname.split('.')[0];
  assert.match(ref, /^[a-z0-9]{20}$/);
  const token = managementToken();
  const query = async (sql: string, readOnly = false) => {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query${readOnly ? '/read-only' : ''}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }), signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new Error(`Cleanup verification database request failed (${response.status})`);
    return await response.json();
  };
  const [info] = await query(`select
    current_setting('cron.timezone',true) as timezone,
    (select jsonb_agg(jsonb_build_object('schedule',schedule,'active',active,'command',command))
      from cron.job where jobname='portfolio-chat-quota-cleanup') as jobs,
    pg_get_functiondef('public.cleanup_chat_quotas()'::regprocedure) as definition,
    has_function_privilege('anon','public.cleanup_chat_quotas()','execute') as anon_execute,
    has_function_privilege('authenticated','public.cleanup_chat_quotas()','execute') as authenticated_execute,
    has_function_privilege('service_role','public.cleanup_chat_quotas()','execute') as service_execute,
    (select not prosecdef and proconfig=array['search_path=""']::text[] from pg_proc where oid='public.cleanup_chat_quotas()'::regprocedure) as restricted_function,
    (select bool_and(relrowsecurity) from pg_class where oid in ('public.chat_ip_quotas'::regclass,'public.chat_usage_requests'::regclass)) as rls,
    (select bool_and(has_table_privilege('service_role',table_name,privilege))
      from unnest(array['public.chat_ip_quotas','public.chat_usage_requests']) as t(table_name)
      cross join unnest(array['SELECT','UPDATE','DELETE']) as p(privilege)) as service_tables`, true);
  assert.ok(['GMT', 'UTC', 'Etc/UTC'].includes(info.timezone));
  assert.deepEqual(info.jobs, [{ schedule: '17 4 * * *', active: true, command: 'select public.cleanup_chat_quotas();' }]);
  assert.equal(info.anon_execute, false); assert.equal(info.authenticated_execute, false);
  assert.equal(info.service_execute, true); assert.equal(info.restricted_function, true);
  assert.equal(info.rls, true); assert.equal(info.service_tables, true);

  const schema = `p4_cleanup_verify_${randomUUID().replaceAll('-', '')}`;
  const definition: string = info.definition;
  const remap = (sql: string) => sql.replaceAll('public.chat_ip_quotas', `${schema}.chat_ip_quotas`)
    .replaceAll('public.chat_usage_requests', `${schema}.chat_usage_requests`)
    .replaceAll('public.cleanup_chat_quotas', `${schema}.cleanup_chat_quotas`);
  const fixture = await readFile(new URL('../tests/integration/chat-quota-cleanup.sql', import.meta.url), 'utf8');
  const inner = fixture.replace(/^begin;$/m, '').replace(/^rollback;$/m, '');
  // This transaction creates only private copies with zero visitor rows, runs
  // the actual installed function body against those copies, then rolls back.
  await query(`begin;
    set local statement_timeout='20s';
    select set_config('portfolio.isolated_cleanup_test','on',true);
    create schema ${schema};
    grant usage on schema ${schema} to anon,authenticated,service_role;
    create table ${schema}.chat_ip_quotas (like public.chat_ip_quotas including all);
    create table ${schema}.chat_usage_requests (like public.chat_usage_requests including all);
    alter table ${schema}.chat_ip_quotas enable row level security;
    alter table ${schema}.chat_usage_requests enable row level security;
    grant select,insert,update,delete on all tables in schema ${schema} to service_role;
    ${remap(definition)};
    revoke all on function ${schema}.cleanup_chat_quotas() from public,anon,authenticated;
    grant execute on function ${schema}.cleanup_chat_quotas() to service_role;
    ${remap(inner)}
    -- Negative permission probes invoke the real public function, which must fail.
    set local role anon;
    do $$ begin
      begin perform public.cleanup_chat_quotas(); raise exception 'Anon ran global cleanup';
      exception when insufficient_privilege then null; end;
    end $$;
    reset role;
    set local role authenticated;
    do $$ begin
      begin perform public.cleanup_chat_quotas(); raise exception 'Authenticated ran global cleanup';
      exception when insufficient_privilege then null; end;
    end $$;
    reset role;
    rollback;`);
  const [{ remaining }] = await query(`select count(*)::integer as remaining from pg_namespace where nspname='${schema}'`, true);
  assert.equal(remaining, 0);
  console.log(JSON.stringify({ cleanup: 'passed on isolated copies of live schema/function', rollback: 'complete',
    job: { name: 'portfolio-chat-quota-cleanup', schedule: '17 4 * * *', timezone: info.timezone, count: 1, active: true },
    permissions: { anon: 'denied', authenticated: 'denied', serviceRole: 'allowed on isolated copies' },
    visitorData: 'global cleanup not invoked' }));
}
