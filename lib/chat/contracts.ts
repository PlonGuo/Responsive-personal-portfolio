export interface ChatPermit { requestId: string; ipKey: string; windowId: string }
export type Admission = { status: 'allowed'; permit: ChatPermit } | { status: 'limited' | 'unavailable' };
export interface AttemptUsage {
  provider: 'legacy' | 'deepseek' | 'openai';
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}
export interface UsageReport { attempts: AttemptUsage[]; termination: 'complete' | 'aborted' | 'error' }
export interface ChatQuota {
  admit(ipKey: string, requestId: string, signal?: AbortSignal): Promise<Admission>;
  settle(permit: ChatPermit, report: UsageReport): Promise<void>;
}
export const isUuid = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function normalizeUsageReport(value: unknown): UsageReport | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!['complete', 'aborted', 'error'].includes(String(raw.termination))
    || !Array.isArray(raw.attempts) || raw.attempts.length > 2) return null;
  const attempts: AttemptUsage[] = [];
  let total = 0;
  for (const item of raw.attempts) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const part = item as Record<string, unknown>;
    if (!['legacy', 'deepseek', 'openai'].includes(String(part.provider))) return null;
    const valid = (n: unknown) => n === null || (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0);
    if (![part.inputTokens, part.outputTokens, part.totalTokens].every(valid)) return null;
    const inputTokens = part.inputTokens as number | null;
    const outputTokens = part.outputTokens as number | null;
    const sum = inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null;
    if (sum !== null && !Number.isSafeInteger(sum)) return null;
    const totalTokens = (part.totalTokens as number | null) ?? sum;
    total += totalTokens ?? 0;
    if (!Number.isSafeInteger(total)) return null;
    attempts.push({ provider: part.provider as AttemptUsage['provider'], inputTokens, outputTokens, totalTokens });
  }
  if (attempts.length > 1 && attempts.some(attempt => attempt.provider === 'legacy')) return null;
  return { attempts, termination: raw.termination as UsageReport['termination'] };
}

export interface ModelInput {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}
export interface Generation { text: AsyncIterable<string>; outcome: Promise<UsageReport> }
export type StartGeneration = (input: ModelInput, signal: AbortSignal) => Promise<Generation>;
export class GenerationStartError extends Error {
  constructor(public readonly report: UsageReport) { super('Chat service unavailable'); }
}
