import { afterEach, describe, it, expect, vi } from 'vitest';
import { isAllowedOrigin, getClientIp, verifyTurnstile } from '../security';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('isAllowedOrigin', () => {
  it('allows production origins', () => {
    expect(isAllowedOrigin('https://plonguo.com')).toBe(true);
    expect(isAllowedOrigin('https://www.plonguo.com')).toBe(true);
  });

  it('allows localhost on any port for development', () => {
    expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
    expect(isAllowedOrigin('http://localhost:9999')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:3000')).toBe(true);
  });

  it('allows the Vercel preview host', () => {
    expect(isAllowedOrigin('https://jason-portfolio.vercel.app')).toBe(true);
  });

  it('rejects an unrelated site', () => {
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false);
  });

  it('rejects an origin that merely contains the domain as a substring', () => {
    expect(isAllowedOrigin('https://plonguo.com.evil.example.com')).toBe(false);
  });

  it('rejects a missing origin', () => {
    expect(isAllowedOrigin(undefined)).toBe(false);
  });
});

describe('getClientIp', () => {
  it('uses the platform IP instead of a forged Cloudflare header', () => {
    expect(getClientIp({ 'x-vercel-forwarded-for': '203.0.113.5', 'cf-connecting-ip': '10.0.0.1' }))
      .toBe('203.0.113.5');
  });

  it('does not trust client-controlled IP headers on Vercel when its header is missing', () => {
    vi.stubEnv('VERCEL', '1');
    expect(getClientIp({ 'cf-connecting-ip': '203.0.113.5' })).toBe('unknown');
  });

  it('rejects a malformed IP header', () => {
    expect(getClientIp({ 'x-vercel-forwarded-for': 'not-an-ip' })).toBe('unknown');
  });
  it('prefers the Cloudflare header', () => {
    expect(getClientIp({ 'cf-connecting-ip': '203.0.113.5', 'x-forwarded-for': '10.0.0.1' })).toBe(
      '203.0.113.5'
    );
  });

  it('falls back to the first entry of x-forwarded-for', () => {
    expect(getClientIp({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip', () => {
    expect(getClientIp({ 'x-real-ip': '203.0.113.9' })).toBe('203.0.113.9');
  });

  it('returns "unknown" when nothing is present', () => {
    expect(getClientIp({})).toBe('unknown');
  });

  it('handles an array-valued header', () => {
    expect(getClientIp({ 'x-forwarded-for': ['203.0.113.5', '10.0.0.1'] })).toBe('203.0.113.5');
  });
});

describe('Turnstile boundary', () => {
  const valid = { success: true, hostname: 'plonguo.com', action: 'contact' };

  it.each([
    [valid, true],
    [{ ...valid, success: false }, false],
    [{ ...valid, action: 'chat' }, false],
    [{ ...valid, hostname: 'evil.example.com' }, false],
    [{ success: true }, false],
  ])('requires success, hostname and matching action: %j', async (result, expected) => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify(result)));
    expect(await verifyTurnstile('fresh-token', '203.0.113.5', { hostname: 'plonguo.com' }))
      .toBe(expected);
  });

  it('fails closed on upstream failure', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 503 }));
    expect(await verifyTurnstile('fresh-token', 'unknown')).toBe(false);
  });

  it('rejects localhost in a production origin policy', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isAllowedOrigin('http://localhost:5173')).toBe(false);
    expect(isAllowedOrigin('https://plonguo.com')).toBe(true);
  });
});


it.each([undefined, ''])('accepts the legacy chatbot empty action (%s) with a verified hostname', async action => {
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ success: true, hostname: 'plonguo.com', action })));
  expect(await verifyTurnstile('fresh-token', 'unknown', { action: '', hostname: 'plonguo.com' })).toBe(true);
});
