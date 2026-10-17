import { expect, test } from '@playwright/test';
import en from '../../lib/i18n/messages/en.json' with { type: 'json' };

test.beforeEach(async ({ page }) => {
  // These cases inject cold-route failures. Do not let eager prefetch satisfy
  // the destination before the fault is installed; warm-cache success has its own suite.
  await page.route('**/*', route => {
    const headers = route.request().headers();
    return headers['next-router-prefetch'] || headers['next-router-segment-prefetch']
      ? route.abort('failed') : route.fallback();
  });
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
});

for (const failure of ['network', 'HTTP', 'corrupt-flight'] as const) {
test(`a ${failure} route failure after a successful HEAD retains the page and draft and can retry`, async ({ page }) => {
  let documents = 0;
  page.on('request', request => { if (request.resourceType() === 'document') documents++; });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { (window as Window & { languageMarker?: string }).languageMarker = 'same-document'; });
  await page.locator('#contact').getByRole('textbox', { name: 'Your Name', exact: true }).fill('Keep this draft');
  let fail = true;
  await page.route('**/zh**', route => {
    if (route.request().method() === 'HEAD') return route.fulfill({ status: 200 });
    if (fail && route.request().headers().rsc === '1') {
      if (failure === 'network') return route.abort('failed');
      return failure === 'HTTP' ? route.fulfill({ status: 503 })
        : route.fulfill({ status: 200, contentType: 'text/x-component', body: 'invalid route payload\n' });
    }
    return route.continue();
  });
  await page.locator('#language-desktop-toggle').click();
  await expect(page.locator('.language-notice [role="alert"]')).toHaveText(en.errors.navigation);
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('#contact').getByRole('textbox', { name: 'Your Name', exact: true })).toHaveValue('Keep this draft');
  expect(await page.evaluate(() => (window as Window & { languageMarker?: string }).languageMarker)).toBe('same-document');
  expect(documents).toBe(1);
  fail = false;
  await page.getByRole('button', { name: en.forms.retry, exact: true }).click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator('#contact input[name="name"]')).toHaveValue('Keep this draft');
  expect(documents).toBe(1);
});
}

test('changing a blog filter cancels a delayed language preflight and uses the newer query on retry', async ({ page }) => {
  let resolve!: () => void;
  const delayed = new Promise<void>(done => { resolve = done; });
  let heads = 0;
  await page.route('**/zh/blog**', async route => {
    if (route.request().method() === 'HEAD' && heads++ === 0) { await delayed; await route.fulfill({ status: 200 }).catch(() => {}); }
    else await route.continue();
  });
  await page.goto('/en/blog?tag=AI', { waitUntil: 'domcontentloaded' });
  await page.locator('#language-desktop-toggle').click();
  await expect.poll(() => heads).toBe(1);
  await page.getByRole('button', { name: 'React', exact: true }).click();
  resolve();
  await expect(page.locator('#language-desktop-toggle')).toBeEnabled();
  await expect(page).toHaveURL(/\/en\/blog\?tag=React$/);
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh\/blog\?tag=React$/);
});

test('a failed language request cannot overwrite a newer ordinary navigation', async ({ page }) => {
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  let rejectLanguage!: () => void; let releaseLab!: () => void;
  const languageDelay = new Promise<void>(done => { rejectLanguage = done; });
  const labDelay = new Promise<void>(done => { releaseLab = done; });
  let requested = false;
  await page.route('**/zh**', async route => {
    if (route.request().method() === 'HEAD') return route.fulfill({ status: 200 });
    const headers = route.request().headers();
    if (headers.rsc === '1' && !headers['next-router-prefetch'] && !headers['next-router-segment-prefetch']) {
      requested = true; await languageDelay; await route.abort('failed').catch(() => {});
    } else await route.abort('failed');
  });
  await page.route('**/en/lab**', async route => { await labDelay; await route.continue().catch(() => {}); });
  await page.locator('#language-desktop-toggle').click();
  await expect.poll(() => requested).toBe(true);
  await page.locator('header').getByRole('link', { name: 'Lab', exact: true }).click();
  rejectLanguage();
  await expect(page.locator('#language-desktop-toggle')).toBeEnabled();
  await expect(page.locator('.language-notice [role="alert"]')).not.toBeVisible();
  releaseLab();
  await expect(page).toHaveURL(/\/en\/lab$/);
});

