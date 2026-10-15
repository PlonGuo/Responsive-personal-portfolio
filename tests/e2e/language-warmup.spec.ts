import { expect, test } from '@playwright/test';

test('the opposite locale is warmed before interaction and clicking needs no second HEAD', async ({ page }) => {
  await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  let heads = 0;
  await page.route('**/zh**', route => {
    if (route.request().method() !== 'HEAD') return route.continue();
    heads++;
    // A duplicate check at click time cannot finish: the URL change must use the warmed result.
    return heads === 1 ? route.fulfill({ status: 200 }) : new Promise<void>(() => {});
  });
  const warmed = page.waitForResponse(response => response.request().method() === 'HEAD' && new URL(response.url()).pathname === '/zh');
  await page.goto('/en');
  await warmed;
  await expect.poll(() => page.evaluate(() => Boolean(history.state?.__portfolioLanguageEntry))).toBe(true);
  await page.evaluate(() => { (window as Window & { warmDocument?: string }).warmDocument = 'original'; });
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh$/);
  expect(heads).toBe(1);
  expect(await page.evaluate(() => (window as Window & { warmDocument?: string }).warmDocument)).toBe('original');
});

test('dark locale changes never paint a light root frame', async ({ page }) => {
  await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/en');
  await expect.poll(() => page.evaluate(() => Boolean(history.state?.__portfolioLanguageEntry))).toBe(true);
  await page.evaluate(() => {
    const frames: boolean[] = [];
    (window as Window & { darkFrames?: boolean[] }).darkFrames = frames;
    const sample = () => { frames.push(document.documentElement.classList.contains('dark')); requestAnimationFrame(sample); };
    requestAnimationFrame(sample);
  });
  for (const locale of ['zh', 'en', 'zh', 'en']) {
    await page.locator('#language-desktop-toggle').click();
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await expect(page.locator('#language-desktop-toggle')).toBeEnabled();
  }
  const frames = await page.evaluate(() => (window as Window & { darkFrames?: boolean[] }).darkFrames!);
  expect(frames.length).toBeGreaterThan(0);
  expect(frames.every(Boolean)).toBe(true);
});
