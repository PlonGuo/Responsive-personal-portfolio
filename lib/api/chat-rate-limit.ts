import type { SupabaseClient } from '@supabase/supabase-js';
import { isUuid, normalizeUsageReport, type ChatQuota } from '../chat/contracts';

const TIMEOUT_MS = 5000;
export function createChatLimiter(getClient: () => SupabaseClient): ChatQuota {
  return {
    async admit(ipKey, requestId, signal) {
      if (!ipKey || ipKey.length > 200 || !isUuid(requestId) || signal?.aborted) return { status: 'unavailable' };
      try {
        const { data, error } = await getClient().rpc('admit_chat_request', { p_ip_key: ipKey, p_request_id: requestId })
          .abortSignal(AbortSignal.any([AbortSignal.timeout(TIMEOUT_MS), ...(signal ? [signal] : [])]));
        if (error || !Array.isArray(data) || data.length !== 1) return { status: 'unavailable' };
        const row = data[0];
        if (row?.status === 'limited' && row.window_id === null) return { status: 'limited' };
        if (row?.status !== 'allowed' || !isUuid(row.window_id)) return { status: 'unavailable' };
        return { status: 'allowed', permit: { requestId, ipKey, windowId: row.window_id } };
      } catch { return { status: 'unavailable' }; }
    },
    async settle(permit, report) {
      const normalized = normalizeUsageReport(report);
      if (!isUuid(permit.requestId) || !isUuid(permit.windowId) || !permit.ipKey || !normalized) {
        throw new Error('Chat usage settlement unavailable');
      }
      try {
        // Independent from the generation's signal: persist even after explicit stop.
        const { data, error } = await getClient().rpc('settle_chat_usage', { p_request_id: permit.requestId, p_report: normalized })
          .abortSignal(AbortSignal.timeout(TIMEOUT_MS));
        if (error || (data !== 'settled' && data !== 'already_settled')) throw new Error('Invalid settlement');
      } catch { throw new Error('Chat usage settlement unavailable'); }
    },
  };
}
