import { expect, test } from '@playwright/test';

for (const event of [{ isComposing: true, keyCode: 13 }, { isComposing: false, keyCode: 229 }]) {
  test(`IME confirmation preserves the draft without sending (composing=${event.isComposing}, code=${event.keyCode})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
    let requests = 0;
    await page.route('**/api/chat', route => {
      requests++;
      return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"content":"Input accepted."}\n\ndata: [DONE]\n\n' });
    });
    await page.goto('/zh');
    await page.getByRole('button', { name: '打开聊天助手' }).click();
    const input = page.getByRole('textbox', { name: '输入问题' });
    const draft = '请介绍我的项目';
    await input.fill(draft);
    await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, ...event });
    await expect(input).toHaveValue(draft);
    expect(requests).toBe(0);
    // This remains a single-line field: Shift+Enter must retain the draft, not submit its form.
    await input.press('Shift+Enter');
    await expect(input).toHaveValue(draft);
    expect(requests).toBe(0);
    await input.press('Enter');
    await expect(page.getByRole('log')).toContainText('Input accepted.');
    await expect(input).toHaveValue('');
    expect(requests).toBe(1);
  });
}
