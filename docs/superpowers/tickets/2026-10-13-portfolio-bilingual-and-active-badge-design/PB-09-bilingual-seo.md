# PB-09：双语 metadata、sitemap 与 robots

状态：实现、技术验收及用户审核通过（2026-10-15）。阶段：Phase 3。依赖：PB-07、PB-08。替代原 Task 15。规格：第 9 节；AC-12。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

两语初始 HTML 含正确元数据、双向语言关联和独立 canonical；英文文章无虚假中文 alternate。站点地图只含正式地址；不承诺收录时间或排名。

## Files

- Create：`lib/seo.ts`、`app/sitemap.ts`、`app/robots.ts`、`tests/unit/seo.test.ts`、`tests/e2e/seo.spec.ts`。
- Modify：`app/[lang]/layout.tsx`、`app/[lang]/page.tsx`、`app/[lang]/lab/page.tsx`、`app/[lang]/blog/page.tsx`、`app/[lang]/blog/[slug]/page.tsx`。
- Create：`app/[lang]/blog/[slug]/opengraph-image.tsx`（延续原计划文章分享图）；禁止生成中文不存在文章的图。
- 实际补充：`lib/assets/noto-sans-sc-700.ttf`及说明、`scripts/subset-font.py`的服务端TTF输出、字体与部署SEO说明。安装版ImageResponse不支持WOFF2，复用PB-08同字形粗体子集；网页字体文件不变。

## Interfaces

- `SITE_URL = 'https://plonguo.com'`；`getPageMetadata(locale: Locale, page: PageKind): Metadata`。
- `getPostMetadata(post: BlogPost): Metadata`，文章 canonical 固定英文，title/excerpt 原样，articles 无 languages。
- `getSitemapEntries(): MetadataRoute.Sitemap`：首页/Lab/列表各两语 + 英文文章每篇一次；本轮 9 篇则总计 15 正式地址，测试从实际 getPosts 数计算，不能永远写死 9。

```ts
import type { Metadata } from 'next';
import type { Locale, PageKind } from './i18n/locales';
import { getDictionary } from './i18n/dictionaries';
export const SITE_URL = 'https://plonguo.com';
export function getPageMetadata(locale: Locale, page: PageKind): Metadata {
  const suffix = page === 'home' ? '' : `/${page}`;
  const copy = getDictionary(locale).seo[page];
  const canonical = `/${locale}${suffix}`;
  return {
    metadataBase: new URL(SITE_URL), title: copy.title, description: copy.description,
    alternates: { canonical, languages: {
      en: `/en${suffix}`, 'zh-CN': `/zh${suffix}`, 'x-default': `/en${suffix}`,
    } },
    openGraph: { title: copy.title, description: copy.description, url: canonical,
      locale: locale === 'en' ? 'en_US' : 'zh_CN' },
  };
}
```

根布局只设 metadataBase/共享默认值，不能设会被文章继承的全站 languages。文章详情显式提供自身元数据，检查最终 HTML 无遗留 alternate。

## 实现步骤

- [x] 写 unit 正反例与 HTML 验收：中文 canonical 自指而非英文；语言 alternates 双向完整；文章无 zh alternate；sitemap 无旧地址/重复/中文文章。运行确认未实现失败。
- [x] 实现 page/post 元数据，静态 generateMetadata await/校验 params，notFound 的 slug 不输出文章 meta；正式站域名不从 localhost/preview URL 推导。每页 H1/正文与 title 描述一致。
- [x] sitemap 生成所有正式页，双语页面附 languages，文章只英文，不给每次请求写 `new Date()` 伪造 lastModified；文章用已知发布日期，其他页无可信更新日期则省略。
- [x] robots 指向 `https://plonguo.com/sitemap.xml`。生产允许收录；Vercel Preview/Development 构建保留 noindex/disallow，判断环境变量而不读取请求 cookies。本地测试显式使用 production 环境配置验证可收录，另一次 Preview 环境构建验证 noindex，记录两个构建的环境条件。
- [x] 文章 opengraph-image 仅处理真实英文 slug，使用安全长度/换行显示标题；unknown/中文路径不产生虚假分享内容。
- [x] 生产服务器请求初始 HTML（禁 JS），逐页校验 lang/title/description/canonical/hreflang/OG，解析 sitemap 的 loc 集合与预期深比较；不能只正则看到某字符串就认为所有页面正确。

```ts
import { expect, test } from 'vitest';
import { getPageMetadata } from '../../lib/seo';
test('中文 Lab canonical 自指，默认语言英文', () => {
  const meta = getPageMetadata('zh', 'lab');
  expect(meta.alternates?.canonical).toBe('/zh/lab');
  expect(meta.alternates?.languages).toEqual({
    en: '/en/lab', 'zh-CN': '/zh/lab', 'x-default': '/en/lab',
  });
});
```

- [x] `pnpm exec vitest run tests/unit/seo.test.ts`、`pnpm run build`、`pnpm exec playwright test tests/e2e/seo.spec.ts`；报告生产/预览规则及文章分享图证据，不请求实际搜索引擎收录。

## 验收与交付

AC-12 完整通过；初始响应体可读而非客户端 effect 后才有元数据。抓取可用性和内容准确性由证据支撑，排名与收录不作为此票完成声明。

## 本轮交付与人工审核

203项unit、94项Production浏览器回归通过；独立Preview构建8项及恢复Production后8项SEO验证通过，开发模式另8项通过。构建、typecheck、lint、内容/字形校验通过。完整证据与判断见同目录[执行记录](progress.md)。尚未提交、部署或请求收录，等待用户审核。

1. 在`http://localhost:3000/en`与`/zh`切换，浏览器标签页标题应随语言变化；Lab和博客目录同理。
2. 打开`http://localhost:3000/sitemap.xml`，应包含六个双语页面及九篇英文文章，不包含中文文章或旧跳转地址。
3. 打开`http://localhost:3000/en/blog/claude-dev-setup-ralph-loop/opengraph-image`，应显示带标题的1200×630文章分享图；中文相同图片路径应404。
4. 本地开发的`/robots.txt`显示`Disallow: /`为预期。Production允许抓取及Preview禁止抓取已分别在独立构建验证，不能用当前开发响应代替Production结论。

页面源代码也可检查title、description、canonical和hreflang；英文文章无中文hreflang。只对本票审核，PB-10及图片优化尚未开始。
