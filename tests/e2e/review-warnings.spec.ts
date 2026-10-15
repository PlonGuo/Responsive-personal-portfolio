import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
});

test('closing a focused mobile language menu does not hide the active control from accessibility', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const browserWarnings: string[] = [];
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Log.enable');
  await cdp.send('Accessibility.enable');
  cdp.on('Log.entryAdded', ({ entry }) => {
    if (/Blocked aria-hidden/.test(entry.text)) browserWarnings.push(entry.text);
  });
  await page.goto('/zh');
  await expect.poll(() => page.evaluate(() => Boolean(history.state?.__portfolioLanguageEntry))).toBe(true);
  await cdp.send('Accessibility.getFullAXTree');
  const trigger = page.locator('#mobile-menu-toggle');
  await trigger.click();
  await page.locator('#language-menu-en').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/en$/);
  await expect(trigger).toBeFocused();
  await expect(page.locator('#mobile-navigation')).toHaveAttribute('inert', '');
  await expect(page.locator('#mobile-navigation')).toHaveAttribute('aria-hidden', 'true');
  await cdp.send('Accessibility.getFullAXTree');
  expect(browserWarnings).toEqual([]);
  // The same close behavior must apply when selecting an ordinary menu link.
  await trigger.click();
  await page.locator('#mobile-navigation').getByRole('link', { name: 'Blog', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/en\/blog$/);
  await expect(trigger).toBeFocused();
  await cdp.send('Accessibility.getFullAXTree');
  expect(browserWarnings).toEqual([]);
});

test('the browser default favicon URL returns a valid icon without a language redirect', async ({ request }) => {
  const response = await request.get('/favicon.ico', { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/image\/(x-icon|vnd.microsoft.icon)/);
  const bytes = await response.body();
  expect([...bytes.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
});

test('both site fonts remain used after language changes without unused-preload or decoder warnings', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Log.enable'); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const fontWarnings: string[] = [];
  cdp.on('Log.entryAdded', ({ entry }) => {
    if (/preloaded.*not used|OTS parsing|Failed to decode downloaded font/i.test(entry.text)) fontWarnings.push(entry.text);
  });
  await page.goto('/zh');
  await expect.poll(() => page.evaluate(() => Boolean(history.state?.__portfolioLanguageEntry))).toBe(true);
  for (const [index, locale] of ['zh', 'en', 'zh'].entries()) {
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await page.evaluate(() => document.fonts.ready);
    const { root } = await cdp.send('DOM.getDocument');
    for (const selector of ['h1', '#home p']) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      expect(fonts.some(font => font.isCustomFont && /noto.*sans.*sc/i.test(font.familyName))).toBe(true);
    }
    if (index < 2) await page.locator('#language-desktop-toggle').click();
  }
  // This is the browser's warning deadline, rather than an application readiness wait.
  await page.waitForTimeout(6500);
  expect(fontWarnings).toEqual([]);
});
