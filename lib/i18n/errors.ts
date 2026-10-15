import type { Dictionary } from './types';
export type UIErrorCode = 'generic' | 'rateLimit' | 'verification' | 'validation' | 'navigation';
export function getUIErrorCode(status: number, apiCode?: string): UIErrorCode {
  if (apiCode === 'RATE_LIMIT' || status === 429) return 'rateLimit';
  if (apiCode === 'VERIFICATION_FAILED') return 'verification';
  if (apiCode === 'VALIDATION' || status === 400 || status === 413 || status === 415) return 'validation';
  return 'generic';
}
export function getErrorMessage(code: UIErrorCode, copy: Pick<Dictionary, 'errors'>): string {
  return copy.errors[code] ?? copy.errors.generic;
}
