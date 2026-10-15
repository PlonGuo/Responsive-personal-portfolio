import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
});

for (const width of [375, 768, 1440]) for (const theme of ['light', 'dark'] as const) for (const locale of ['en', 'zh']) {
  test(`${locale} ${theme} typography fits ${width}px with the real local font`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    const externalFonts: string[] = [];
    const renderingErrors: string[] = [];
    page.on('pageerror', error => renderingErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /hydration|hydrated|server rendered|Encountered a script tag/i.test(message.text())) renderingErrors.push(message.text());
    });
    page.on('request', request => { if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalFonts.push(request.url()); });
    const prefix = `/tmp/portfolio-bilingual-evidence/PB-08-${locale}-${theme}-${width}`;
    for (const path of [`/${locale}`, `/${locale}/lab`, `/${locale}/blog`, '/en/blog/smia-agent-from-idea-to-launch']) {
      await page.goto(path, { waitUntil: 'load' });
      await expect.poll(() => page.evaluate(() => Boolean(history.state?.__portfolioLanguageEntry))).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      const font = await h1.evaluate(node => getComputedStyle(node).fontFamily);
      expect(font).toMatch(/sans/i);
      expect(font).not.toMatch(/Space Grotesk|DM Sans/);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1' });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      expect(fonts.some(face => face.isCustomFont && /noto.*sans.*sc/i.test(face.familyName))).toBe(true);
      await cdp.detach();
      const overflow = await page.locator('main').evaluate(node => {
        const visible = [...node.querySelectorAll('h1,h2,h3,h4,p,li,input,textarea,a,button')]
          .filter(element => element.getClientRects().length && !element.closest('pre,.blog-table-scroll'));
        return visible.filter(element => {
          const rect = element.getBoundingClientRect(); return rect.left < -1 || rect.right > innerWidth + 1;
        }).map(element => element.textContent?.slice(0, 70));
      });
      expect(overflow).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      if (path === `/${locale}`) {
        const bodyFamily = await page.locator('body').evaluate(node => getComputedStyle(node).fontFamily);
        expect(font).toBe(bodyFamily);
        expect(await page.locator('input[name="name"]').evaluate(node => getComputedStyle(node).fontFamily)).toBe(bodyFamily);
        const wrappedYears = await page.locator('#qualifications .rounded-full > span').evaluateAll(nodes => nodes.filter(node => {
          const range = document.createRange(); range.selectNodeContents(node);
          return range.getClientRects().length > 1 || node.scrollWidth > node.parentElement!.clientWidth;
        }).map(node => node.textContent));
        expect(wrappedYears).toEqual([]);
        if (locale === 'zh') {
          const shortLines = await page.locator('main p, main li').evaluateAll(nodes => nodes.filter(node => {
            const style = getComputedStyle(node); return parseFloat(style.lineHeight) / parseFloat(style.fontSize) < 1.6;
          }).map(node => node.textContent?.slice(0, 60)));
          expect(shortLines).toEqual([]);
        }
        await page.screenshot({ path: `${prefix}-hero.png` });
        for (const id of ['qualifications', 'portfolio', 'contact']) {
          await page.locator(`#${id}`).scrollIntoViewIfNeeded();
          await page.screenshot({ path: `${prefix}-${id}.png` });
        }
        // Long technical names must wrap inside real timeline and project containers.
        await page.locator('#qualifications h4, #portfolio h3').first().evaluate(node => { node.textContent = 'TypeScript'.repeat(35); });
        const longHeading = page.locator('#qualifications h4, #portfolio h3').first();
        expect(await longHeading.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      } else if (path.endsWith('/lab')) {
        const subtitle = page.locator('main h1 + p');
        expect(await subtitle.evaluate(node => getComputedStyle(node).fontFamily)).toBe(await h1.evaluate(node => getComputedStyle(node).fontFamily));
        if (locale === 'zh') expect(await page.locator('main h1').evaluate(node => getComputedStyle(node).letterSpacing)).toBe('normal');
        await page.screenshot({ path: `${prefix}-lab.png` });
      } else if (path.includes('/blog/')) {
        const pre = page.locator('pre').first();
        await pre.scrollIntoViewIfNeeded();
        await expect(pre.locator('code')).toHaveCSS('white-space', 'pre');
        expect(await pre.locator('code').evaluate(node => getComputedStyle(node).fontFamily)).toMatch(/monospace/);
        await pre.focus(); await expect(pre).toBeFocused();
        await page.screenshot({ path: `${prefix}-code.png` });
      }
    }
    expect(externalFonts).toEqual([]);
    expect(renderingErrors).toEqual([]);
  });
}

for (const width of [375, 768, 1440]) for (const locale of ['en', 'zh']) {
  test(`${locale} ${width}px remains readable and usable if every web font fails`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let blocked = 0;
    await page.route(/\.(woff2?|ttf|otf)(\?.*)?$/i, route => { blocked++; return route.abort(); });
    await page.goto(`/${locale}`, { waitUntil: 'load' });
    await expect.poll(() => page.evaluate(() => Boolean(history.state?.__portfolioLanguageEntry))).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    expect(blocked).toBeGreaterThan(0);
    await expect(page.locator('h1')).toBeVisible();
    await page.locator('input[name="name"]').fill('过汇智融 / Jason');
    await expect(page.locator('input[name="name"]')).toHaveValue('过汇智融 / Jason');
    const toggleTheme = page.getByRole('button', { name: locale === 'en' ? 'Switch to dark mode' : '切换到深色模式' }).first();
    await toggleTheme.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    await page.locator('#home').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/portfolio-bilingual-evidence/PB-08-fallback-${locale}-${width}.png` });
  });
}
