import { expect, test } from '@playwright/test';

test('Chinese home exposes six complete sections without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3000/zh');
  for (const id of ['home', 'about', 'skills', 'qualifications', 'portfolio', 'contact']) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await expect(page.locator('#qualifications')).toContainText('博世中国');
  await expect(page.locator('#portfolio')).toContainText('KnowHive');
  await context.close();
});

test('Chinese Lab and English-article list are readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  expect((await page.goto('http://127.0.0.1:3000/zh/lab'))?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('实验');
  await expect(page.getByRole('heading', { name: 'KnowHive', exact: true })).toBeVisible();
  expect((await page.goto('http://127.0.0.1:3000/zh/blog'))?.status()).toBe(200);
  await expect(page.getByText('英文文章').first()).toBeVisible();
  await expect(page.locator('a[href="/en/blog/why-i-chose-cs"]')).toBeVisible();
  await context.close();
});


test('project highlights can expand without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of ['/zh', '/zh/lab']) {
    await page.goto('http://127.0.0.1:3000' + path);
    const details = page.locator('main details').first();
    await details.locator('summary').click();
    await expect(details.locator('li').first()).toBeVisible();
    await expect(details).toContainText('检索链路');
    await expect(details).toContainText('0.788');
  }
  await context.close();
});
