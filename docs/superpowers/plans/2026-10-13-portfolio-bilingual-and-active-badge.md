# Active 开关与双语迁移 Implementation Plan

## 当前发布状态（2026-10-15，覆盖下方历史状态）

用户明确“都通过”，并授权提交、推送迁移分支、配置 Vercel、Preview 验证及 Production 构建发布。PB-01–10 和 DeepSeek→OpenAI 追加验收通过，Phase 3 收尾；Phase 4 未开始。TUN 恢复后复验：真实聊天200且完整DONE；无效验证码403；GitHub fresh200后缓存命中200；受控DeepSeek503后真实OpenAI200非空回复。此前网络失败记录保留为历史，不再是当前阻塞。发布执行中；部署结果以本轮交付及Vercel实际状态为准。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline implementation, or superpowers:subagent-driven-development when the selected workflow calls for it. Execute one ticket at a time; checkbox steps track work, not approval.

**Goal:** 隐藏现有 Active 徽章，在 Next.js 迁移中交付可直接访问、有 SEO、保留输入与会话的中英文作品集。

**Architecture:** URL 是语言来源；`app/[lang]/layout.tsx` 是两语共用的根布局定义，服务端加载字典和文件内容并静态生成 HTML。项目元数据共用、文字按稳定 ID 分语言保存；浏览器内存会话独立于页面挂载，不重写聊天协议。

**Tech Stack:** React 19、TypeScript、Next.js App Router、Tailwind CSS 4、Framer Motion、pnpm、Node 22；复用 Phase 2 的 Vitest，加入 Playwright 验收迁移。

**Spec:** [已批准规格](../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)。用户于 2026-10-13 批准并要求编写 tickets。

**状态：** 用户已授权按票据逐条实现，PB-01–04 已实现并完成技术验收；PB-04A（原 Task 13）已获用户于 2026-10-13 审核通过，GitHub fresh/验证码重放仍未验证。PB-05 及其审核回修已实现并通过技术验收，本轮逐项人工审核全部获用户确认通过，PB-06（含主题脚本与 Hero 审核回修）已获用户于 2026-10-15 审核通过，PB-07及桌面紧凑入口回修均获用户审核通过；PB-08核心字体/排版及warning回修已获用户审核通过；PB-09已获用户审核通过；PB-09A图片优化已获用户审核通过；PB-10清理/自动验收通过，中文事实及PDF最终人工审核通过；AC-13因当前Supabase连接重置未通过，整体尚未关闭。实际进度、验证及判断见[执行记录](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/progress.md)。不自动提交、推送或部署。

## Global Constraints

- **逐票审核：** 每次只执行一个 ticket，完成其实现、验证和结果汇报后立即停止，等待用户明确审核通过并同意继续，才能开始下一个。不得预先编码后续票据，也不得把前置 Task 当作自动继续的例外；前置工作如需单独执行，先明确本次执行范围。审核修改仍归当前 ticket，修正后再次等待审核。

- pnpm；React 19、严格 TypeScript，禁止 `any`；Node 22、Tailwind CSS 4。
- 保留主色 `#3B82F6`、辅色 `#8B5CF6`、强调色 `#06B6D4`、`rounded-2xl`、`backdrop-blur-xl`；主题由 HTML class 驱动。
- 项目必填 `showActiveBadge: boolean`，现有全部 `false`；Demo 独立由 `demoUrl` 控制。
- `/en`、`/zh`；HTML lang 为 `en`、`zh-CN`；英文文章仅 `/en/blog/[slug]`。
- 桌面 `>= 768px` 仅左下角 44×44 单按钮入口（目标“中 / EN”）；移动端仅汉堡菜单两项入口。
- 作品集和界面完整双语；博客标题、摘要、标签、正文、代码保留原内容；不新增未经核实事实。
- Noto Sans SC 本站托管，每种语言冷缓存首页字体响应体合计不超过 `500 KiB`；代码等宽。
- 不新增 i18n 库、CMS、翻译服务或供应商；不按 IP、浏览器语言、cookie 自动重定向。
- 页面静态生成，不用 cookie/headers 决定语言；不配置 `output: 'export'`，保留服务端 `/api/*`。
- 切换保留会话、草稿、流式回复和主题；不以 locale 给整页加 key，不复制根布局。
- API、资源、PDF 不加语言段；密钥和数据库访问继续仅在服务端。
- 保留工作区及暂存区用户改动。本轮不提交；后续提交须有用户指令或授权工作流，只暂存明确文件，禁用 `git add -A`。
- 构建、类型检查、浏览器与人工检查分别报告；未执行写“未验证”。

