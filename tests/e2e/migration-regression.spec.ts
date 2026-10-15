import { expect, test } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

test('the product has one Next entry and no retired Vite/content entrypoints or direct dependencies', () => {
  for (const file of ['index.html', 'vite.config.ts', 'tsconfig.app.json', 'tsconfig.node.json', 'src/vite-env.d.ts',
    'src/index.css', 'src/data/portfolio.ts', 'src/data/blog-posts.ts', 'src/data/posts', 'scripts/migrate-posts.ts', 'vercel.json']) {
    expect(existsSync(file), file).toBe(false);
  }
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  for (const name of ['vite', '@vitejs/plugin-react', '@tailwindcss/vite', 'react-router-dom', '@vercel/node', 'eslint-plugin-react-refresh']) {
    expect({ ...pkg.dependencies, ...pkg.devDependencies }[name], name).toBeUndefined();
  }
  expect(pkg.scripts.dev).toBe('next dev');
  expect(pkg.scripts.start).toBe('next start');
  expect(pkg.scripts.build).toBe('pnpm run content:check && next build');
  expect(pkg.scripts['content:migrate-posts']).toBeUndefined();
});

test('both languages expose their own PDF and the alternate language PDF as real PDF resources', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const locale of ['en', 'zh']) {
    await page.goto(`/${locale}`);
    const links = page.locator('#about a[download]');
    await expect(links).toHaveCount(2);
    const paths = await links.evaluateAll(nodes => nodes.map(node => decodeURI(node.getAttribute('href')!)));
    expect(paths).toEqual(locale === 'en' ? ['/Huizhirong Guo.pdf', '/过汇智融-中文简历.pdf'] : ['/过汇智融-中文简历.pdf', '/Huizhirong Guo.pdf']);
    for (const href of await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')!))) {
      const response = await request.get(href);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/pdf');
      expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
    }
  }
  await context.close();
});

test('all ten Lab projects retain their shared Demo and GitHub links with every badge disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const results = [];
  for (const locale of ['en', 'zh']) {
    await page.goto(`/${locale}/lab`);
    await expect(page.locator('main img')).toHaveCount(10);
    const links = await page.locator('main a[target="_blank"]').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href'), rel: node.getAttribute('rel') })));
    expect(links.filter(link => link.href?.includes('github.com'))).toHaveLength(8);
    expect(links.filter(link => !link.href?.includes('github.com'))).toHaveLength(6);
    expect(links.every(link => link.rel?.includes('noopener') && link.rel.includes('noreferrer'))).toBe(true);
    await expect(page.getByText(locale === 'en' ? 'Active' : '运行中', { exact: true })).toHaveCount(0);
    results.push(links);
  }
  expect(results[0]).toEqual(results[1]);
  await context.close();
});

test('the whole localized route journey stays in one document with no application errors or Vite runtime', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
  const errors: string[] = []; const runtime: string[] = []; let documents = 0;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (/hydration|hydrated|Encountered a script tag|Blocked aria-hidden/i.test(message.text())) errors.push(message.text()); });
  page.on('request', request => {
    if (request.resourceType() === 'document') documents++;
    if (/@vite\/client|\/src\/main\.tsx|\/src\/data\//.test(request.url())) runtime.push(request.url());
  });
  await page.goto('/en');
  await page.locator('#contact input[name="name"]').fill('Final acceptance draft');
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh$/);
  await page.locator('header a[href="/zh/lab"]:visible').click();
  await expect(page).toHaveURL(/\/zh\/lab$/);
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/en\/lab$/);
  await page.locator('header a[href="/en/blog"]:visible').click();
  await page.locator('main a[href="/en/blog/why-i-chose-cs"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Why I Chose Computer Science');
  await page.locator('#language-desktop-toggle').click();
  await expect(page).toHaveURL(/\/zh\/blog$/);
  await page.locator('header a[href="/zh"]').first().click();
  await expect(page.locator('#contact input[name="name"]')).toHaveValue('Final acceptance draft');
  expect(documents).toBe(1); expect(errors).toEqual([]); expect(runtime).toEqual([]);
  writeFileSync('/tmp/portfolio-bilingual-evidence/PB-10-navigation-console.json', JSON.stringify({ documents, errors, runtime }, null, 2));
  await page.screenshot({ path: '/tmp/portfolio-bilingual-evidence/PB-10-final-journey.png' });
});
