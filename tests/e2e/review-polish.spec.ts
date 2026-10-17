import { expect, test } from '@playwright/test';
import { uiReply } from '../helpers/ui-stream';

test.beforeEach(async ({ page }) => {
  // These layout tests exercise local UI, not external font/icon/CDN availability.
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//,
    route => route.abort());
});

test('assistant Markdown renders in the real mobile chat without changing the user message', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const content = '8. **技术栈与方向**：Python、TypeScript/JavaScript。\n\n```ts\nconst example = "a deliberately long line that should scroll inside the code block";\n```\n\n| 技术 | 用途 |\n| --- | --- |\n| Python | Agent |';
  await page.route('**/api/chat/v2', route => route.fulfill({
    contentType: 'text/event-stream',
    body: uiReply(content),
  }));
  await page.goto('/zh', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '打开聊天助手' }).click();
  await page.getByRole('textbox', { name: '输入问题' }).fill('保留我的 **原始输入**');
  await page.getByRole('button', { name: '发送问题', exact: true }).click();
  const log = page.getByRole('log');
  await expect(log.locator('li strong')).toHaveText('技术栈与方向');
  await expect(log.locator('ol')).toHaveAttribute('start', '8');
  await expect(log.locator('pre code')).toContainText('const example');
  await expect(log.getByRole('table')).toContainText('Python');
  await expect(log.getByText('保留我的 **原始输入**', { exact: true })).toBeVisible();
  const dialog = (await page.getByRole('dialog').boundingBox())!;
  expect(dialog.x + dialog.width).toBeLessThanOrEqual(376);
  const code = (await log.locator('pre').boundingBox())!;
  expect(code.x + code.width).toBeLessThanOrEqual(375);
  await page.screenshot({ path: '/tmp/portfolio-bilingual-evidence/PB-05-markdown-mobile.png' });
});

for (const width of [375, 768, 1440]) {
  test(`top-aligned navigation remains usable over scrolling content at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await page.goto('/zh', { waitUntil: 'domcontentloaded' });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') {
        await page.getByRole('button', { name: '切换到深色模式' }).first().click();
        await expect(page.locator('html')).toHaveClass(/dark/);
      }
      await page.locator('#about h2').evaluate(element => window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - 45, behavior: 'instant' }));
      const header = (await page.locator('header').boundingBox())!;
      expect(header.y).toBe(0); expect(header.x).toBe(0);
      expect(Math.round(header.width)).toBe(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      await page.screenshot({ path: `/tmp/portfolio-bilingual-evidence/PB-05-navbar-${width}-${theme}.png`, clip: { x: 0, y: 0, width, height: 300 } });
    }
    if (width < 1024) await page.getByRole('button', { name: '展开或关闭菜单' }).click();
    await page.locator('header').getByRole('link', { name: '实验室', exact: true }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/zh\/lab$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('项目实验室');
  });
}
