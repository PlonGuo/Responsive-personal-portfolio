import { isIP } from 'node:net';

export const ALLOWED_ORIGINS: readonly string[] = [
  'https://plonguo.com',
  'https://www.plonguo.com',
  'https://jason-portfolio.vercel.app',
];

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const url = new URL(origin);
    return url.origin === origin
      && (url.protocol === 'http:' || url.protocol === 'https:')
      && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

export function getClientIp(headers: Record<string, unknown>): string {
  const pick = (name: string): string | undefined => {
    const value = headers[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim();
    return undefined;
  };

  const platformIp = pick('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  if (platformIp || process.env.VERCEL === '1') {
    return platformIp && isIP(platformIp) ? platformIp : 'unknown';
  }

  const forwardedIp = pick('cf-connecting-ip')
    ?? pick('x-forwarded-for')?.split(',')[0]?.trim()
    ?? pick('x-real-ip')
    ?? 'unknown';
  return isIP(forwardedIp) ? forwardedIp : 'unknown';
}

interface VerificationOptions {
  action?: string;
  hostname?: string;
}

export async function verifyTurnstile(
  token: string,
  ip: string,
  { action = 'contact', hostname }: VerificationOptions = {},
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token || token.length > 2048) return false;

  const hostnames = new Set(ALLOWED_ORIGINS.map(origin => new URL(origin).hostname));
  if (process.env.NODE_ENV !== 'production') {
    hostnames.add('localhost');
    hostnames.add('127.0.0.1');
  }
  if (hostname && !hostnames.has(hostname)) return false;

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ secret, response: token, ...(ip !== 'unknown' && { remoteip: ip }) }),
    });
    if (!response.ok) return false;
    const result: { success?: boolean; hostname?: string; action?: string } = await response.json();
    return result.success === true
      && (result.action ?? '') === action
      && typeof result.hostname === 'string'
      && (hostname ? result.hostname === hostname : hostnames.has(result.hostname));
  } catch {
    console.error('Turnstile verification could not be completed');
    return false;
  }
}
