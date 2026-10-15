import { describe, expect, it } from 'vitest';
import { createContactHandler, type ContactEmail } from '../../../lib/api/contact';

const submission = {
  name: 'Jane <script>', email: 'jane@example.com', subject: 'Hello\r\nBcc: injected',
  message: '<img src=x onerror="alert(1)">', turnstileToken: 'fresh-token',
};
const request = { method: 'POST', headers: { origin: 'https://plonguo.com' }, body: submission };

function setup(limit: 'allowed' | 'limited' | 'unavailable' = 'allowed', verified = true) {
  const emails: ContactEmail[] = [];
  const handle = createContactHandler({
    verify: async () => verified,
    limit: async () => limit,
    send: async email => { emails.push(email); },
  });
  return { handle, emails };
}

describe('contact request boundary', () => {
  it('sends only escaped HTML and removes mail header newlines', async () => {
    const { handle, emails } = setup();
    expect((await handle(request)).status).toBe(200);
    expect(emails).toHaveLength(1);
    expect(emails[0].html).toContain('Jane &lt;script&gt;');
    expect(emails[0].html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(emails[0].html).not.toContain('<img src=x');
    expect(emails[0].subject).toBe('[Portfolio] Hello Bcc: injected');
    expect(emails[0].replyTo).toBe('jane@example.com');
  });

  it('rejects a missing Turnstile token without sending mail', async () => {
    const { handle, emails } = setup();
    const result = await handle({ ...request, body: { ...submission, turnstileToken: '' } });
    expect(result.status).toBe(403);
    expect(emails).toHaveLength(0);
  });

  it('rejects invalid tokens without sending mail', async () => {
    const { handle, emails } = setup('allowed', false);
    expect((await handle(request)).status).toBe(403);
    expect(emails).toHaveLength(0);
  });

  it.each(['https://evil.example.com', 'https://plonguo.com.evil.example.com', undefined])(
    'rejects disallowed origin %s', async origin => {
      const { handle, emails } = setup();
      expect((await handle({ ...request, headers: { origin } })).status).toBe(403);
      expect(emails).toHaveLength(0);
    },
  );

  it('rejects malformed bodies', async () => {
    const { handle, emails } = setup();
    expect((await handle({ ...request, body: null })).status).toBe(400);
    expect(emails).toHaveLength(0);
  });

  it.each([['limited', 429], ['unavailable', 503]] as const)(
    'rejects when limiter is %s', async (limit, status) => {
      const { handle, emails } = setup(limit);
      expect((await handle(request)).status).toBe(status);
      expect(emails).toHaveLength(0);
    },
  );

  it('permits a legal preflight and rejects a hostile preflight', async () => {
    const { handle, emails } = setup();
    const valid = await handle({ ...request, method: 'OPTIONS' });
    expect(valid.status).toBe(204);
    expect(valid.headers['Access-Control-Allow-Origin']).toBe('https://plonguo.com');
    expect((await handle({ ...request, method: 'OPTIONS', headers: { origin: 'https://evil.example.com' } })).status)
      .toBe(403);
    expect(emails).toHaveLength(0);
  });

  it('rejects unsupported methods', async () => {
    expect((await setup().handle({ ...request, method: 'GET' })).status).toBe(405);
  });
});
