import { expect, test } from '@playwright/test';

test('hydrated pages retain server content and have no hydration errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /hydration|hydrated|server rendered/i.test(message.text())) errors.push(message.text());
  });
  for (const path of ['/en', '/zh', '/en/lab', '/zh/lab', '/en/blog', '/zh/blog']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('blog filters read and update the URL without reloading', async ({ page }) => {
  await page.goto('/zh/blog?tag=not-a-real-tag');
  await expect(page.getByRole('status')).toContainText('暂无文章');
  await page.evaluate(() => { (window as Window & { documentMarker?: boolean }).documentMarker = true; });
  await page.getByRole('button', { name: '全部', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/blog$/);
  const all = await page.locator('main a[href^="/en/blog/"]').count();
  expect(all).toBe(9);
  const tags = page.locator('main').getByRole('button').filter({ hasNotText: '全部' });
  const tag = await tags.first().innerText();
  await tags.first().click();
  await expect(page).toHaveURL(new RegExp('tag='));
  expect(await page.locator('main a[href^="/en/blog/"]').count()).toBeLessThan(all);
  await expect(page.getByRole('button', { name: tag, exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => (window as Window & { documentMarker?: boolean }).documentMarker)).toBe(true);
});

test('saved theme recovers after hydration and survives a refresh', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/en');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Switch to light mode' }).first()).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('reduced motion displays the full first Hero phrase', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /hydration|hydrated|server rendered/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/zh');
  await expect(page.locator('#home')).toContainText('AI Agent');
  const line = page.locator('[data-typewriter]');
  await expect(line).toHaveText('过汇智融|');
  const initial = await line.textContent();
  await page.waitForTimeout(2200);
  expect(await line.textContent()).toBe(initial);
  expect(errors).toEqual([]);
  await context.close();
});

for (const width of [375, 768, 1440]) {
  test(`pages fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/en', '/zh', '/zh/lab', '/zh/blog']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
      const header = await page.locator('header nav').boundingBox();
      const brand = await page.locator('header nav a').first().boundingBox();
      expect(brand!.x).toBeGreaterThanOrEqual(header!.x);
      const avatars = await page.locator('header img:visible').all();
      for (const avatar of avatars) {
        const box = (await avatar.boundingBox())!;
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      await page.screenshot({ path: `/tmp/portfolio-bilingual-evidence/PB-04-${width}-${path.replaceAll('/', '-')}.png` });
    }
  });
}


test('theme controls still work when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', { value() { throw new DOMException('Blocked', 'SecurityError'); } });
    Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/en');
  await page.getByRole('button', { name: 'Switch to dark mode' }).first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(errors).toEqual([]);
});

test('mobile Lab menu returns home through client navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/zh/lab');
  await page.evaluate(() => { (window as Window & { documentMarker?: boolean }).documentMarker = true; });
  await page.getByRole('button', { name: '展开或关闭菜单', exact: true }).click();
  const menu = page.locator('#mobile-navigation');
  await expect(menu).toHaveAttribute('aria-hidden', 'false');
  await menu.getByRole('link', { name: '首页', exact: true }).click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator('#about')).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { documentMarker?: boolean }).documentMarker)).toBe(true);
});

test('a lowercase tag URL also marks the matching filter as selected', async ({ page }) => {
  await page.goto('/zh/blog?tag=ai');
  await expect(page.getByRole('button', { name: 'AI', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('reduced motion switches projects immediately and scrolls without animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/en');
  const section = page.locator('#portfolio');
  await section.scrollIntoViewIfNeeded();
  await section.getByRole('button', { name: 'Next project' }).click();
  await expect(section.getByRole('heading', { name: /SmIA/ })).toBeVisible({ timeout: 200 });
  await page.evaluate(() => {
    const state = window as Window & { lastScroll?: ScrollBehavior };
    Element.prototype.scrollIntoView = function(options) {
      state.lastScroll = typeof options === 'object' ? options.behavior : undefined;
    };
  });
  await page.getByRole('button', { name: 'Scroll to About section' }).click();
  expect(await page.evaluate(() => (window as Window & { lastScroll?: ScrollBehavior }).lastScroll)).toBe('auto');
  await context.close();
});
