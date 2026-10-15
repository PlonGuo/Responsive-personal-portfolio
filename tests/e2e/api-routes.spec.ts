import { expect, test } from '@playwright/test';

for (const path of ['send-email', 'chat', 'github-commits']) {
  test(`${path} rejects a malicious Origin including on OPTIONS`, async ({ request }) => {
    for (const method of ['OPTIONS', path === 'github-commits' ? 'GET' : 'POST']) {
      const response = await request.fetch(`/api/${path}`, {
        method, headers: { Origin: 'https://localhost.evil.example' },
        ...(method === 'POST' && { data: {} }),
      });
      expect(response.status()).toBe(403);
      expect(response.headers()['access-control-allow-origin']).toBeUndefined();
    }
  });
  test(`${path} returns a legal production preflight`, async ({ request }) => {
    const response = await request.fetch(`/api/${path}`, { method: 'OPTIONS', headers: { Origin: 'https://plonguo.com' } });
    expect(response.status()).toBe(204);
    expect(response.headers()['access-control-allow-origin']).toBe('https://plonguo.com');
  });
}

test('write endpoints reject unsupported methods, malformed JSON and missing verification without side effects', async ({ request }) => {
  for (const path of ['send-email', 'chat']) {
    expect((await request.get(`/api/${path}`)).status()).toBe(405);
    const malformed = await request.post(`/api/${path}`, {
      headers: { Origin: 'https://plonguo.com', 'Content-Type': 'application/json' }, data: '{',
    });
    expect(malformed.status()).toBe(400);
    expect(await malformed.json()).toMatchObject({ code: 'VALIDATION' });
  }
  const missing = await request.post('/api/send-email', {
    headers: { Origin: 'https://plonguo.com' },
    data: { name: 'Local test', email: 'test@example.com', subject: 'No token', message: 'Must never send' },
  });
  expect(missing.status()).toBe(403);
  expect(await missing.json()).toMatchObject({ code: 'VERIFICATION_FAILED' });
});

test('production does not enable localhost CORS just for local tests', async ({ request }) => {
  const response = await request.post('/api/send-email', { headers: { Origin: 'http://127.0.0.1:3000' }, data: {} });
  expect(response.status()).toBe(403);
});
