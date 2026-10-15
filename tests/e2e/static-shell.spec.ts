import { expect, test } from '@playwright/test';

test('Chinese content and lang are present without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  expect((await page.goto('/zh'))?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jason');
  await expect(page.locator('#home')).toContainText('工程师');
  await context.close();
});

test('English content is also readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  expect((await page.goto('/en'))?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jason');
  await expect(page.locator('#home')).toContainText('AI Agent');
  await context.close();
});

test('unsupported locales are 404 rather than an English fallback', async ({ request }) => {
  expect((await request.get('/fr')).status()).toBe(404);
});

test('the legacy homepage permanently redirects to English', async ({ request }) => {
  const response = await request.get('/', { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('/en');
});
