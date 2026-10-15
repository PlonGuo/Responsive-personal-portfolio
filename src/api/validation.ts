export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const MAX_NAME = 200;
const MAX_SUBJECT = 300;
const MAX_MESSAGE = 5000;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape for safe interpolation into an HTML email body.
 * Ampersand is handled by the same single pass, so `&lt;` becomes `&amp;lt;`
 * rather than being re-decoded.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * Deliberately strict: no whitespace anywhere, one @, a dotted domain,
 * and no control characters (which is what blocks header-injection attempts).
 */
export function isValidEmail(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > 254) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(value)) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value);
}

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) return null;
  return trimmed;
}

export function validateContactForm(
  body: unknown
): { ok: true; data: ContactSubmission } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Invalid request body' };
  }

  const raw = body as Record<string, unknown>;

  const name = asTrimmedString(raw.name, MAX_NAME);
  if (!name) return { ok: false, error: 'Name is required' };

  const email = asTrimmedString(raw.email, 254);
  if (!email) return { ok: false, error: 'Email is required' };
  if (!isValidEmail(email)) return { ok: false, error: 'Email is not valid' };

  const subject = asTrimmedString(raw.subject, MAX_SUBJECT);
  if (!subject) return { ok: false, error: 'Subject is required' };

  const message = asTrimmedString(raw.message, MAX_MESSAGE);
  if (!message) return { ok: false, error: 'Message is required' };

  return { ok: true, data: { name, email, subject, message } };
}