test('changing a filter during the route request supersedes the old language transition', async ({ page }) => {
  await page.goto('/en/blog?tag=AI', { waitUntil: 'domcontentloaded' });
  let resolve!: () => void; let requested = false;
  const delayed = new Promise<void>(done => { resolve = done; });
  await page.route('**/zh/blog**', async route => {
    if (route.request().method() === 'HEAD') return route.fulfill({ status: 200 });
    const headers = route.request().headers();
    if (headers.rsc === '1' && !headers['next-router-prefetch'] && !headers['next-router-segment-prefetch']) {
      requested = true; await delayed; await route.continue().catch(() => {});
    } else await route.abort('failed');
  });
  await page.locator('#language-desktop-toggle').click();
  await expect.poll(() => requested).toBe(true);
  await page.getByRole('button', { name: 'React', exact: true }).click();
  resolve();
  await expect(page.locator('#language-desktop-toggle')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'React', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/\/en\/blog\?tag=React$/);
  await page.locator('header').getByRole('link', { name: 'Lab', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/lab$/);
});

test('older engines keep the source instead of risking a document reload', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'navigation', { value: undefined }));
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.locator('#contact input[name="name"]').fill('Older engine draft');
  await page.locator('#language-desktop-toggle').click();
  await expect(page.locator('.language-notice [role="alert"]')).toHaveText(en.errors.navigation);
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('#contact input[name="name"]')).toHaveValue('Older engine draft');
});

test('a visited chapter stays visible without replaying its entrance when the language changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const samples: number[] = [];
    (window as Window & { sectionOpacities?: number[] }).sectionOpacities = samples;
    const sample = () => {
      const element = document.querySelector('[data-section="qualifications"]');
      if (element) samples.push(Number(getComputedStyle(element).opacity));
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.locator('#qualifications').scrollIntoViewIfNeeded();
  const samples = () => page.evaluate(() => (window as Window & { sectionOpacities?: number[] }).sectionOpacities ?? []);
  await expect.poll(async () => (await samples()).some(value => value < 0.99)).toBe(true);
  await expect(page.locator('[data-section="qualifications"]')).toHaveCSS('opacity', '1');
  await page.evaluate(() => { (window as Window & { sectionOpacities?: number[] }).sectionOpacities!.length = 0; });
  await page.locator('#language-desktop-toggle').click();
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
  const count = (await samples()).length;
  await expect.poll(async () => (await samples()).length).toBeGreaterThan(count + 20);
  expect((await samples()).every(value => value === 1)).toBe(true);
});

test('failed prefetch is optional and does not prevent a normal switch', async ({ page }) => {
  let prefetches = 0;
  await page.route('**/zh**', route => {
    const headers = route.request().headers();
    if (headers['next-router-prefetch'] || headers['next-router-segment-prefetch']) {
      prefetches++; return route.abort('failed');
    }
    return route.continue();
  });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.locator('#language-desktop-toggle').hover();
  await expect.poll(() => prefetches).toBeGreaterThan(0);
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
});

test('desktop offers a compact language action and navigates without replacing the document', async ({ page }) => {
  let documents = 0;
  page.on('request', request => { if (request.resourceType() === 'document') documents++; });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { (window as Window & { languageMarker?: string }).languageMarker = 'same-document'; });
  const switcher = page.locator('.language-dock');
  await expect(switcher.getByRole('button')).toHaveCount(1);
  await expect(switcher.getByRole('button')).toHaveAccessibleName(en.a11y.switchToChinese);
  await switcher.getByRole('button').click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
  expect(await page.evaluate(() => (window as Window & { languageMarker?: string }).languageMarker)).toBe('same-document');
  expect(documents).toBe(1);
});

