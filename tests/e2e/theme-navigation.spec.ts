import { expect, test } from '@playwright/test';

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
test(`language navigation preserves the live theme without rendering script tags again (${reducedMotion})`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /Encountered a script tag|hydration|hydrated|server rendered/i.test(message.text())) errors.push(message.text());
  });
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  await page.emulateMedia({ reducedMotion, colorScheme: 'light' });
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect.poll(() => page.evaluate(() => Boolean(history.state?.__portfolioLanguageEntry))).toBe(true);
  // Changing the saved preference after hydration detects accidental bootstrap
  // re-execution: client navigation must preserve the live in-memory dark theme.
  await page.evaluate(() => localStorage.setItem('theme', 'light'));
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(errors).toEqual([]);
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.goBack();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(errors).toEqual([]);
});
}
