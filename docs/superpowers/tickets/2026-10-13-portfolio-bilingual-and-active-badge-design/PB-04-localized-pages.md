# PB-04：完整双语首页、Lab 与博客列表

状态：实现、技术验收及用户审核通过；最终中文事实/PDF对应关系于2026-10-15获用户确认。阶段：Phase 3。依赖：PB-03。替代原 Task 12 展示部分。规格：第 3、6、7 节；AC-03、AC-04、AC-10。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

把真实作品集接到 Next，组件只接收当前语言的数据与字典。当前文章源暂用 PB-02 包装，详情与 MDX 交给 PB-07；共享会话交给 PB-05，语言入口交给 PB-06。

## Files

- Modify：`app/[lang]/layout.tsx`、`app/[lang]/page.tsx`、`src/components/Header.tsx`、`Footer.tsx`、`Hero.tsx`、`About.tsx`、`Skills.tsx`、`Qualifications.tsx`、`Portfolio.tsx`、`Contact.tsx`、`src/hooks/useTheme.ts`。
- Modify：`src/components/blog/BlogPreview.tsx`、`BlogCard.tsx`。
- Create：`app/[lang]/lab/page.tsx`、`app/[lang]/blog/page.tsx`、`src/components/LabView.tsx`、`src/components/blog/BlogList.tsx`、`src/components/MotionSection.tsx`。
- Create：`tests/e2e/localized-pages.spec.ts`、`tests/unit/hero-timer.test.tsx`；原 Phase 2 是 Node 环境，为此计时器测试增加 `@testing-library/react`、`jsdom` 开发依赖，文件首行 `// @vitest-environment jsdom`，不改变安全测试的 Node 环境。
- Modify：`package.json`、`pnpm-lock.yaml`、`tsconfig.json`（默认 dev/build/start/preview 改 Next，保留 `*:next` alias）、`eslint.config.js`。
- Retire：`src/App.tsx`、`src/main.tsx`、`src/pages/HomePage.tsx`、`src/pages/LabPage.tsx`、`src/pages/BlogPage.tsx`、`src/pages/BlogPostPage.tsx`、`src/layouts/MainLayout.tsx`，确认新入口覆盖后删除。
- Read：`src/components/Chatbot.tsx`、`UpdatesWidget.tsx`；本票暂不挂载两组件到 Next 壳，PB-05 接入，禁止以此状态发布。

## Interfaces

各组件使用显式 props，不直接 import 原 portfolio 数据：

- `Hero({ profile, lines, socialLinks, copy, locale })`；`About({ profile, resumeHref, copy })`。
- `Skills({ skills, copy })`；`Qualifications({ education, experience, copy })`。
- `Portfolio({ projects, copy, locale })`；`LabView({ projectsByYear, copy, locale })`。
- `Contact({ contactInfo, copy })`；PB-05 更换内部草稿来源，外部 props 不变。
- `Header/Footer({ locale, copy })`；BlogCard/BlogList/BlogPreview 接 `posts`/`locale`/`copy`，post 内容保留英文，链接固定 `/en/blog/${slug}`。
- `MotionSection({ id, children }: { id: SectionId; children: React.ReactNode })` 管理本页章节入场；PB-06 用浏览器会话标识防止切语后整页重新播放。

props 的 `copy` 从 Dictionary 精确 Pick 所需分组，profile/project 类型使用 PB-02；不是把全部双语内容包导入客户端。首页 section id 固定 `home/about/skills/qualifications/portfolio/contact`。

## 实现步骤

- [x] 搜索所有 React Router 与原数据 import，检查 props 的 caller；记录用户改动后按组件逐个接 props，不恢复旧内容。先写下列无 JS 验收，确认当前骨架缺少内容失败。

