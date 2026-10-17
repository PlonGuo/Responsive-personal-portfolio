import { expect, test } from '@playwright/test';
import en from '../../lib/i18n/messages/en.json' with { type: 'json' };
import zh from '../../lib/i18n/messages/zh.json' with { type: 'json' };

const fixture = 'http://127.0.0.1:3219';
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
});

test('one SDK HTTP stream survives en home → zh home → Lab → blog, close/Escape, drafts and theme', async ({ page, request }) => {
  await request.post(fixture + '/reset');
  await page.route('**/api/chat/v2', route => route.continue({ url: fixture + '/api/chat/v2' }));
  await page.goto('/en');
  const marker = await page.evaluate(() => (window as unknown as Record<string, unknown>).p4DocumentMarker = crypto.randomUUID());
  await page.locator('#contact input[name="name"]').fill('Shared contact draft');
  await page.getByRole('button', { name: en.a11y.darkTheme }).first().click();
  await page.getByRole('button', { name: en.a11y.openChat }).click();
  await page.getByRole('textbox', { name: en.a11y.chatInput, exact: true }).fill('question across every route');
  await page.getByRole('button', { name: en.a11y.sendChat, exact: true }).click();
  await expect(page.getByRole('log')).toContainText('第一段 — English');
  await page.keyboard.press('Escape');
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh$/);
  await page.locator('header').getByRole('link', { name: zh.nav.lab, exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/lab$/);
  await page.locator('header').getByRole('link', { name: zh.nav.blog, exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/blog$/);
  await page.getByRole('button', { name: zh.a11y.openChat }).click();
  await expect(page.getByRole('log')).toContainText('第一段 — English second');
  await expect(page.getByRole('textbox', { name: zh.a11y.chatInput, exact: true })).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).p4DocumentMarker)).toBe(marker);
  const stats = await (await request.get(fixture + '/stats')).json();
  expect(stats).toHaveLength(1); expect(stats[0]).toMatchObject({ protocol: 'v2', messageCount: 1, cancelled: false, done: true });
  expect(stats[0].sessionId).toBeTruthy();
  await page.getByRole('textbox', { name: zh.a11y.chatInput, exact: true }).fill('Shared chat draft');
  await page.getByRole('button', { name: zh.a11y.closeChat }).click();
  await page.locator('header').getByRole('link', { name: zh.nav.home, exact: true }).click();
  await expect(page.locator('#contact input[name="name"]')).toHaveValue('Shared contact draft');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: zh.a11y.openChat }).click();
  await expect(page.getByRole('textbox', { name: zh.a11y.chatInput, exact: true })).toHaveValue('Shared chat draft');
  await page.screenshot({ path: '/tmp/portfolio-phase4-evidence/p4-03-shared-stream.png' });
});

test('an already open legacy client and current SDK UI share HTTP admission; request 31 is limited before model work', async ({ page, context, request }) => {
  await request.post(fixture + '/compat/reset');
  await page.goto(fixture + '/legacy-client');
  const marker = await page.evaluate(() => (window as unknown as Record<string, unknown>).documentMarker);
  const modern = await context.newPage();
  try {
    await modern.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
    await modern.route('**/api/chat/v2', route => route.continue({ url: fixture + '/compat/api/chat/v2' }));
    await modern.goto('/en');
    await modern.getByRole('button', { name: en.a11y.openChat }).click();
    await modern.getByRole('textbox', { name: en.a11y.chatInput, exact: true }).fill('new SDK client');
    await modern.getByRole('button', { name: en.a11y.sendChat, exact: true }).click();
    await expect(modern.getByRole('log')).toContainText('compat reply');
    const sendLegacy = () => page.evaluate(() => (window as unknown as { sendLegacy(message: string): Promise<number> }).sendLegacy('old page still works'));
    expect(await sendLegacy()).toBe(200);
    await expect(page.locator('#reply')).toHaveText('compat reply');
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).documentMarker)).toBe(marker);
    for (let i = 0; i < 28; i++) {
      const v2 = i % 2 === 0;
      const response = await request.post(fixture + `/compat/api/chat${v2 ? '/v2' : ''}`, {
        headers: { Origin: 'https://www.plonguo.com' }, data: v2
          ? { sessionId: `v2-${i}`, messages: [{ id: `m${i}`, role: 'user', parts: [{ type: 'text', text: 'hello' }] }] }
          : { sessionId: `old-${i}`, message: 'hello', history: [] },
      });
      expect(response.status()).toBe(200); await response.body();
    }
    expect(await sendLegacy()).toBe(429);
    await modern.getByRole('textbox', { name: en.a11y.chatInput, exact: true }).fill('fresh session cannot reset quota');
    await modern.getByRole('button', { name: en.a11y.sendChat, exact: true }).click();
    await expect(modern.getByRole('dialog', { name: en.a11y.chatDialog }).getByRole('alert')).toHaveText(en.errors.rateLimit);
    const stats = await (await request.get(fixture + '/compat/stats')).json();
    expect(stats.providerCalls).toBe(30); expect(stats.settlements).toBe(30); expect(stats.quotaCount).toBe(32);
    expect(new Set(stats.requests.map((item: { protocol: string }) => item.protocol))).toEqual(new Set(['legacy', 'v2']));
  } finally { await modern.close(); }
});
