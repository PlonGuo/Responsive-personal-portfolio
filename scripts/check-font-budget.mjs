import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';

export const FONT_BUDGET_BYTES = 500 * 1024;
const fontURL = url => /\.(woff2?|otf|ttf)$/i.test(new URL(url).pathname);
const googleFonts = url => /^(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(new URL(url).hostname);

export function assessFontBudget(record, baseURL, budget = FONT_BUDGET_BYTES) {
  if (!Number.isInteger(budget) || budget < 1 || budget > FONT_BUDGET_BYTES) {
    throw new Error(`Budget must be an integer from 1 to ${FONT_BUDGET_BYTES}`);
  }
  const origin = new URL(baseURL).origin;
  const errors = [];
  for (const font of record.failedFonts ?? []) errors.push(`Failed font: ${font}`);
  for (const url of record.requests) {
    if (googleFonts(url) || new URL(url).origin !== origin) errors.push(`External font request: ${url}`);
  }
  if (!record.fonts.length) errors.push('No font responses');
  for (const font of record.fonts) {
    if (new URL(font.url).origin !== origin) errors.push(`External font response: ${font.url}`);
    if (!(font.bytes > 0)) errors.push(`Unmeasurable font response: ${font.url}`);
  }
  if (!record.usedFonts.some(font => font.isCustomFont && font.glyphCount > 0 && /noto.*sans.*sc/i.test(font.familyName))) {
    errors.push('Noto Sans SC is not rendering the heading');
  }
  const total = record.fonts.reduce((sum, font) => sum + font.bytes, 0);
  if (total > budget) errors.push(`Font budget exceeded: ${total} > ${budget}`);
  return { ...record, budget, total, errors };
}

export async function measureFontBudget(baseURL, budget = FONT_BUDGET_BYTES) {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const path of ['/en', '/zh']) {
      // A separate context per language also prevents a warm HTTP/font cache.
      const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
      try {
        const page = await context.newPage();
        await page.addInitScript(() => performance.setResourceTimingBufferSize(5000));
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
        await cdp.send('DOM.enable');
        await cdp.send('CSS.enable');
        const requests = [];
        const fontURLs = new Set();
        page.on('request', request => {
          if (request.resourceType() === 'font' || fontURL(request.url()) || googleFonts(request.url())) requests.push(request.url());
          if (request.resourceType() === 'font' || fontURL(request.url())) fontURLs.add(request.url());
        });
        // Unrelated widgets must not make real provider/API requests during measurement.
        await page.route(/^https:\/\/(cdn\.simpleicons\.org|challenges\.cloudflare\.com)\//, route => route.abort());
        await page.goto(new URL(path, baseURL).href, { waitUntil: 'load' });
        await page.locator('h1').waitFor();
        const { fonts, failedFonts } = await page.evaluate(async urls => {
          await document.fonts.ready;
          return {
            fonts: performance.getEntriesByType('resource')
              .filter(entry => urls.includes(entry.name))
              .map(entry => ({ url: entry.name, bytes: entry.encodedBodySize })),
            failedFonts: [...document.fonts].filter(face => face.status === 'error').map(face => `${face.family} ${face.weight}`),
          };
        }, [...fontURLs]);
        const { root } = await cdp.send('DOM.getDocument');
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1' });
        const { fonts: usedFonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        results.push(assessFontBudget({ path, requests, fonts, usedFonts, failedFonts }, baseURL, budget));
      } finally { await context.close(); }
    }
    return results;
  } finally { await browser.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const results = await measureFontBudget(process.env.BASE_URL ?? 'http://localhost:3000', Number(process.env.FONT_BUDGET_BYTES ?? FONT_BUDGET_BYTES));
    console.log(JSON.stringify(results, null, 2));
    if (results.some(result => result.errors.length)) process.exitCode = 1;
  } catch (error) { console.error(error); process.exitCode = 1; }
}
