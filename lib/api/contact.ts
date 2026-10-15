import { escapeHtml, validateContactForm, type ContactSubmission } from '../../src/api/validation';
import { getClientIp, isAllowedOrigin } from '../../src/api/security';

export interface ContactEmail {
  replyTo: string;
  subject: string;
  html: string;
}

export interface ContactServices {
  verify(token: string, ip: string, hostname: string): Promise<boolean>;
  limit(ip: string): Promise<'allowed' | 'limited' | 'unavailable'>;
  send(email: ContactEmail): Promise<void>;
}

interface ContactRequest {
  method: string;
  headers: Record<string, unknown>;
  body: unknown;
}

interface ContactResult {
  status: number;
  headers: Record<string, string>;
  body?: { success?: boolean; error?: string; code?: string };
}

export function buildContactEmail(data: ContactSubmission): ContactEmail {
  return {
    replyTo: data.email,
    subject: `[Portfolio] ${data.subject.replace(/[\r\n]+/g, ' ')}`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
      <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
      <p>Sent from the portfolio contact form.</p>
    </div>`,
  };
}

export function createContactHandler(services: ContactServices) {
  return async ({ method, headers: requestHeaders, body }: ContactRequest): Promise<ContactResult> => {
    const origin = typeof requestHeaders.origin === 'string' ? requestHeaders.origin : undefined;
    const headers: Record<string, string> = { Vary: 'Origin' };
    const fail = (status: number, error: string, code: string): ContactResult => ({
      status, headers, body: { error, code },
    });

    if (method !== 'POST' && method !== 'OPTIONS') return fail(405, 'Method not allowed', 'VALIDATION');
    if (!isAllowedOrigin(origin)) return fail(403, 'Forbidden', 'VALIDATION');
    headers['Access-Control-Allow-Origin'] = origin!;
    if (method === 'OPTIONS') {
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      return { status: 204, headers };
    }

    const validation = validateContactForm(body);
    if (!validation.ok) return fail(400, validation.error, 'VALIDATION');
    const token = (body as Record<string, unknown>).turnstileToken;
    if (typeof token !== 'string' || !token || token.length > 2048) {
      return fail(403, 'Please complete the verification.', 'VERIFICATION_FAILED');
    }

    const ip = getClientIp(requestHeaders);
    try {
      const limit = await services.limit(ip);
      if (limit === 'unavailable') return fail(503, 'Please try again later.', 'SERVER_ERROR');
      if (limit === 'limited') return fail(429, 'Too many messages. Please try again later.', 'RATE_LIMIT');
    } catch {
      return fail(503, 'Please try again later.', 'SERVER_ERROR');
    }

    try {
      if (!await services.verify(token, ip, new URL(origin!).hostname)) {
        return fail(403, 'Verification failed. Please try again.', 'VERIFICATION_FAILED');
      }
    } catch {
      return fail(403, 'Verification failed. Please try again.', 'VERIFICATION_FAILED');
    }

    try {
      await services.send(buildContactEmail(validation.data));
      return { status: 200, headers, body: { success: true } };
    } catch {
      console.error('Contact mail delivery failed');
      return fail(500, 'Failed to send email.', 'SERVER_ERROR');
    }
  };
}