## Review Focus

1. 回复正在返回时切语言：不 abort、不重新 POST、不丢历史或会话 ID；PB-05/06 延迟流验收。
2. 目标语言未预取且离线：保留原页/草稿、导航锁释放、可重试；PB-06 拦截目标请求。
3. 中文文章旧地址：真实 slug 308、未知 slug 404，不能统配重定向未知文章；PB-07 验证。
4. localStorage 被拒绝：页面可读、主题可切，不白屏；PB-05 正反例。
5. 字体失败或超预算：回退可读，预算超限明确失败；PB-08 冷缓存计量。

## 文件职责

保留 `src/components/`、`src/hooks/`、`src/types/`，新增 Next 入口和内容层在根目录，避免仅为迁移搬运全部组件。alias `@/*` 指向仓库根。

| 路径 | 职责 | 首个写入 |
|---|---|---|
| `src/components/ActiveBadge.tsx` | 共享徽章 | PB-01 |
| `lib/i18n/{locales,types,dictionaries}.ts`、`lib/i18n/messages/{en,zh}.json` | 字典/校验 | PB-02 |
| `content/portfolio/{shared,en,zh}.ts`、`lib/content/{types,profile,projects}.ts` | 元数据/展示内容 | PB-02 |
| `app/[lang]/layout.tsx`、`app/[lang]/page.tsx`、`app/globals.css` | 静态语言入口 | PB-03 |
| `src/components/*`、`app/[lang]/{lab,blog}/page.tsx` | 展示与本地化 | PB-04 |
| `lib/client/{store,session,chat-runtime}.ts`、`src/hooks/useContactDraft.ts` | 会话/草稿/请求生命周期 | PB-05 |
| `lib/i18n/routes.ts`、`lib/client/language-navigation.ts`、`src/components/LanguageSwitcher.tsx` | 切换/滚动/焦点 | PB-06 |
| `content/posts/*.mdx`、`lib/content/posts.ts`、`src/components/blog/BlogPostBody.tsx` | 英文文章 | PB-07 |
| `lib/fonts.ts`、`scripts/check-font-budget.mjs` | 字体/预算 | PB-08 |
| `lib/seo.ts`、`app/{sitemap,robots}.ts` | metadata/爬虫发现 | PB-09 |
| `tests/e2e/*`、`docs/superpowers/reports/portfolio-bilingual-verification.md` | 验收证据 | PB-03 开始、PB-10 汇总 |

PB-02 的 `lib/content/posts.ts` 暂时包装 `src/data/blog-posts.ts`，PB-07 更换 MDX 源，公共签名不变。

## Tickets 与依赖

