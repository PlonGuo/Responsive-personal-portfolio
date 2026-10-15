# PB-03：Next.js 双语静态入口

状态：实现与技术验收完成。阶段：Phase 3。依赖：PB-02。替代原 Task 10 骨架。规格：第 5、6、9 节；AC-04、AC-05、AC-13 基础。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

可构建、可直接访问的两语根布局与真实 profile 概览；不展示假占位内容。完整页面由 PB-04 交付，Vite 默认脚本在本票仍保留。

## Files

- Create：`next.config.ts`、`postcss.config.mjs`、`app/globals.css`、`app/[lang]/layout.tsx`、`app/[lang]/page.tsx`、`app/[lang]/not-found.tsx`。
- Create：`playwright.config.ts`、`tests/e2e/static-shell.spec.ts`。
- Modify：`package.json`、`pnpm-lock.yaml`、`tsconfig.json`、`eslint.config.js`、`.gitignore`；Vite tsconfig 至 PB-04 保留。

## Interfaces

- `generateStaticParams(): Array<{ lang: Locale }>` 返回两语；layout/page `params: Promise<{ lang: string }>`，await 后校验。
- `dev:next` → `next dev`；`build:next` → `pnpm run content:check && next build`；`start:next` → `next start`；`test:e2e` → `playwright test`。
- Playwright baseURL `http://localhost:3000`，webServer `pnpm exec next start --port 3000`，`reuseExistingServer: false`，测试前生产构建；保留 Phase 2 的测试命令。

## 实现步骤

- [x] 执行时核对 Next 稳定版本及 Node/React 兼容，用 pnpm 安装并锁定 lockfile，保持 React 19。安装 PostCSS/Playwright 与 Chromium；不装 i18n 库，复用 Vitest。记录真实版本，不能凭计划日期推定。
- [x] alias `@/*` 指向根；PostCSS 用 `@tailwindcss/postcss`；ESLint 使用 `eslint .`、忽略 `.next`，Next 文件移除 Vite 热更新限制；加入四个 Next/testing 脚本，默认 Vite 脚本保留。
- [x] 写以下生产服务器测试，运行确认无路由失败，再实现入口。

```ts
import { test, expect } from '@playwright/test';
test('中文来自初始 HTML', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  expect((await page.goto('http://localhost:3000/zh'))?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('工程师');
  await context.close();
});
test('未知语言不 fallback', async ({ request }) => {
  expect((await request.get('/fr')).status()).toBe(404);
});
```

```tsx
import { notFound } from 'next/navigation';
import { locales, htmlLang, isLocale } from '@/lib/i18n/locales';
import '../globals.css';
export const dynamicParams = false;
export function generateStaticParams() { return locales.map(lang => ({ lang })); }
export default async function RootLayout({ children, params }: {
  children: React.ReactNode; params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <html lang={htmlLang[lang]} className="light"><body>{children}</body></html>;
}
```

page 同样 await/校验后用 `getProfile(lang)` 渲染 title、bio、focus，不导入尚未迁移的 React Router 组件。唯一 HTML/body 定义在上述根布局。

- [x] `next.config.ts` 加 `/`→`/en`、`/lab`→`/en/lab`、`/blog`→`/en/blog`、`/blog/:slug`→`/en/blog/:slug`，均 `permanent: true`。此票仅验根跳转，Lab/Blog 目标 PB-04 实现；中文文章不加统配规则。
- [x] `pnpm run build:next`、现有 `pnpm run build` 均通过；生产服务器跑 `pnpm exec playwright test tests/e2e/static-shell.spec.ts`，检查两语静态构建输出、根 308 和 console/hydration。

## 验收与交付

AC-04 首页基础和 AC-05 根跳转通过；完整 Lab、博客、状态、SEO 尚未验收明确记录。不得用 `ignoreBuildErrors`。根布局跨 locale 生命周期在 PB-05/06 验证，此票不能提前宣称会话保留。

实际版本、RED/GREEN 和静态构建证据见 [progress.md](progress.md#pb-03)。原 src/pages 临时改 src/views，已在 PB-04 退役。
