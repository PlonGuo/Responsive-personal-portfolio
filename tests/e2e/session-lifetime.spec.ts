import { expect, test } from '@playwright/test';
import zh from '../../lib/i18n/messages/zh.json' with { type: 'json' };
const fixture = 'http://127.0.0.1:3219';

test('mounted widgets do not issue chat, email or updates requests before interaction', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => { if (/\/api\/(chat(?:\/v2)?|send-email|github-commits)$/.test(request.url())) requests.push(request.url()); });
  await page.goto('/zh');
  await expect(page.getByRole('button', { name: zh.a11y.openChat })).toBeVisible();
  await expect(page.getByRole('button', { name: zh.a11y.updates })).toBeVisible();
  expect(requests).toEqual([]);
});

test('delayed real HTTP SSE, drafts and theme survive navigation away from home', async ({ page, request }) => {
  await request.post(fixture + '/reset');
  await page.route('**/api/chat/v2', route => route.continue({ url: fixture + '/api/chat/v2' }));
  await page.goto('/zh');
  await page.locator('#contact').getByRole('textbox', { name: zh.forms.name, exact: true }).fill('Jason draft');
  await page.locator('#contact').getByRole('textbox', { name: zh.forms.message, exact: true }).fill('contact message draft');
  await page.getByRole('button', { name: zh.a11y.darkTheme }).first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: zh.a11y.openChat }).click();
  await page.getByRole('textbox', { name: zh.a11y.chatInput }).fill('question');
  await page.getByRole('button', { name: zh.a11y.sendChat, exact: true }).click();
  await expect(page.getByRole('log')).toContainText('第一段 — English');
  await page.getByRole('button', { name: zh.a11y.closeChat }).click();
  await page.locator('header').getByRole('link', { name: zh.nav.lab, exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/lab$/);
  await page.getByRole('button', { name: zh.a11y.openChat }).click();
  await expect(page.getByRole('log')).toContainText('第一段 — English second');
  await page.getByRole('textbox', { name: zh.a11y.chatInput }).fill('chat draft retained');
  await page.getByRole('button', { name: zh.a11y.closeChat }).click();
  await page.locator('header').getByRole('link', { name: zh.nav.home, exact: true }).click();
  await expect(page.locator('#contact').getByRole('textbox', { name: zh.forms.name, exact: true })).toHaveValue('Jason draft');
  await expect(page.locator('#contact').getByRole('textbox', { name: zh.forms.message, exact: true })).toHaveValue('contact message draft');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: zh.a11y.openChat }).click();
  await expect(page.getByRole('textbox', { name: zh.a11y.chatInput })).toHaveValue('chat draft retained');
  await page.getByRole('button', { name: zh.a11y.sendChat, exact: true }).click();
  await expect.poll(async () => (await (await request.get(fixture + '/stats')).json()).filter((item: { done: boolean }) => item.done).length).toBe(2);
  const stats = await (await request.get(fixture + '/stats')).json();
  expect(stats).toHaveLength(2);
  expect(stats[0].sessionId).toBeTruthy();
  expect(stats[1].sessionId).toBe(stats[0].sessionId);
  expect(stats.map((item: { cancelled: boolean }) => item.cancelled)).toEqual([false, false]);
});

test('explicit stop cancels the fixture connection and unlocks the input', async ({ page, request }) => {
  await request.post(fixture + '/reset');
  await page.route('**/api/chat/v2', route => route.continue({ url: fixture + '/api/chat/v2' }));
  await page.goto('/en');
  await page.getByRole('button', { name: 'Open chat assistant' }).click();
  await page.getByRole('textbox', { name: 'Type your message', exact: true }).fill('stop test');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('第一段');
  await page.getByRole('button', { name: 'Stop response' }).click();
  await expect(page.getByRole('textbox', { name: 'Type your message', exact: true })).toBeEnabled();
  await expect.poll(async () => (await (await request.get(fixture + '/stats')).json())[0]?.cancelled).toBe(true);
});

