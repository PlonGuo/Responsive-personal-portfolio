import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatLimit } from './chat-route';

const WINDOW_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 5000;
interface LimitRow { request_count: number; token_count: number; window_start: string }
function validRow(value: unknown): value is LimitRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as LimitRow;
  return Number.isInteger(row.request_count) && row.request_count >= 0
    && Number.isInteger(row.token_count) && row.token_count >= 0
    && typeof row.window_start === 'string' && Number.isFinite(Date.parse(row.window_start));
}

export function createChatLimiter(getClient: () => SupabaseClient) {
  return {
    async limit(ip: string, sessionId: string): Promise<ChatLimit> {
      const key = `${ip}:${sessionId}`;
      const now = new Date();
      try {
        const client = getClient();
        const { data, error } = await client.from('chat_rate_limits')
          .select('request_count, token_count, window_start').eq('ip_session_key', key)
          .abortSignal(AbortSignal.timeout(TIMEOUT_MS)).maybeSingle();
        if (error || (data && !validRow(data))) return 'unavailable';
        const expired = data && now.getTime() - Date.parse(data.window_start) >= WINDOW_MS;
        if (data && !expired && (data.request_count >= 30 || data.token_count >= 100000)) return 'limited';
        const values = !data || expired ? {
          request_count: 1, token_count: 0, window_start: now.toISOString(), last_request: now.toISOString(),
        } : { request_count: data.request_count + 1, last_request: now.toISOString() };
        const write = !data ? client.from('chat_rate_limits').insert({ ip_session_key: key, ...values })
          : client.from('chat_rate_limits').update(values).eq('ip_session_key', key);
        const result = await write.select('ip_session_key').abortSignal(AbortSignal.timeout(TIMEOUT_MS)).single();
        return result.error || result.data?.ip_session_key !== key ? 'unavailable' : 'allowed';
      } catch { return 'unavailable'; }
    },
    async account(ip: string, sessionId: string, chunks: number): Promise<void> {
      const client = getClient();
      const key = `${ip}:${sessionId}`;
      const { data, error } = await client.from('chat_rate_limits').select('token_count')
        .eq('ip_session_key', key).abortSignal(AbortSignal.timeout(TIMEOUT_MS)).single();
      if (error || !data || !Number.isInteger(data.token_count) || data.token_count < 0) throw new Error('Token accounting unavailable');
      const result = await client.from('chat_rate_limits').update({ token_count: data.token_count + chunks })
        .eq('ip_session_key', key).select('ip_session_key').abortSignal(AbortSignal.timeout(TIMEOUT_MS)).single();
      if (result.error || result.data?.ip_session_key !== key) throw new Error('Token accounting unavailable');
    },
  };
}
