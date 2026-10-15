import { expect, test, type Locator } from '@playwright/test';
import { readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';

const evidence = '/tmp/portfolio-bilingual-evidence';
mkdirSync(evidence, { recursive: true });
const imageLimit = 300 * 1024;

test('large source assets fit the image budget and the shared catalog uses converted WebP files', () => {
  for (const name of ['self-pic.jpg', 'jason-clipart.jpg', 'e-commerce.jpg']) {
    expect(statSync(`public/images/${name}`).size, name).toBeLessThan(imageLimit);
  }
  const catalog = readFileSync('content/portfolio/shared.ts', 'utf8');
  for (const name of ['coach_dashboard', 'mom-test-interviewer', 'flowboard-demo', 'smia-agent', 'travel-agent-booking-system']) {
    expect(catalog).toContain(`/images/${name}.webp`);
    expect(statSync(`public/images/${name}.webp`).size, name).toBeLessThan(imageLimit);
  }
});

async function decodedImage(image: Locator) {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveAttribute('data-nimg', /^(fill|1)$/);
  await expect(image).toHaveAttribute('srcset', /\/_next\/image\?/);
  await expect(image).toHaveAttribute('alt', /\S/);
  return image.evaluate((node: HTMLImageElement) => ({
    src: node.currentSrc, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height,
  }));
}

test('the 704px Lab selects a 640px source for its 626px card instead of fetching the next size', async ({ page }) => {
  await page.setViewportSize({ width: 704, height: 900 });
  await page.goto('/en/lab');
  const image = await decodedImage(page.locator('main img').first());
  expect(image.width).toBe(626);
  expect(new URL(image.src).searchParams.get('w')).toBe('640');
});

for (const width of [375, 768, 1440]) for (const locale of ['en', 'zh']) {
  test(`${locale} images decode at ${width}px with responsive sizing and stable light/dark layouts`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (/hydration|hydrated|Image with src|Encountered a script tag/i.test(message.text())) errors.push(message.text());
    });
    const records: { src: string; bytes: number; width: number; height: number }[] = [];
    for (const theme of ['light', 'dark']) {
      await page.addInitScript(value => localStorage.setItem('theme', value), theme);
      await page.goto(`/${locale}`);
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      const avatar = await decodedImage(page.locator('header img:visible').first());
      expect(avatar.width).toBe(width >= 1024 ? 36 : 32);
      // Real scroll input ends initial LCP measurement before inspecting lower sections.
      await page.mouse.wheel(0, 100);
      const about = page.locator('#about img');
      const photo = await decodedImage(about);
      expect(photo.width).toBe(width >= 640 ? 320 : 256);
      expect(photo.height).toBe(photo.width);
      await expect(about).toHaveAttribute('loading', 'lazy');
      const response = await request.get(photo.src);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toMatch(/^image\//);
      const bytes = (await response.body()).length;
      expect(bytes).toBeLessThan(imageLimit);
      records.push({ ...photo, bytes });
      await page.screenshot({ path: `${evidence}/PB-09A-${locale}-${width}-${theme}-about.png` });
      const first = await page.locator('#portfolio img').getAttribute('alt');
      const names = new Set<string>();
      for (let index = 0; index < 6; index++) {
        const image = page.locator('#portfolio img');
        await decodedImage(image);
        names.add((await image.getAttribute('alt'))!);
        await expect(image).toHaveAttribute('loading', 'lazy');
        if (width === 1440 && locale === 'en' && theme === 'light') {
          await page.locator('#portfolio').screenshot({ path: `${evidence}/PB-09A-carousel-${index}.png` });
        }
        const old = await image.getAttribute('alt');
        await page.getByRole('button', { name: locale === 'en' ? 'Next project' : '下一个项目', exact: true }).click();
        await expect(image).not.toHaveAttribute('alt', old!);
      }
      expect(names.size).toBe(6);
      await expect(page.locator('#portfolio img')).toHaveAttribute('alt', first!);
      await page.goto(`/${locale}/lab`);
      const projects = page.locator('main img');
      await expect(projects).toHaveCount(10);
      await expect(projects.first()).toHaveAttribute('loading', 'eager');
      await page.mouse.wheel(0, 100);
      for (const [index, image] of (await projects.all()).entries()) {
        await decodedImage(image);
        await expect(image).toHaveAttribute('sizes', /vw/);
        await expect(image).toHaveAttribute('loading', index === 0 ? 'eager' : 'lazy');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      await page.screenshot({ path: `${evidence}/PB-09A-${locale}-${width}-${theme}-lab.png` });
    }
    writeFileSync(`${evidence}/PB-09A-${locale}-${width}-image-transfers.json`, JSON.stringify(records, null, 2));
    expect(errors).toEqual([]);
  });
}