test('Chinese updates translate UI/errors while retaining the original commit message', async ({ page }) => {
  let fetches = 0;
  await page.route('**/api/github-commits', route => route.fulfill({
    status: fetches++ ? 429 : 200, contentType: 'application/json',
    body: JSON.stringify(fetches === 1 ? { commits: [{ sha: 'abc1234', message: 'feat: keep English commit message', date: new Date().toISOString(), author: 'Jason', url: 'https://github.com/PlonGuo/Responsive-personal-portfolio/commit/abc1234' }] } : { code: 'RATE_LIMIT', error: 'private stack never shown' }),
  }));
  await page.goto('/zh');
  await page.getByRole('button', { name: zh.a11y.updates }).click();
  const dialog = page.getByRole('dialog', { name: zh.updates.title });
  await expect(dialog).toContainText('feat: keep English commit message');
  await dialog.getByRole('button', { name: zh.a11y.refresh }).click();
  await expect(dialog.getByRole('alert')).toHaveText(zh.errors.rateLimit);
  await expect(dialog).not.toContainText('private stack');
  await dialog.getByRole('button', { name: zh.a11y.close, exact: true }).click();
  await expect(page.getByRole('button', { name: zh.a11y.updates })).toBeFocused();
});

test('saved dark theme applies before application hydration starts', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.route('**/_next/static/**/*.js', route => route.abort());
  await page.goto('/zh', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(15, 23, 42)');
});

test('mobile chat fits the viewport, cycles focus and returns focus on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/zh');
  await page.getByRole('button', { name: zh.a11y.openChat }).click();
  const dialog = page.getByRole('dialog', { name: zh.a11y.chatDialog });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox')).toBeFocused();
  const close = dialog.getByRole('button', { name: zh.a11y.closeChat });
  await close.focus(); await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('textbox')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  await expect.poll(async () => {
    const box = (await dialog.boundingBox())!;
    return [box.x, box.width, box.height].map(Math.round);
  }).toEqual([0, 375, 900]);
  await page.screenshot({ path: '/tmp/portfolio-bilingual-evidence/PB-05-mobile-chat.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: zh.a11y.openChat })).toBeFocused();
});

test('a pending contact submission completes once after leaving and returning', async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/**', route => route.abort());
  await page.addInitScript(() => {
    window.turnstile = {
      render: (_container, options) => { setTimeout(() => options.callback('fixture-token'), 0); return 'fixture-widget'; },
      reset: () => {}, remove: () => {},
    };
  });
  let requests = 0;
  let deliver!: () => Promise<void>;
  let started!: () => void;
  const submitted = new Promise<void>(resolve => { started = resolve; });
  await page.route('**/api/send-email', route => {
    requests += 1;
    deliver = () => route.fulfill({ contentType: 'application/json', body: '{"success":true}' });
    started();
  });
  await page.goto('/en');
  const contact = page.locator('#contact');
  await contact.getByRole('textbox', { name: 'Your Name', exact: true }).fill('Fixture');
  await contact.getByRole('textbox', { name: 'Your Email', exact: true }).fill('fixture@example.com');
  await contact.getByRole('textbox', { name: 'Subject', exact: true }).fill('Fixture only');
  await contact.getByRole('textbox', { name: 'Your Message', exact: true }).fill('Not a real email');
  await contact.getByRole('button', { name: 'Send Message', exact: true }).click();
  await submitted;
  await page.locator('header').getByRole('link', { name: 'Lab', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/lab$/);
  await expect(page.getByRole('heading', { name: 'The Lab', exact: true })).toBeVisible();
  await page.locator('header').getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(contact.getByRole('button', { name: 'Sending...' })).toBeDisabled();
  await deliver();
  await expect(contact.getByRole('button', { name: 'Message Sent!' })).toBeVisible();
  await expect(contact.getByRole('textbox', { name: 'Your Name', exact: true })).toHaveValue('');
  await expect(contact.getByRole('button', { name: 'Send Message', exact: true })).toBeVisible({ timeout: 5000 });
  expect(requests).toBe(1);
});
