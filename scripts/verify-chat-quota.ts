/** Explicit external verification. Uses only synthetic keys and deletes only those keys. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createChatLimiter } from '../lib/api/chat-rate-limit';
import type { ChatPermit, UsageReport } from '../lib/chat/contracts';

async function main() {
  if (process.argv.includes('--cleanup')) {
    const { verifyChatCleanup } = await import('./verify-chat-cleanup');
    await verifyChatCleanup();
    return;
  }
  const url = process.env.SUPABASE_PROJECT_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Database configuration missing');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const quota = createChatLimiter(() => client);
  const prefix = `p4-verify-${randomUUID()}`;
  const keys = [prefix, `${prefix}-window`, `${prefix}-tokens`];
  const ids: string[] = [];
  const id = () => { const next = randomUUID(); ids.push(next); return next; };
  const fetchQuota = async (ipKey: string) => {
    const { data, error } = await client.from('chat_ip_quotas').select('request_count,token_count,unknown_usage_count,window_id')
      .eq('ip_key', ipKey).abortSignal(AbortSignal.timeout(5000)).single();
    assert.equal(error, null, 'verification quota read failed'); return data!;
  };
  const permit = async (ipKey: string): Promise<ChatPermit> => {
    const result = await quota.admit(ipKey, id());
    assert.equal(result.status, 'allowed', 'verification admission failed');
    if (result.status !== 'allowed') throw new Error('Admission failed');
    return result.permit;
  };
  const known: UsageReport = { attempts: [{ provider: 'deepseek', inputTokens: 30, outputTokens: 7, totalTokens: 37 }], termination: 'complete' };
  let cleanupFailed = false;
  try {
    // Each call sends an independent HTTP/RPC request to the real Postgres transaction.
    const admissions = await Promise.all(Array.from({ length: 40 }, () => quota.admit(keys[0], id())));
    assert.equal(admissions.filter(result => result.status === 'allowed').length, 30, 'concurrent allowed count');
    assert.equal(admissions.filter(result => result.status === 'limited').length, 10, 'concurrent limited count');
    assert.equal((await fetchQuota(keys[0])).request_count, 30);
    const { count, error: countError } = await client.from('chat_usage_requests').select('request_id', { count: 'exact', head: true })
      .eq('ip_key', keys[0]).abortSignal(AbortSignal.timeout(5000));
    assert.equal(countError, null); assert.equal(count, 30, 'rejected requests must not create ledgers');
    const first = admissions.find(result => result.status === 'allowed');
    if (!first || first.status !== 'allowed') throw new Error('Missing permit');
    await Promise.all(Array.from({ length: 10 }, () => quota.settle(first.permit, known)));
    assert.equal((await fetchQuota(keys[0])).token_count, 37, 'parallel settlement counted twice');
    await assert.rejects(() => quota.settle(first.permit, { ...known, termination: 'error' }), 'conflicting settlement accepted');
    const old = await permit(keys[1]);
    const { error: expireError } = await client.from('chat_ip_quotas').update({ window_start: '2000-01-01T00:00:00Z' })
      .eq('ip_key', keys[1]).abortSignal(AbortSignal.timeout(5000));
    assert.equal(expireError, null);
    const current = await permit(keys[1]);
    assert.notEqual(current.windowId, old.windowId, 'expired window not reset');
    await quota.settle(old, known);
    assert.equal((await fetchQuota(keys[1])).token_count, 0, 'late usage affected current window');
    await quota.settle(current, { attempts: [
      { provider: 'deepseek', inputTokens: null, outputTokens: null, totalTokens: null },
      { provider: 'openai', inputTokens: 30, outputTokens: 7, totalTokens: null },
    ], termination: 'aborted' });
    const mixed = await fetchQuota(keys[1]);
    assert.equal(mixed.token_count, 37); assert.equal(mixed.unknown_usage_count, 1);
    const threshold = await permit(keys[2]);
    await quota.settle(threshold, { attempts: [{ provider: 'deepseek', inputTokens: 99000, outputTokens: 1000, totalTokens: 100000 }], termination: 'complete' });
    assert.equal((await quota.admit(keys[2], id())).status, 'limited', '100000 token threshold bypassed');
    console.log(JSON.stringify({ concurrent: { admitted: 30, limited: 10 }, parallelSettlement: 'once', conflict: 'rejected',
      lateWindow: 'isolated', mixedUsage: { knownTokens: 37, unknownRequests: 1 }, tokenThreshold: 'blocked' }));
  } finally {
    // Both filters constrain cleanup to this invocation, even after a partial failure.
    const requests = await client.from('chat_usage_requests').delete().in('request_id', ids).in('ip_key', keys).abortSignal(AbortSignal.timeout(5000));
    const quotas = await client.from('chat_ip_quotas').delete().in('ip_key', keys).abortSignal(AbortSignal.timeout(5000));
    cleanupFailed = Boolean(requests.error || quotas.error);
    console.log(JSON.stringify({ syntheticCleanup: cleanupFailed ? 'failed' : 'complete' }));
  }
  if (cleanupFailed) throw new Error('Synthetic cleanup failed');
}
main().catch(() => { console.error('Chat quota verification failed; no credentials or database details logged'); process.exitCode = 1; });