test('home keeps the chapter, query, hash and relative position through switching, back and forward', async ({ page }) => {
  await page.goto('/en?ref=review#qualifications', { waitUntil: 'domcontentloaded' });
  await page.locator('#qualifications').evaluate(element => {
    const box = element.getBoundingClientRect(); window.scrollTo({ top: scrollY + box.top + box.height * 0.35 - 80, behavior: 'instant' });
  });
  const ratio = () => page.locator('#qualifications').evaluate(element => (80 - element.getBoundingClientRect().top) / element.getBoundingClientRect().height);
  const before = await ratio();
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh\?ref=review#qualifications$/);
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
  expect(await ratio()).toBeCloseTo(before, 2);
  await page.goBack();
  await expect(page).toHaveURL(/\/en\?ref=review#qualifications$/);
  await expect.poll(ratio).toBeCloseTo(before, 2);
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
  await page.goForward();
  await expect(page).toHaveURL(/\/zh\?ref=review#qualifications$/);
  await expect.poll(ratio).toBeCloseTo(before, 2);
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
});

for (const path of ['/en/lab', '/en/blog?tag=AI']) {
  test(`keeps the page and scroll position for ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    const y = await page.evaluate(() => scrollY);
    await page.locator('#language-desktop-toggle').click();
    await expect(page).toHaveURL(new RegExp(path.replace('/en', '/zh').replace('?', '\\?') + '$'));
    await expect(page.locator('#language-desktop-toggle')).toBeFocused();
    expect(Math.abs(await page.evaluate(() => scrollY) - y)).toBeLessThanOrEqual(2);
    if (path.includes('blog')) await expect(page.getByRole('button', { name: 'AI', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });
}

test('mobile uses only the menu and restores keyboard focus to its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#language-desktop-toggle')).not.toBeVisible();
  const trigger = page.locator('#mobile-menu-toggle');
  await page.locator('#qualifications').evaluate(element => {
    const box = element.getBoundingClientRect(); window.scrollTo({ top: scrollY + box.top + box.height * 0.25 - 80, behavior: 'instant' });
  });
  const before = await page.locator('#qualifications').evaluate(element => (80 - element.getBoundingClientRect().top) / element.getBoundingClientRect().height);
  await trigger.focus(); await page.keyboard.press('Enter');
  await page.locator('#language-menu-zh').focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/zh$/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  const after = await page.locator('#qualifications').evaluate(element => (80 - element.getBoundingClientRect().top) / element.getBoundingClientRect().height);
  expect(after).toBeCloseTo(before, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await trigger.click();
  await expect(page.locator('#mobile-navigation')).toHaveCSS('max-height', '500px');
  await page.screenshot({ path: '/tmp/portfolio-bilingual-evidence/PB-06-mobile-language.png' });
});

test('768px uses the dock even though the navigation is still collapsed', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.locator('#mobile-menu-toggle').click();
  await expect(page.locator('#language-desktop-toggle')).toBeVisible();
  await expect(page.locator('#language-menu-zh')).not.toBeVisible();
  await page.locator('#language-desktop-toggle').focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
  await expect(page.locator('#mobile-menu-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('an unavailable HEAD retains drafts, exposes a translated error and retries', async ({ page }) => {
  let fail = true;
  await page.route('**/zh**', route => route.request().method() === 'HEAD' && fail ? route.fulfill({ status: 503 }) : route.continue());
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.locator('#contact input[name="subject"]').fill('Subject draft');
  await page.locator('#language-desktop-toggle').click();
  await expect(page.locator('.language-notice [role="alert"]')).toHaveText(en.errors.navigation);
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('#contact input[name="subject"]')).toHaveValue('Subject draft');
  fail = false;
  await page.getByRole('button', { name: en.forms.retry, exact: true }).click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator('#contact input[name="subject"]')).toHaveValue('Subject draft');
});

test('a delayed HTTP stream, theme and drafts survive actual language switches with a stable session', async ({ page, request }) => {
  const fixture = 'http://127.0.0.1:3219';
  await request.post(fixture + '/reset');
  await page.route('**/api/chat/v2', route => route.continue({ url: fixture + '/api/chat/v2' }));
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.locator('#contact input[name="name"]').fill('Contact draft');
  await page.getByRole('button', { name: en.a11y.darkTheme }).first().click();
  await page.getByRole('button', { name: en.a11y.openChat }).click();
  await page.getByRole('textbox', { name: en.a11y.chatInput, exact: true }).fill('stream while switching');
  await page.getByRole('button', { name: en.a11y.sendChat, exact: true }).click();
  await expect(page.getByRole('log')).toContainText('第一段 — English');
  await expect(page.getByRole('button', { name: en.a11y.stopChat })).toBeVisible();
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.getByRole('log')).toContainText('第一段 — English second');
  await expect(page.locator('#contact input[name="name"]')).toHaveValue('Contact draft');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('textbox', { name: '输入问题', exact: true }).fill('聊天 draft');
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole('textbox', { name: en.a11y.chatInput, exact: true })).toHaveValue('聊天 draft');
  await page.getByRole('button', { name: en.a11y.sendChat, exact: true }).click();
  await expect.poll(async () => (await (await request.get(fixture + '/stats')).json()).filter((item: { done: boolean }) => item.done).length).toBe(2);
  const stats = await (await request.get(fixture + '/stats')).json();
  expect(stats).toHaveLength(2); expect(stats[0].sessionId).toBeTruthy();
  expect(stats[1].sessionId).toBe(stats[0].sessionId);
  expect(stats.map((item: { cancelled: boolean }) => item.cancelled)).toEqual([false, false]);
  await page.screenshot({ path: '/tmp/portfolio-bilingual-evidence/PB-06-desktop-stream.png' });
});
