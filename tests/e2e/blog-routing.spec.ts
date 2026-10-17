import { expect, test } from '@playwright/test';
import baseline from '../fixtures/blog-baseline.json' with { type: 'json' };
const blogPosts = baseline.posts;
import en from '../../lib/i18n/messages/en.json' with { type: 'json' };

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
});

test('all nine articles are English static pages and exact legacy/Chinese redirects keep the query', async ({ request }) => {
  for (const post of blogPosts) {
    const english = await request.get(`/en/blog/${post.slug}`, { maxRedirects: 0 });
    expect(english.status(), post.slug).toBe(200);
    expect(await english.text()).toContain('lang="en"');
    for (const prefix of ['/blog/', '/zh/blog/']) {
      const response = await request.get(`${prefix}${post.slug}?ref=review`, { maxRedirects: 0 });
      expect(response.status(), prefix + post.slug).toBe(308);
      expect(response.headers().location).toBe(`/en/blog/${post.slug}?ref=review`);
    }
  }
});

test('unknown slugs and languages are real HTTP 404 responses, including Chinese paths', async ({ request }) => {
  for (const path of ['/en/blog/no-such-post', '/zh/blog/no-such-post', '/fr/blog/why-i-chose-cs', '/en/blog/why-i-chose-cs/extra', '/en/blog/why-i-chose-cs.mdx']) {
    expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(404);
  }
});

test('all article bodies are readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route(/^https:\/\/(fonts\.|cdn\.simpleicons\.)/, route => route.abort());
  for (const post of blogPosts) {
    await page.goto(`/en/blog/${post.slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(post.title);
    await expect(page.locator('.blog-prose p').first()).toBeVisible();
    expect((await page.locator('.blog-prose').textContent())!.length).toBeGreaterThan(500);
  }
  await context.close();
});

test('Chinese cards identify English articles and the article offers an explicit Chinese index link without reloading', async ({ page }) => {
  let documents = 0;
  page.on('request', request => { if (request.resourceType() === 'document') documents++; });
  await page.goto('/zh/blog', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('main a[href^="/en/blog/"]');
  await expect(cards).toHaveCount(9);
  for (const card of await cards.all()) await expect(card).toContainText('英文文章');
  await cards.filter({ hasText: 'Why I Chose Computer Science' }).click();
  await expect(page).toHaveURL(/\/en\/blog\/why-i-chose-cs$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const index = page.locator('.language-dock').getByRole('link', { name: en.actions.chineseIndex, exact: true });
  await expect(index).toHaveAttribute('href', '/zh/blog');
  await index.click();
  await expect(page).toHaveURL(/\/zh\/blog$/);
  await expect(page.locator('#language-desktop-toggle')).toBeFocused();
  expect(documents).toBe(1);
});

test('mobile article code and diagrams scroll inside the page and the menu links to the Chinese index', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/en/blog/desktop-app-for-mom?ref=reader#article', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.blog-prose pre').first()).toHaveCSS('white-space', 'pre');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.locator('.blog-prose pre').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/portfolio-bilingual-evidence/PB-07-mobile-article.png' });
  await page.locator('#mobile-menu-toggle').click();
  await page.locator('#language-menu-zh').focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/zh\/blog\?ref=reader$/);
  await expect(page.locator('#mobile-menu-toggle')).toBeFocused();
  await expect(page.locator('#mobile-menu-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('the legacy homepage redirect keeps the contact fragment in the browser', async ({ page }) => {
  await page.goto('/#contact', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/en#contact$/);
  await expect(page.locator('#contact')).toBeInViewport();
});

test('an in-flight HTTP reply and contact draft survive reading an article and opening the Chinese index', async ({ page, request }) => {
  const fixture = 'http://127.0.0.1:3219';
  await request.post(fixture + '/reset');
  await page.route('**/api/chat/v2', route => route.continue({ url: fixture + '/api/chat/v2' }));
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.locator('#contact input[name="name"]').fill('Article navigation draft');
  await page.getByRole('button', { name: en.a11y.openChat }).click();
  await page.getByRole('textbox', { name: en.a11y.chatInput, exact: true }).fill('Continue while reading');
  await page.getByRole('button', { name: en.a11y.sendChat, exact: true }).click();
  await expect(page.getByRole('log')).toContainText('第一段 — English');
  await page.locator('a[href="/en/blog/claude-dev-setup-ralph-loop"]').click();
  await expect(page).toHaveURL(/\/en\/blog\/claude-dev-setup-ralph-loop$/);
  await page.locator('.language-dock').getByRole('link', { name: en.actions.chineseIndex, exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/blog$/);
  await expect(page.getByRole('log')).toContainText('第一段 — English second');
  const stats = await (await request.get(fixture + '/stats')).json();
  expect(stats).toHaveLength(1); expect(stats[0].sessionId).toBeTruthy(); expect(stats[0].cancelled).toBe(false);
  await page.locator('header').getByRole('link', { name: '首页', exact: true }).click();
  await expect(page.locator('#contact input[name="name"]')).toHaveValue('Article navigation draft');
});
