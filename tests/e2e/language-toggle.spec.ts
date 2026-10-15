import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
});

test('one compact language action changes its glyph and keeps focus through switching and history', async ({ page }) => {
  let documents = 0;
  page.on('request', request => { if (request.resourceType() === 'document') documents++; });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  const dock = page.locator('.language-dock');
  await expect(dock.getByRole('button')).toHaveCount(1);
  const toggle = page.locator('#language-desktop-toggle');
  await expect(toggle).toHaveText('中');
  await expect(toggle).toHaveAccessibleName('Switch to Simplified Chinese');
  const box = await dock.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(48); expect(box!.height).toBeGreaterThanOrEqual(44);
  await toggle.click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveText('EN');
  await expect(toggle).toHaveAccessibleName('切换到英语');
  await page.goBack();
  await expect(page).toHaveURL(/\/en$/);
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveText('中');
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/zh$/);
  await expect(toggle).toBeFocused();
  expect(documents).toBe(1);
  await page.screenshot({ path: '/tmp/portfolio-bilingual-evidence/PB-07-compact-language-light.png' });
});

test('the compact article control explains Chinese index on focus without a permanent wide label', async ({ page }) => {
  await page.goto('/en/blog/why-i-chose-cs', { waitUntil: 'domcontentloaded' });
  const index = page.locator('.language-dock').getByRole('link', { name: '中文目录 / Chinese index', exact: true });
  await expect(index).toHaveText('中');
  await expect(index).toHaveAttribute('href', '/zh/blog');
  const tooltip = page.locator('#language-desktop-tooltip');
  await expect(tooltip).not.toBeVisible();
  await index.hover();
  await expect(tooltip).toBeVisible();
  await page.mouse.move(400, 100);
  await expect(tooltip).not.toBeVisible();
  await page.keyboard.press('Tab');
  await index.focus();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText('中文目录 / Chinese index');
  await page.keyboard.press('Escape');
  await expect(tooltip).not.toBeVisible();
  await expect(index).toBeFocused();
  expect((await page.locator('.language-dock').boundingBox())!.width).toBeLessThanOrEqual(48);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/zh\/blog$/);
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
});