```ts
import { test, expect } from '@playwright/test';
test('无 JS 时六章节和中文 Lab 可读', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/zh');
  for (const id of ['home', 'about', 'skills', 'qualifications', 'portfolio', 'contact']) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await page.goto('http://localhost:3000/zh/lab');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('实验');
  await page.goto('http://localhost:3000/zh/blog');
  await expect(page.getByText('英文文章').first()).toBeVisible();
  await context.close();
});
```

- [x] 首页服务端 await/校验 locale，调用 PB-02 getters，传数据给客户端动画组件。所有服务器首屏内容必须可见：不把 Framer `initial.opacity=0` 留在无 JS HTML；用 CSS/挂载后增强动画，不隐藏主体。

```tsx
// 章节组件的调用约定
<Portfolio
  projects={getFeaturedProjects(lang)}
  locale={lang}
  copy={{ actions: dict.actions, sections: dict.sections }}
/>
```

- [x] 迁移六章节与 Lab：标题/说明/标签/亮点用当前语言，项目 key 用 ID，给共享徽章 `label={copy.actions.activeBadge}`。Lab 粒子改为基于固定索引的确定性位置/时长，不在 render 调 Math.random。SVG 图标和头像移到已有 public 静态路径或正确处理 Next 静态 import 的 `.src`，不把 StaticImageData 当字符串。
- [x] Header/Footer 和博客组件改 next/link/next/navigation，所有站内链接带当前语言，文章例外固定英文。日期格式指定 locale 和 UTC，避免服务端/客户端时区不同。BlogList 筛选用客户端 URL 的 `tag` 查询参数，不让 server page 读取动态 searchParams 破坏静态生成。
- [x] Hero 对 `lines` 切换清理旧 interval/timeout，从第一句开始；useReducedMotion 下渲染完整第一句。用 fake timer 测试先 mount、换中文、推进时钟只出现中文，再 unmount 无定时器更新；断言针对可见输出和清理，不镜像实现变量。
- [x] useTheme 初始化先用 SSR 一致的 light 状态，挂载后安全读取偏好，storage 异常捕获；不在首轮 JSX 根据仅浏览器保存值生成不同树。PB-05 加首屏主题引导脚本及共享主题状态。
- [x] 新路由覆盖后删除旧 React Router 页面入口，切默认脚本到 Next。`build` 为 `pnpm run content:check && next build`，`lint` 为 `eslint .`；配置按实际保留源码更新，不存在类型报错“留以后”。执行 unit、`pnpm run build`、`pnpm run lint` 与 localized-pages 浏览器测试。

## 验收与交付

AC-03/04/10 的内容与计时器通过，英文事实未丢、六章节 ID 不变、无 JS 可读。记录当前尚未交付聊天/更新浮层、语言入口、MDX 详情，禁止将中间状态部署或关闭整个迁移。人工审阅中文介绍/经历/项目；不要把构建通过当翻译准确。


## 执行结果

59 项 unit、18 项生产服务器 browser、内容校验、Next build 与两套 typecheck 通过。lint 为 0 errors / 1 个既有 UpdatesWidget warning；不是无警告。详情与截图证据见 [progress.md](progress.md#pb-04)。原页面路径在 PB-03 暂改 src/views，现已退役。

Header 导航因 768px 实测裁切改为 lg 展开；这不改变 PB-06 语言入口的 768px 约束。头像/技能 SVG 用 public 路径；Portfolio 项目 key 使用稳定 ID。新增交互验收在 tests/e2e/page-interactions.spec.ts，useTypewriter 提取至 src/hooks/useTypewriter.ts；补充类型检查脚本与 tests/e2e/static-shell.spec.ts 的真实 Hero 断言。

按用户要求本票结束后暂停；PB-05–10、原 Task 13 不启动。本地中文页面可供用户审阅，当前禁止部署。Next 邮件 API 与文章详情尚未接入，先前用户已确认的邮件成功属于旧入口验证。

只读复核的减少动画/标签状态问题已修复并补回归；项目亮点以双语原生 details 展示，无 JS 可展开。当前人工内容审阅未完成，不能代替技术验收记录。