| Ticket | 阶段/交付 | 依赖 | 规格验收 |
|---|---|---|---|
| [PB-01](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-01-active-badge.md) | Phase 1：徽章开关 | 核对当前 Phase 1 改动 | AC-01、02 |
| [PB-02](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-02-content-and-dictionaries.md) | Phase 3：完整双语数据/字典 | PB-01；原 Phase 1/2 验证完成 | AC-03 |
| [PB-03](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-03-nextjs-static-shell.md) | Phase 3：静态入口/测试服务器 | PB-02 | AC-04、05、13 基础 |
| [PB-04](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-04-localized-pages.md) | Phase 3：双语首页/Lab/列表 | PB-03 | AC-03、04、10 |
| [PB-04A](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-04A-api-migration.md) | Phase 3：原 Task 13 API 迁移 | PB-04；原 Phase 2 | API 安全与现有契约 |
| [PB-05](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-05-session-and-widget-state.md) | Phase 3：会话/草稿/组件文案 | PB-04A | AC-08、13 |
| [PB-06](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-06-language-navigation.md) | Phase 3：切换/滚动/焦点 | PB-05 | AC-07、09、10 |
| [PB-07](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-07-english-blog.md) | Phase 3：英文 MDX/条件跳转 | PB-04、06 | AC-05、06 |
| [PB-08](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-08-fonts-and-layout.md) | Phase 3：字体/排版 | PB-07 | AC-09、10、11 |
| [PB-09](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-09-bilingual-seo.md) | Phase 3：SEO | PB-07、08 | AC-12 |
| [PB-09A](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-09A-image-optimization.md) | Phase 3：补齐原Task16图片优化 | PB-09 | 图片及主题回归 |
| [PB-10](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-10-migration-acceptance.md) | Phase 3：验收/清理 | PB-01–09、PB-09A；原 Task 13 | AC-01–13 |

顺序：原 Phase 1 + PB-01 → 原 Phase 2 → PB-02 → PB-03 → PB-04 → PB-04A（原 Task 13）→ PB-05 → PB-06 → PB-07 → PB-08 → PB-09 → PB-09A（补齐原Task16图片部分）→ PB-10 → 原 Phase 4。

PB-02–09 共用类型、根布局与组件，串行确认实际接口。沿用原阶段执行分工时也不同时派发写同一文件的实现者。

## 替代与保留

| 原任务 | 执行入口 |
|---|---|
| Task 1–5 | 原内容继续；PB-01 新增徽章，保护未提交修改 |
| Task 6–9 | 原安全任务保留，不在此重复设计 |
| Task 10 | PB-03、08、10 替代骨架/字体/构建示例 |
| Task 11 | PB-02 替代无语言接口；PB-07 换博客源 |
| Task 12 | PB-04、05、06 替代页面/状态/导航；保留组件目录 |
| Task 13 | 以 PB-04A 单独执行和审核，放 PB-04 后；保留既有协议 |
| Task 14 | PB-07 替代；不再运行旧转换示例 |
| Task 15 | PB-09 替代单语言 SEO |
| Task 16 | 图片优化保留；PB-05 覆盖主题，PB-08 覆盖字体 |
| Task 17–18 | 原 Phase 4；保留 PB-05 会话边界，已清理文件勿重复删除 |

本计划优先于原 Task 10–16 冲突示例。`next lint` 改为 `eslint .`；每票必须可构建，不接受“报错留下一任务”。

## 完成规则

每票复选框默认未完成；关闭前回填验证命令、结果、未验证项、人工结论。浏览器桩验证状态不代表生产 API 验证，PB-10 分开报告。

本轮仅自检文档链接、依赖、AC 覆盖与接口一致性。票据中的测试代码是实施要求，尚无对应产品实现，也未运行这些测试。后续提交仅在授权工作流中执行，按单票明确路径暂存；本轮不会自动提交。

## 技术依据

- [Next.js 根布局](https://nextjs.org/docs/app/api-reference/file-conventions/layout)：动态语言根布局与多根布局整页跳转限制。
- [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)：父子语言参数的静态生成。
- [Next.js redirects](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects)：308、查询参数和固定跳转配置。
- [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)：订阅、稳定 snapshot 与 SSR snapshot。
- [Next.js Playwright](https://nextjs.org/docs/app/guides/testing/playwright)、[MDX](https://nextjs.org/docs/app/guides/mdx)：生产服务器测试及服务端内容渲染。执行时再对照已安装版本，不从文档编写日期推定 API。
