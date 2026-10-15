# 个人作品集站：内容更新 + 安全加固 + Next.js 迁移 + AI SDK 重构

> **2026-10-13 状态：** [Active 与双语规格](../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)已获用户批准，[实施计划及 PB-01–10 票据](2026-10-13-portfolio-bilingual-and-active-badge.md)已编写，等待审阅与执行安排。本轮仅文档，不执行编码、commit 或部署。下方冲突的单语言代码示例保留为历史参考；对应任务已由新计划中的票据替代，勿重复执行。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把网站上过期的内容换成当前简历的内容，加入项目级 Active 显示开关，堵上已发现的几个安全口子，然后把站点从 Vite SPA 迁到支持中英文内容与 SEO 的 Next.js App Router，最后用 Vercel AI SDK + DeepSeek 重写聊天助手。

**Architecture:** 内容与运行时数据分离——作者手写的内容（经历/项目/博客）留在 git 里的 TypeScript 文件；访客产生的运行时数据（限流计数、提交缓存）放 Supabase Postgres。所有数据库访问都在服务端、用 `service_role`，前端永不直连数据库，也不用 anon key。渲染用 Next.js 默认的静态生成（SSG），不做 SSR。

**Tech Stack:** React 19、TypeScript、Tailwind CSS 4、Framer Motion、Next.js（App Router）、Supabase（仅当 Postgres 用）、Vercel AI SDK v7、DeepSeek、Resend、pnpm、Node 22。

**Spec:** 原范围的决策记录在本文件“交接上下文”。2026-10-13 新增范围以[已批准独立规格](../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)为准；其中的语言、字体、路由与徽章决策替代冲突历史示例。对应 tickets 与执行依赖见[实施计划](2026-10-13-portfolio-bilingual-and-active-badge.md)。

---

## Global Constraints

- **包管理器必须是 pnpm**（当前 10.28.2）。不要用 npm 或 yarn。
- **Node 22**（当前 v22.22.0）。
- **Tailwind CSS 4**，通过 `@tailwindcss/postcss` 插件接入 Next.js。不要退回 Tailwind 3 的 `tailwind.config.js` 写法。
- **设计令牌**：主色 `#3B82F6`、辅色 `#8B5CF6`、强调色 `#06B6D4`；卡片圆角 `rounded-2xl`；玻璃拟态用 `backdrop-blur-xl`，以上保持。Phase 3 标题与正文统一改为 Noto Sans SC，字体本站托管；旧 Space Grotesk / DM Sans 示例由 PB-08 替代。
- **类型严格，禁止 `any`**。
- **深色模式是 class 驱动**（`darkMode: 'class'`），不是 `prefers-color-scheme`。`<html>` 上挂 `light` 或 `dark`。
- **前端永不导入 `@supabase/supabase-js`**，永不在客户端使用任何 Supabase key。所有数据库调用在服务端，用 `SUPABASE_SERVICE_ROLE_KEY`。
- **不执行 `git push`**。除非用户明确说推，否则只做本地 commit。
- **Supabase 项目 ref**：`leotovftixgkszdwylzu`（项目名 "personal website"）。
- **Vercel 项目**：`jason-portfolio`（`prj_jWPSDyA29ror5Qr5LkvVVrfirI2Q`，团队 `team_5PStP92UpvRMDDmgwETD0rPe`）。
- **线上域名**：`plonguo.com` / `www.plonguo.com`，经 Cloudflare 代理到 Vercel。
- **内容语言**：英文面向英文读者，简体中文面向国内公司；作品集内容及界面完整双语，博客文章标题、摘要和正文保持英文。双语与 SEO 一起纳入 Phase 3，不先迁成单语言再改路由。
- **项目徽章**：Phase 1 新增 `showActiveBadge`，现有每个项目显式为 `false`；首页和 Lab 使用共享 ActiveBadge，Demo 按钮仍由 `demoUrl` 控制。
- **正式地址**：首页、Lab、博客列表使用 `/en`、`/zh` 语言段；文章仅 `/en/blog/[slug]`。旧地址以 308 永久跳转保留可达性；具体映射以新增 spec 为准。
- **不添加自测题章节**到任何文档或页面。

---

## Review Focus

以下是 spec 隐含、但没有哪个任务的测试能覆盖到的输入/失败模式，按最可能出问题的顺序排列。每一条都在对应任务里配了测试或验证步骤。

1. **访客提交的联系表单里带 HTML/脚本** —— 合理预期是它作为纯文本出现在邮件里，而不是被执行或渲染成链接。Phase 2 Task 9 覆盖（Step 4 的 curl 验证第 2 条）。
2. **聊天接口在数据库不可用时** —— 合理预期是拒绝请求（fail-closed），因为每次放行都在烧钱调 LLM。Phase 3 Task 13 Step 4 与 Phase 4 Task 17 Step 4 覆盖。
3. **两个人同时打开聊天、并发发消息** —— 合理预期是限流计数准确（原子递增），不会因为读-改-写竞争而互相覆盖。Phase 4 Task 17 Step 5 覆盖（`on conflict do update` 单语句完成读-改-写）。
4. **用户输入里含撇号、斜杠、中文** —— 合理预期是原样送到模型，不被转义污染。Phase 4 Task 18 Step 1-3 覆盖。
5. **首次访问、系统偏好深色、且 JS 尚未执行** —— 合理预期是页面直接以深色渲染，不出现白色闪屏。Phase 3 Task 16 Step 5-6 覆盖。

---

## 交接上下文（新 session 必读）

这是本轮对话（2026-10-09）里已经查实的事实和已经拍板的决定。新 session 没有这些上下文，所以在这里完整记一遍。

### 已经完成的事

Supabase 生产库的两张表已经上锁（已执行并验证）：

```sql
ALTER TABLE public.github_commits_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage all rows" ON public.chat_rate_limits;
REVOKE ALL ON public.chat_rate_limits     FROM anon, authenticated;
REVOKE ALL ON public.github_commits_cache FROM anon, authenticated;
```

验证结果：两张表 `rls_enabled = true`、`policy_count = 0`；`anon` 和 `authenticated` 的 SELECT/INSERT/UPDATE/DELETE 全部为 `false`；`service_role` 全部保留 `true`（`service_role` 自带 `bypassrls`，所以 `api/` 的调用不受影响）。

### 用户拍板的决定

1. **内容优先于架构。** 网站上现在的内容与简历严重不符，而那是访客唯一能看到的东西。
2. **作者手写的内容留在文件里**（git），不进数据库。内容量小，且编辑者就是开发者本人。
3. **站点定位**：个人网站 + 作品展示。不是产品，无多用户，无登录 —— 所以 Supabase Auth 不在范围内。
4. **Vercel 与 Supabase 的分工规则**：*需要密钥、或要联系外部服务的代码 → Vercel；纯 SQL 操作库里已有数据的活 → 留在 Postgres。* 拿不准时默认 Vercel，这样代码、环境变量、日志、部署只有一个地方。Supabase Edge Functions 保持为零。唯一例外是 `pg_cron` 承担限流清理任务（纯 SQL、无密钥、无网络跳转）。
5. **RLS 立场**：不用复杂策略型 RLS（没有用户），但要用"默认拒绝"型 RLS 当锁 —— 除 `service_role` 外谁都进不来。
6. **渲染方式**：SSG，不是 SSR。内容对所有人一样，SSR 是纯浪费。

### 已发现的真实问题（本轮查证，尚未修复）

| # | 位置 | 问题 |
|---|---|---|
| 1 | `api/send-email.ts` | 无 HTML 转义、无 CORS 校验、无限流、无 Turnstile。访客可注入任意 HTML 到发给站长自己的邮件里。**这是目前最暴露的入口。** |
| 2 | `api/chat.ts:190` | 限流错误处理是 fail-open（`return { allowed: true }`）。数据库不可用时限流器静默关闭。方向反了。 |
| 3 | `api/chat.ts` | 限流是先 `select` 再 `update`，非原子。并发请求互相覆盖计数。 |
| 4 | `api/chat.ts` `sanitizeMessage()` | 把 `'` 转成 `&#x27;`、`/` 转成 `&#x2F;`，污染用户输入。且完全没必要 —— `Chatbot.tsx:48` 用 `{message.content}`，React 已自动转义。 |
| 5 | `api/chat.ts` `totalTokens += 1` | 数的是流式 chunk 个数，不是 token。导致"每小时 10 万 token"的限制形同虚设。 |
| 6 | `public/images/self-pic.jpg` | **9.07 MB**。About 页面的头像。`public/` 总计 13 MB。 |
| 7 | `src/pages/BlogPostPage.tsx` | 约 150 行手写 markdown 解析器，不支持链接、图片、表格、嵌套列表、引用。 |
| 8 | 全站 | **没有任何 `document.title` 或 meta 标签的动态设置。** `index.html` 里写死一个标题，9 篇博客 + `/blog` + `/lab` + 首页全部共用。社交卡片抓到的永远是同一句通用描述。 |
| 9 | `public.cleanup_old_rate_limits()` | 函数已定义但 `pg_cron` 扩展**未安装**，所以从未被调用。限流表只增不减。 |
| 10 | `cleanup_old_rate_limits` | `search_path` 可变（Supabase linter `function_search_path_mutable`）。函数体里 `DELETE FROM chat_rate_limits` 没写 schema 前缀。 |

### 用户已确认但尚未提供的信息

- **DeepSeek API key** —— 用户说"到时候我会给你"。Phase 4 需要它。在拿到之前不要写死任何占位 key。
- **简历英文版**：`public/Huizhirong Guo.pdf` 已存在，但本次内容以中文简历 `过汇智融-简历.docx` 为准翻译。

### 一个被用户记错的点（已澄清，勿重复讨论）

用户以为"每次输入没有拼接历史对话"。**实际上已经在拼了**：`src/hooks/useChatbot.ts:96` 取最近 10 条消息作为 `history` 发送，`api/chat.ts` 的 `prepareMessages()` 把它拼在 system prompt 之后。这条不需要做任何改动。

---

## 文件结构

### Phase 1 与 Phase 2（在现有 Vite 应用里做）

| 文件 | 职责 | 动作 |
|---|---|---|
| `src/types/index.ts` | 内容实体的类型定义 | 修改：给 `Experience` / `Project` / `Education` 加字段 |
| `src/data/portfolio.ts` | 全部作者手写内容 | 重写 |
| `src/components/Qualifications.tsx` | 教育与经历时间线 | 修改：渲染 highlights 列表 |
| `src/components/Portfolio.tsx` | 项目卡片 | 修改：渲染 tagline，标签排序 |
| `src/components/Hero.tsx` | 首屏 | 修改：定位文案、打字机文本 |
| `src/components/About.tsx` | 关于我 | 修改：bio 与 stats |
| `src/components/Skills.tsx` | 技能网格 | 修改：按新分类分组 |
| `src/components/Contact.tsx` | 联系区 | 基本不动 |
| `src/api/validation.ts` | 邮箱校验与输入清洗（纯函数） | 新建 |
| `src/api/security.ts` | CORS 校验与 Turnstile 验证（共享） | 新建 |
| `api/send-email.ts` | 联系表单接口 | 重写 |
| `api/chat.ts` | 聊天接口 | 仅修 fail-open（其余留给 Phase 4） |
| `api/_shared/` | 服务端共享代码 | 新建 |

> 说明：Phase 1/2 是过渡期改动，Phase 3 迁移时会把这些文件按 Next.js 约定重新落位。Phase 1 改的是 `src/data/` 和组件，迁移时几乎原样搬运。

### Phase 3 与 Phase 4（Next.js 目标结构）

> 以下是 2026-10-09 的单语言结构历史示例。实际路径由新实施计划及 PB-02–09 明确：`app/[lang]`、共享元数据与双语字典，文章仅英文，现有展示组件保留在 `src/components/`。不直接复制此旧结构。

```
app/
  layout.tsx                    # 根布局：字体、主题注入脚本、全局 metadata
  page.tsx                      # 首页（Hero + About + Skills + Qualifications + Portfolio + Contact）
  blog/page.tsx                 # 博客列表
  blog/[slug]/page.tsx          # 单篇博客（generateStaticParams + generateMetadata）
  lab/page.tsx                  # Lab 项目页
  sitemap.ts                    # 站点地图
  robots.ts                     # 爬虫规则
  api/chat/route.ts             # 聊天接口（AI SDK 流式）
  api/send-email/route.ts       # 联系表单
  api/github-commits/route.ts   # 提交记录缓存
components/                     # 现有组件，加 'use client' 指令
content/
  posts/*.mdx                   # 博客从 .ts 模板字符串迁移到 MDX
lib/
  content/posts.ts              # getPosts() / getPost(slug) —— 内容层接缝
  content/projects.ts           # getProjects() / getProject(slug)
  supabase/admin.ts             # 服务端 Supabase 客户端（仅 service_role）
  rate-limit.ts                 # 原子限流
  escape.ts                     # HTML 转义（纯函数）
public/images/                  # 压缩后的图片
```

**关键设计：`lib/content/` 是那道接缝。** 组件只调用 `getProjects()`，永不直接 import 数据文件。将来若内容改从数据库读，只改这一个文件，组件一行不动。

---

## Phase 1：内容更新

> 2026-10-13 新增：项目级 Active 显示开关与共享组件纳入本阶段，目标是全部关闭且保留 Demo。步骤见 PB-01；尚未实现，当前未提交内容改动不自动视为通过验收。

**这一阶段结束后应该能立刻部署、立刻有价值。** 全部改动集中在 `src/data/portfolio.ts` 和几个展示组件，不涉及架构。

### Task 1: 扩展类型定义

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `Experience` 增加 `companyNote?`、`location?`、`summary?`、`highlights?`；`Project` 增加 `tagline?`、`highlights?`、`featured?`；`Education` 增加 `note?`。Phase 1 后续所有任务都消费这些字段。

- [ ] **Step 1: 改写 `src/types/index.ts`**

```ts
export interface Skill {
  name: string;
  icon: string;
  category: 'language' | 'framework' | 'ai' | 'data' | 'tool';
}

export interface Education {
  degree: string;
  school: string;
  college?: string;
  location?: string;
  period: string;
  note?: string;
  year: number;
}

export interface Experience {
  title: string;
  company: string;
  companyNote?: string;
  location?: string;
  period: string;
  summary?: string;
  highlights?: string[];
  /** @deprecated 用 highlights 代替；保留仅为 Phase 3 迁移前的兼容 */
  description?: string;
  year: number;
}

export interface Project {
  title: string;
  tagline?: string;
  description: string;
  highlights?: string[];
  image: string;
  demoUrl?: string;
  githubUrl?: string;
  technologies: string[];
  year: number;
  featured?: boolean;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface ContactInfo {
  phone: string[];
  email: string[];
}

// Chat types
export * from './chat';
```

- [ ] **Step 2: 类型检查**

Run: `pnpm exec tsc -b --noEmit`
Expected: 报错，因为 `portfolio.ts` 里的 `category: 'design'` 不再合法。这是预期的 —— Task 2 会修。

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor(types): add highlight fields, reshape skill categories"
```

---

### Task 2: 重写内容数据

**Files:**
- Modify: `src/data/portfolio.ts`

**Interfaces:**
- Consumes: Task 1 的类型
- Produces: `personalInfo`、`skills`、`education`、`experience`、`projects`、`socialLinks`、`contactInfo` 七个导出，字段与 Task 1 一致

**内容来源**：`/Users/plonguo/Desktop/重要图片文件信息/Resume, Transcript, and SoP/Resume/中文简历/过汇智融-简历.docx`
读取命令：`textutil -convert txt -stdout "过汇智融-简历.docx"`

- [ ] **Step 1: 替换 `personalInfo`**

定位改为 AI Agent 方向，与简历一致：

```ts
export const personalInfo = {
  name: 'Huizhirong (Jason) Guo',
  shortName: 'Jason Guo',
  title: 'AI Agent & LLM Application Engineer',
  bio: 'I build AI agents and LLM applications, with full-stack and production backend experience. I like making technical choices that are driven by measurement rather than by feel.',
  aboutDescription:
    'AI Agent and LLM application developer with full-stack engineering and production backend experience. I default to quantitative evaluation when choosing between architectures and models. Internship experience in both China and the US; comfortable working in English and Chinese.',
  stats: {
    projects: '6+',
    companies: '04+',
  },
  focus: [
    'Agent architecture & tool loops',
    'RAG retrieval pipelines',
    'LLM evaluation & cost optimization',
    'Production backend (Go / Python / TypeScript)',
  ],
};
```

- [ ] **Step 2: 替换 `education`**

**关键修正**：毕业时间从 "2024 - 2026 Dec" 改为 **2027.04**（简历为准）。删掉高中。

```ts
export const education: Education[] = [
  {
    degree: 'M.S. in Computer Science',
    school: 'Northeastern University',
    college: 'Khoury College of Computer Sciences',
    period: 'Sep 2024 – Apr 2027 (Expected)',
    year: 2024,
  },
  {
    degree: 'B.S. in Computer Science',
    school: 'Santa Clara University',
    college: 'College of Arts and Sciences',
    location: 'Silicon Valley, CA',
    period: 'Sep 2020 – Jun 2024',
    year: 2020,
  },
];
```

- [ ] **Step 3: 替换 `experience`**

按时间倒序。**注意 2026.09–2026.12 是当前进行中的实习**（今天是 2026-10-09）。

```ts
export const experience: Experience[] = [
  {
    title: 'Agent Algorithm Intern',
    company: 'Saisuode Intelligence',
    companyNote: 'Embodied AI',
    location: 'Shanghai, China',
    period: 'Sep 2026 – Dec 2026',
    summary: 'On-robot Agent architecture and core algorithms',
    highlights: [
      'Building the on-robot Agent architecture and implementing its core algorithms.',
      'Integrating the Agent with the motion-control and vision-perception modules, working alongside the locomotion and vision teams.',
    ],
    year: 2026,
  },
  {
    title: 'Agent Development Intern',
    company: 'Bosch China',
    location: 'Wuxi, China',
    period: 'May 2026 – Aug 2026',
    summary: 'Email Assistant — led the Dify backend workflow (100+ DAU)',
    highlights: [
      'Led design and delivery of the email assistant backend workflow: batch summarization of unread mail and multi-turn reply drafting. Designed multi-factory tenant routing with cost isolation, lightweight-model pre-routing, and automatic fallback on failure — keeping model spend controlled while serving multiple factories reliably.',
      'Built a 30-sample comparison harness from real emails and chose the architecture on end-to-end latency and output quality. Moving from Agent to Workflow cut P95 from 52s to 18s; tiered model routing then cut latency a further 50%+ on 70% of samples with no quality loss.',
      'With the platform managed by another team and no database access, instrumented parallel branches and reused the platform dedup to break usage monitoring down from application level to per-user call and cost tracking.',
    ],
    year: 2026,
  },
  {
    title: 'Agent Development Intern',
    company: 'Bosch China',
    location: 'Wuxi, China',
    period: 'May 2026 – Aug 2026',
    summary: 'Intelligent Scheduling POC',
    highlights: [
      'Modeled material, capacity, and driver-vehicle shift constraints across 5 MySQL tables, exposed the data layer as an MCP service, and wrote a scheduling Skill so a deepagents Agent could generate schedules from live constraints and adjust them through multi-turn dialogue — turning fixed-rule scheduling into a natural-language, interactive decision POC.',
    ],
    year: 2026,
  },
  {
    title: 'Software Engineer Intern',
    company: 'Next Play Games',
    location: 'San Jose, CA',
    period: 'Sep 2025 – Dec 2025',
    summary: 'B2B SaaS coaching platform',
    highlights: [
      'Led full-stack development of a B2B SaaS coaching platform. Established a versioned migration pipeline: migrations validated per-PR and post-merge in CI before syncing to dev/prod, with a rollback strategy — removing schema drift risk under parallel development.',
      'Rebuilt the data path: direct Supabase access from the frontend under RLS, with business logic pushed down into Postgres RPC — end-to-end P95 from ~420ms to ~170ms. Replaced 1-second mobile polling with Realtime WebSocket subscriptions, cutting a single client from ~29,000 requests/day to a handful.',
      'Led AI-assisted development for the team: an AGENT.md that standardized coding-agent conventions across 10+ developers (3 new members onboarded from it), plus AI PR review via GitHub Actions so large AI-generated diffs stay reviewable, auto-filing an issue when CI fails.',
      'Built AI coaching features on the OpenAI API with an automated fine-tuning pipeline: 200+ samples, 5 fully automated iterations, zero manual intervention.',
    ],
    year: 2025,
  },
  {
    title: 'Backend Engineer Intern',
    company: 'Beijing Geshang Fuxin Wealth Advisory',
    location: 'Beijing, China',
    period: 'Jun 2025 – Aug 2025',
    highlights: [
      'Maintained and extended 5 core RESTful APIs in a 7-year-old Flask/MongoDB codebase, keeping changes backward compatible with zero production interruption and no regressions.',
      'Replaced full-collection queries with pagination on list endpoints, cutting response time from 300–500ms to 200ms.',
    ],
    year: 2025,
  },
];
```

> **给执行者的说明**：简历里 Bosch 的两条是"邮件助手"和"智能排班系统 POC"两个独立项目，共用一段实习时间。上面拆成两条 `Experience` 是为了让时间线能分别展示。如果你觉得一条更清楚，也可以合并成一条、把两部分都塞进 `highlights`。这是个可自行判断的取舍。

- [ ] **Step 4: 替换 `projects`**

保留现有项目，新增 KnowHive，并更新 GoChatroom 的描述（简历里的技术细节比网站现有版本丰富得多）。

```ts
export const projects: Project[] = [
  {
    title: 'KnowHive',
    tagline: 'Local-first RAG + Agent knowledge base desktop app',
    description:
      'A local-first knowledge base desktop app with hybrid retrieval, an agent tool layer, long-term memory, and injection defenses — every retrieval change validated by RAGAS A/B before becoming the default.',
    highlights: [
      'Retrieval: a unified document layer picks a chunking strategy per file type and uses parent/child blocks. Hybrid recall over vectors and FTS5 keywords, fused with RRF and reranked by a cross-encoder, then parent-block expansion restores context. Promoted to default only after RAGAS A/B showed context_precision 0.788 → 0.862. Also fixed FTS5 silently failing to tokenize Chinese, which had disabled keyword retrieval entirely (recall +0.054).',
      'Agent tooling: 7 knowledge-base and session-history tools on the AI SDK tool loop, with call caps and duplicate-retrieval guards so a text answer is always produced. Write operations fail closed and require human approval (HITL).',
      'Long-term memory: past conversations are distilled into semantic, preference, and episodic memories, retrieved by vector search or injected directly. Questions whose answer existed only in conversation history went from 0% to 100% correct.',
      'Refusal and injection defense: a rerank-score threshold turned unanswerable questions into correct refusals 32% → 91% of the time (4% false refusals). Spotlighting isolation cut injection success from 0.40 to 0.27. A later refactor regressed it to 0.47, caught by a self-built red-team suite before merge.',
    ],
    image: '/images/knowhive.png',
    githubUrl: 'https://github.com/PlonGuo/KnowHive',
    technologies: ['TypeScript', 'Bun', 'Vercel AI SDK', 'Ollama', 'DeepSeek', 'SQLite', 'Langfuse'],
    year: 2026,
    featured: true,
  },
  // ... 其余项目保留现有内容，按下述规则调整
];
```

**其余项目的调整规则：**
- `SmIA` — 保留，`featured: true`
- `GoChatroom` — 保留，`description` 换成简历里的版本，`highlights` 加两条（见下）
- `AI-Powered Mom Test Validation` — 保留
- `Travel Agent Booking System` — 保留
- `Flowboard` — 保留
- `Sportlingo Coaching Dashboard` — 保留
- `Makeform.ai` — 保留
- `GitHub Finder` / `Food E-commerce Platform` — 保留，`year` 分别是 2024 / 2023

GoChatRoom 的新 description 与 highlights：

```ts
    description:
      'Real-time chat backend in Go supporting private chat, group chat, and P2P video calling, with a React frontend on Vercel and the service on Fly.io.',
    highlights: [
      'Goroutine-per-connection with separated read/write loops, buffered channels for non-blocking delivery, and differentiated backpressure for chat and signaling. Profiling traced a throughput ceiling to synchronous persistence inside the Hub event loop; proposed an async, sharded fix.',
      'Stateless JWT auth with zero DB lookups on business endpoints, Redis session management, and a custom WebRTC signaling service supporting ICE candidate queueing plus two-level recovery for signaling and media.',
    ],
```

- [ ] **Step 5: 替换 `skills`**

按简历的技能表重建。**删掉设计类噪音**（Photoshop / Illustrator / InDesign）——简历里没有，且与 AI Agent 定位无关。

```ts
export const skills: Skill[] = [
  // Languages
  { name: 'Python', icon: 'python', category: 'language' },
  { name: 'TypeScript', icon: 'typescript', category: 'language' },
  { name: 'JavaScript', icon: 'javascript', category: 'language' },
  { name: 'Go', icon: 'go', category: 'language' },
  { name: 'SQL', icon: 'postgresql', category: 'language' },

  // AI / Agent
  { name: 'Vercel AI SDK', icon: 'vercel', category: 'ai' },
  { name: 'LangChain', icon: 'langchain', category: 'ai' },
  { name: 'LangGraph', icon: 'langgraph', category: 'ai' },
  { name: 'deepagents', icon: 'langchain', category: 'ai' },
  { name: 'Dify', icon: 'dify', category: 'ai' },
  { name: 'MCP', icon: 'modelcontextprotocol', category: 'ai' },
  { name: 'Langfuse', icon: 'langfuse', category: 'ai' },
  { name: 'RAG', icon: 'openai', category: 'ai' },

  // Frameworks
  { name: 'Next.js', icon: 'nextdotjs', category: 'framework' },
  { name: 'React', icon: 'react', category: 'framework' },
  { name: 'FastAPI', icon: 'fastapi', category: 'framework' },
  { name: 'Flask', icon: 'flask', category: 'framework' },
  { name: 'Gin', icon: 'gin', category: 'framework' },
  { name: 'Tailwind', icon: 'tailwindcss', category: 'framework' },
  { name: 'Electron', icon: 'electron', category: 'framework' },

  // Data
  { name: 'PostgreSQL', icon: 'postgresql', category: 'data' },
  { name: 'MySQL', icon: 'mysql', category: 'data' },
  { name: 'MongoDB', icon: 'mongodb', category: 'data' },
  { name: 'Redis', icon: 'redis', category: 'data' },
  { name: 'SQLite', icon: 'sqlite', category: 'data' },
  { name: 'Supabase', icon: 'supabase', category: 'data' },

  // Tools & DevOps
  { name: 'Git', icon: 'git', category: 'tool' },
  { name: 'GitHub Actions', icon: 'githubactions', category: 'tool' },
  { name: 'Docker', icon: 'docker', category: 'tool' },
  { name: 'Vercel', icon: 'vercel', category: 'tool' },
  { name: 'AWS', icon: 'amazonaws', category: 'tool' },
  { name: 'Azure', icon: 'microsoftazure', category: 'tool' },
];
```

> **注意**：`icon` 字段驱动 Simple Icons CDN 的 slug。上面用到的新 slug（`vercel`、`langgraph`、`dify`、`modelcontextprotocol`、`flask`、`githubactions`、`amazonaws`）需要验证在 Simple Icons 里存在，否则 fallback 到首字母。Step 7 会验证。

- [ ] **Step 6: 更新 `socialLinks` 与 `contactInfo`**

`socialLinks` 保持不变。`contactInfo` 以简历为准，只留简历上的联系方式：

```ts
export const contactInfo: ContactInfo = {
  phone: ['(+86) 199-5270-9509'],
  email: ['jason.ghzr@gmail.com'],
};
```

- [ ] **Step 7: 验证 icon slug 有效性**

对 Step 5 里每个新 slug 跑一次存在性检查：

```bash
for s in vercel langgraph dify modelcontextprotocol flask githubactions amazonaws langchain openai; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://cdn.simpleicons.org/$s")
  echo "$s -> $code"
done
```

Expected: 全部 `200`。**任何非 200 的 slug 必须换成存在的等价 slug，或在 `src/components/Skills.tsx` 里确认 fallback 逻辑能优雅降级。**

- [ ] **Step 8: 类型检查与构建**

Run: `pnpm exec tsc -b --noEmit`
Expected: 只剩 `src/data/portfolio.ts` 里 `category: 'design'` 相关的报错 —— 但 Task 2 已经重写了这个文件，所以这里应该**零错误**。

如果仍有报错，检查是不是漏改了某个 `category: 'design'` 条目。

`pnpm build` 留到 Task 4 之后再跑 —— 届时 `Skills.tsx` 的分类映射才会同步更新。

- [ ] **Step 9: Commit**

```bash
git add src/data/portfolio.ts
git commit -m "content: sync portfolio with current resume (AI Agent positioning)"
```

---

### Task 3: 时间线组件渲染 highlights

**Files:**
- Modify: `src/components/Qualifications.tsx`

**Interfaces:**
- Consumes: `experience[].highlights`、`experience[].summary`、`experience[].location`、`experience[].companyNote`、`education[].college`、`education[].note`

- [ ] **Step 1: 替换经历卡片的内容块**

在 `src/components/Qualifications.tsx` 中，找到 `{experience.map((item, index) => (` 内部的那个内容卡片 `<div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 ...">`，把它的整个内部替换为：

```tsx
<h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-1">
  {item.title}
</h4>
<p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
  {item.company}
  {item.companyNote && (
    <span className="text-slate-500 dark:text-slate-500"> · {item.companyNote}</span>
  )}
</p>
<p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
  {item.period}
  {item.location && ` • ${item.location}`}
</p>
{item.summary && (
  <p className="text-sm font-medium text-secondary mb-2">{item.summary}</p>
)}
{item.highlights && item.highlights.length > 0 && (
  <ul className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-2 space-y-2">
    {item.highlights.map((point, i) => (
      <li
        key={i}
        className="text-sm text-slate-500 dark:text-slate-400 flex gap-2"
      >
        <span className="text-secondary shrink-0 mt-0.5">▸</span>
        <span>{point}</span>
      </li>
    ))}
  </ul>
)}
```

- [ ] **Step 2: 替换教育卡片的内容块**

同样地，在 `{education.map(...)}` 内找到内容卡片，替换内部：

```tsx
<h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-1">
  {item.degree}
</h4>
<p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{item.school}</p>
{item.college && (
  <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">{item.college}</p>
)}
<p className="text-xs text-slate-500 dark:text-slate-500">
  {item.period}
  {item.location && ` • ${item.location}`}
</p>
{item.note && (
  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-700 pt-2">
    {item.note}
  </p>
)}
```

- [ ] **Step 3: 视觉检查**

Run: `pnpm dev`
在浏览器打开 `http://localhost:5173`，滚动到 Qualification 区域。
Expected:
- 教育时间线显示 2 条（不再是 3 条），东北大学写的是 **Apr 2027 (Expected)**
- 经历时间线显示 5 条，最上面一条是 Saisuode Intelligence
- 每条经历的 bullet 都在，深色/浅色两种模式下文字都可读
- **单独检查深色模式**：`▸` 符号和 bullet 文字在深色下对比度足够

- [ ] **Step 4: Commit**

```bash
git add src/components/Qualifications.tsx
git commit -m "feat(qualifications): render experience highlights and education college"
```

---

### Task 4: 更新首屏、关于我、技能与项目卡片

**Files:**
- Modify: `src/components/Hero.tsx`
- Modify: `src/components/About.tsx`
- Modify: `src/components/Skills.tsx`
- Modify: `src/components/Portfolio.tsx`

**Interfaces:**
- Consumes: `personalInfo.title`、`personalInfo.focus`、`skills[].category`、`projects[].tagline`、`projects[].featured`

- [ ] **Step 1: Hero 打字机文本**

`src/components/Hero.tsx` 第 5-10 行，替换 `typewriterTexts`：

```ts
const typewriterTexts = [
  'Huizhirong Guo',
  'an AI Agent Engineer',
  'an LLM Application Developer',
  'a Full-Stack Engineer',
];
```

- [ ] **Step 2: Hero 展示 `personalInfo.title`**

在同一文件里找到渲染 `personalInfo.title` 的位置（若当前没有渲染 title，在姓名下方加一行）：

```tsx
<p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mt-2">
  {personalInfo.title}
</p>
```

- [ ] **Step 3: 技能分组**

> `src/components/Skills.tsx` 有**两个**分类映射常量，两个都要换。

把 `categoryColors`（约第 65-70 行）整体替换为：

```tsx
// Skill category colors
const categoryColors: Record<Skill['category'], string> = {
  ai: 'from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/30',
  language: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  framework: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  data: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
  tool: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
};
```

把 `categoryLabels`（约第 73-78 行）整体替换为：

```tsx
const categoryLabels: Record<Skill['category'], string> = {
  ai: 'AI / Agent',
  language: 'Languages',
  framework: 'Frameworks',
  data: 'Databases',
  tool: 'Tools & DevOps',
};
```

在 `categoryLabels` 下方加渲染顺序常量：

```tsx
/** Controls the render order of the skill groups. */
const categoryOrder: Skill['category'][] = [
  'ai',
  'language',
  'framework',
  'data',
  'tool',
];
```

在文件顶部加类型 import：

```tsx
import type { Skill } from '../types';
```

**然后把渲染循环从"遍历对象键"改成"遍历 `categoryOrder`"** —— 这一步必须做，否则分组顺序会是数据里首次出现的顺序，不可控。

找到原来的（约第 124 行）：

```tsx
{(Object.keys(groupedSkills) as Array<keyof typeof categoryColors>).map((category, categoryIndex) => (
```

替换为：

```tsx
{categoryOrder.map((category, categoryIndex) => {
  const group = groupedSkills[category];
  if (!group || group.length === 0) return null;
  return (
```

**然后必须补上对应的闭合** —— 原来是箭头函数的表达式体 `(...)`，现在换成了带 `return` 的块体，所以循环结尾处的 `))}` 要改成：

```tsx
  );
})}
```

**这是全任务最容易出错的地方。** 改完立刻跑 Step 8 的构建，让编译器确认括号配对。

> 原来的 `as Array<keyof typeof categoryColors>` 断言可以删掉了 —— `categoryOrder` 本身就是 `Skill['category'][]`。这也顺便消掉了"`categoryColors` 多一个键编译器不会报错"这个隐患。

- [ ] **Step 3b: 删掉设计类图标 import**

`src/components/Skills.tsx` 顶部（约第 5-21 行）有一批 SVG 图标 import，其中三个是设计类，现在没用了：

```tsx
import indesignIcon from '../assets/icons/indesign.svg';
import photoshopIcon from '../assets/icons/photoshop.svg';
import illustratorIcon from '../assets/icons/illustrator.svg';
```

以及 `iconMap` 里对应的三个条目：

```tsx
'adobeindesign': indesignIcon,
'adobephotoshop': photoshopIcon,
'adobeillustrator': illustratorIcon,
```

全部删掉，然后验证无残留：

```bash
grep -n "indesign\|photoshop\|illustrator" src/components/Skills.tsx
```

Expected: 无输出。

对应的 SVG 资源文件一并删除：

```bash
git rm src/assets/icons/indesign.svg src/assets/icons/photoshop.svg src/assets/icons/illustrator.svg
```

- [ ] **Step 4: 项目卡片渲染 tagline**

`src/components/Portfolio.tsx` 里，在项目标题下方加：

```tsx
{project.tagline && (
  <p className="text-sm font-medium text-primary mb-2">{project.tagline}</p>
)}
```

- [ ] **Step 5: 确认首页项目数量限制**

Run: `grep -n "slice\|featured" src/components/Portfolio.tsx`
Expected: 看到控制首页展示数量的逻辑（此前有个 commit 提到"limit portfolio to 5"）。

如果存在硬编码的 `.slice(0, 5)`，改为优先展示 `featured` 项目：

```tsx
const displayedProjects = projects
  .filter((p) => p.featured)
  .concat(projects.filter((p) => !p.featured))
  .slice(0, 6);
```

并把 `{projects.map(...)}` 换成 `{displayedProjects.map(...)}`。

- [ ] **Step 6: About 展示 focus 列表**

`src/components/About.tsx` 里，在 `{personalInfo.aboutDescription}` 那段之后加：

```tsx
{personalInfo.focus && (
  <ul className="space-y-2 mb-8">
    {personalInfo.focus.map((item, i) => (
      <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        {item}
      </li>
    ))}
  </ul>
)}
```

`personalInfo` 的类型是推导出来的，`focus` 已加在 Task 2 的 Step 1 里，所以 `personalInfo.focus` 可直接访问。

- [ ] **Step 7: 完整视觉检查**

Run: `pnpm dev`

逐项确认：
- 首屏打字机在四个新文案之间循环，无布局跳动
- About 的 focus 列表渲染 4 条
- Skills 分组顺序是 AI/Agent → Languages → Frameworks → Databases → Tools & DevOps，且**没有设计类**
- Portfolio 首页最多 6 个卡片，KnowHive 和 SmIA 在最前
- 每个项目卡片的 tagline 在标题下方
- **浅色与深色模式都过一遍**

- [ ] **Step 8: 构建与类型检查**

Run: `pnpm exec tsc -b --noEmit && pnpm build`
Expected: 全部通过，无 `any` 相关警告。

- [ ] **Step 9: Commit**

```bash
git add src/components/Hero.tsx src/components/About.tsx src/components/Skills.tsx src/components/Portfolio.tsx
git commit -m "content: reposition hero, about, skills and projects around AI Agent work"
```

---

### Task 5: 更新聊天助手的人格设定

**Files:**
- Modify: `api/chat.ts`（仅 `buildSystemPrompt()` 函数）

**为什么放在 Phase 1**：聊天助手是访客唯一能"跟网站对话"的入口，它现在还在说"我是 Software Development Engineer"。内容更新了它却还答旧的，就自相矛盾了。

**Interfaces:**
- Consumes: 无
- Produces: 无（内部函数）

- [ ] **Step 1: 替换 `buildSystemPrompt()` 返回的字符串**

在 `api/chat.ts` 里找到 `function buildSystemPrompt(): string {` 到它结束的模板字符串，整体替换为：

```ts
function buildSystemPrompt(): string {
  return `You are Jason Guo (Huizhirong Guo). You speak in first person about yourself on your personal portfolio website.

PERSONALITY:
- Friendly, approachable, occasionally dry humor
- Keeps answers concise (typically 2-4 sentences)
- You MUST refuse to discuss: politics, racism, violence, adult/NSFW content, or anything harmful. Politely redirect to your work and skills.

POSITIONING:
- I am an AI Agent and LLM application engineer with full-stack and production backend experience.
- I default to quantitative evaluation when choosing between architectures and models.

EDUCATION:
- M.S. in Computer Science, Northeastern University, Khoury College of Computer Sciences (Sep 2024 - Apr 2027 expected)
- B.S. in Computer Science, Santa Clara University, Silicon Valley (Sep 2020 - Jun 2024)

WORK EXPERIENCE (most recent first):

1. Saisuode Intelligence (embodied AI) - Agent Algorithm Intern (Sep-Dec 2026, Shanghai)
   - Building the on-robot Agent architecture and implementing its core algorithms
   - Integrating the Agent with motion-control and vision-perception modules

2. Bosch China - Agent Development Intern (May-Aug 2026, Wuxi)
   Email Assistant (100+ daily active users):
   - Led the Dify backend workflow: batch summarization of unread mail, multi-turn reply drafting
   - Designed multi-factory tenant routing with cost isolation, lightweight-model pre-routing, and automatic fallback
   - Built a 30-sample evaluation harness on real emails; moving Agent to Workflow cut P95 from 52s to 18s, and tiered model routing cut latency a further 50%+ on 70% of samples with no quality loss
   - With no database access (platform managed by another team), broke usage monitoring down from application level to per-user cost tracking
   Intelligent Scheduling POC:
   - Modeled constraints across 5 MySQL tables, exposed data as an MCP service, wrote a scheduling Skill so a deepagents Agent could generate and adjust schedules through multi-turn dialogue

3. Next Play Games - Software Engineer Intern (Sep-Dec 2025, San Jose)
   - Led full-stack development of a B2B SaaS coaching platform
   - Versioned migration pipeline validated per-PR and post-merge in CI, syncing to dev/prod with rollback strategy
   - Rebuilt the data path: Supabase direct access under RLS with business logic in Postgres RPC, P95 ~420ms to ~170ms
   - Replaced 1-second mobile polling with Realtime WebSocket subscriptions: ~29,000 requests/day per client down to a handful
   - AGENT.md standardizing coding-agent conventions across 10+ developers; AI PR review via GitHub Actions
   - Automated fine-tuning pipeline on the OpenAI API: 200+ samples, 5 automated iterations, zero manual intervention

4. Beijing Geshang Fuxin Wealth Advisory - Backend Engineer Intern (Jun-Aug 2025, Beijing)
   - Maintained and extended 5 core RESTful APIs in a 7-year-old Flask/MongoDB codebase, zero production interruption
   - Replaced full-collection queries with pagination, 300-500ms down to 200ms

PROJECTS:

1. KnowHive - local-first RAG + Agent knowledge base desktop app (TypeScript/Bun, Vercel AI SDK v7, Ollama + DeepSeek, Langfuse)
   - Hybrid retrieval over vectors and FTS5 keywords, RRF fusion and cross-encoder rerank, parent/child blocks
   - RAGAS A/B showed context_precision 0.788 to 0.862 before it became the default
   - Fixed FTS5 silently failing to tokenize Chinese (recall +0.054)
   - 7 agent tools with call caps and duplicate-retrieval guards; writes fail closed with human approval
   - Long-term memory split into semantic, preference and episodic; history-only questions went 0% to 100% correct
   - Refusal threshold took correct refusals from 32% to 91% (4% false refusals); spotlighting cut injection success 0.40 to 0.27

2. SmIA - Social Media Intelligence Agent (React, FastAPI, PydanticAI, Supabase, Langfuse)
   - Analyzes Reddit, YouTube and Amazon content via natural language queries
   - Fault-tolerant multi-source scraping with fallback and timeout handling
   - Demo: smia-agent.vercel.app

3. GoChatroom (Go, Gin, Redis, WebSocket, WebRTC, React)
   - Goroutine-per-connection with separated read/write loops and buffered channels
   - Stateless JWT auth with Redis sessions; custom WebRTC signaling with ICE candidate queueing
   - Deployed on Vercel + Fly.io

4. AI-Powered Mom Test Validation (Next.js, Gemini Live API, Supabase)
   - Real-time voice AI interviewer using the Mom Test framework, plus transcript analysis

5. Flowboard (.NET 8, Angular 17, SignalR, Azure)
   - Real-time collaborative kanban board with an Excalidraw whiteboard and dual SignalR hubs

6. Sportlingo Coaching Dashboard (React, Supabase, TypeScript)
   - B2B platform for coaches: team management, progress monitoring, real-time analytics

SKILLS:
- Languages: Python, TypeScript/JavaScript, Go, SQL
- AI/Agent: Vercel AI SDK, LangChain, LangGraph, deepagents, Dify, MCP, Langfuse, RAG
- Frameworks: Next.js, React, FastAPI, Flask, Gin, Tailwind, Electron
- Databases: PostgreSQL, MySQL, MongoDB, Redis, SQLite, Supabase
- Tools: Git, GitHub Actions, Docker, Vercel, AWS, Azure

WHY I CHOSE CS:
- With a computer I can create things entirely on my own, unlike buildings, cars or ships that need factories and crews
- That independence is what drew me in

CAREER GOAL:
- To independently build a product with a significant user base

INTERESTS:
- Gaming (League of Legends, Dota 2, Monster Hunter, Dying Light, World of Warcraft)
- HipHop and Pop music
- Deep travel: 10+ countries

CONTACT (only share if explicitly asked):
- Email: jason.ghzr@gmail.com
- LinkedIn: linkedin.com/in/jasonguo1104
- GitHub: github.com/PlonGuo
- For phone, suggest the contact form on the website

RESPONSE GUIDELINES:
- Always speak as "I" (Jason)
- When discussing projects, cite the specific metrics above rather than vague claims
- Never invent information that is not in this prompt
- If asked something inappropriate, decline politely and steer back to professional topics`;
}
```

- [ ] **Step 2: 本地验证聊天助手**

Run: `pnpm dev` （注意：`api/` 目录需要 `vercel dev` 才会被服务，普通 `vite dev` 不带接口）

改用：

```bash
pnpm add -g vercel@latest
vercel dev
```

打开 `http://localhost:3000`，点开聊天悬浮窗，依次问：

1. "What do you do?" → Expected: 回答提到 AI Agent / LLM 方向，不是 "Software Development Engineer"
2. "Where are you interning now?" → Expected: 提到 Saisuode Intelligence，且是现在进行时
3. "Tell me about KnowHive" → Expected: 提到 RAGAS、context_precision 0.788→0.862 这类具体数字
4. "What is your GPA?" → Expected: 模型正常回答（**注意**：此刻输入里的 `'` 会被 `sanitizeMessage` 污染；这属于 Phase 4 Task 17 的修复范围，本步只要模型仍能理解即可）

- [ ] **Step 3: Commit**

```bash
git add api/chat.ts
git commit -m "content(chat): rewrite system prompt to match new positioning"
```

---

## Phase 2：联系表单安全加固

`api/send-email.ts` 是目前唯一**完全没有防护**的接口：无转义、无 CORS、无限流、无 Turnstile。这条路径比架构迁移紧急，且独立，所以单独成阶段。

### Task 6: 引入测试基础设施

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/api/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: `pnpm test` 脚本；后续 Task 7/8 的测试都跑在这套设施上

> **为什么在这里加测试**：Phase 1 改的是数据，视觉检查就够了。从这里开始有真正的纯函数逻辑（转义、校验），值得用真实断言而不是靠肉眼。

- [ ] **Step 1: 安装 Vitest**

```bash
pnpm add -D vitest
```

- [ ] **Step 2: 加 test 脚本**

在 `package.json` 的 `"scripts"` 里加两行：

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: 写配置文件**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: 写一个会失败的冒烟测试**

Create `src/api/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 跑测试确认设施可用**

Run: `pnpm test`
Expected: PASS，1 个测试通过。

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/api/__tests__/smoke.test.ts
git commit -m "test: add vitest harness"
```

---

### Task 7: HTML 转义纯函数（TDD）

**Files:**
- Create: `src/api/validation.ts`
- Test: `src/api/__tests__/validation.test.ts`

**Interfaces:**
- Produces:
  - `escapeHtml(value: string): string` —— 转义 `& < > " '`
  - `isValidEmail(value: string): boolean`
  - `validateContactForm(body: unknown): { ok: true; data: ContactSubmission } | { ok: false; error: string }`
  - `interface ContactSubmission { name: string; email: string; subject: string; message: string }`

- [ ] **Step 1: 写会失败的测试**

Create `src/api/__tests__/validation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { escapeHtml, isValidEmail, validateContactForm } from '../validation';

describe('escapeHtml', () => {
  it('escapes the five dangerous characters', () => {
    expect(escapeHtml(`<script>alert('x')&"y"</script>`)).toBe(
      '&lt;script&gt;alert(&#39;x&#39;)&amp;&quot;y&quot;&lt;/script&gt;'
    );
  });

  it('escapes ampersand first so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeHtml('Hello, Jason! How are you?')).toBe('Hello, Jason! How are you?');
  });

  it('leaves non-ASCII text untouched', () => {
    expect(escapeHtml('你好，我是过汇智融')).toBe('你好，我是过汇智融');
  });

  it('handles an empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('jason.ghzr@gmail.com')).toBe(true);
  });

  it('accepts a plus-tagged address', () => {
    expect(isValidEmail('jason+work@gmail.com')).toBe(true);
  });

  it('rejects a missing at-sign', () => {
    expect(isValidEmail('jasongmail.com')).toBe(false);
  });

  it('rejects a missing domain', () => {
    expect(isValidEmail('jason@')).toBe(false);
  });

  it('rejects whitespace', () => {
    expect(isValidEmail('jason @gmail.com')).toBe(false);
  });

  it('rejects a newline injection attempt', () => {
    expect(isValidEmail('a@b.com\nBcc: victim@example.com')).toBe(false);
  });
});

describe('validateContactForm', () => {
  const valid = {
    name: 'Jane',
    email: 'jane@example.com',
    subject: 'Hello',
    message: 'Nice site',
  };

  it('accepts a complete submission', () => {
    const result = validateContactForm(valid);
    expect(result.ok).toBe(true);
  });

  it('rejects when a field is missing', () => {
    const result = validateContactForm({ ...valid, subject: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects when the body is not an object', () => {
    expect(validateContactForm(null).ok).toBe(false);
    expect(validateContactForm('hello').ok).toBe(false);
  });

  it('rejects an over-long message', () => {
    const result = validateContactForm({ ...valid, message: 'x'.repeat(5001) });
    expect(result.ok).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = validateContactForm({ ...valid, email: 'not-an-email' });
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm test src/api/__tests__/validation.test.ts`
Expected: FAIL —— 找不到模块 `../validation`。

- [ ] **Step 3: 写实现**

Create `src/api/validation.ts`:

```ts
export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const MAX_NAME = 200;
const MAX_SUBJECT = 300;
const MAX_MESSAGE = 5000;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape for safe interpolation into an HTML email body.
 * Ampersand is handled by the same single pass, so `&lt;` becomes `&amp;lt;`
 * rather than being re-decoded.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * Deliberately strict: no whitespace anywhere, one @, a dotted domain,
 * and no control characters (which is what blocks header-injection attempts).
 */
export function isValidEmail(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > 254) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(value)) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value);
}

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) return null;
  return trimmed;
}

export function validateContactForm(
  body: unknown
): { ok: true; data: ContactSubmission } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Invalid request body' };
  }

  const raw = body as Record<string, unknown>;

  const name = asTrimmedString(raw.name, MAX_NAME);
  if (!name) return { ok: false, error: 'Name is required' };

  const email = asTrimmedString(raw.email, 254);
  if (!email) return { ok: false, error: 'Email is required' };
  if (!isValidEmail(email)) return { ok: false, error: 'Email is not valid' };

  const subject = asTrimmedString(raw.subject, MAX_SUBJECT);
  if (!subject) return { ok: false, error: 'Subject is required' };

  const message = asTrimmedString(raw.message, MAX_MESSAGE);
  if (!message) return { ok: false, error: 'Message is required' };

  return { ok: true, data: { name, email, subject, message } };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm test src/api/__tests__/validation.test.ts`
Expected: PASS，全部 20 个断言通过。

- [ ] **Step 5: Commit**

```bash
git add src/api/validation.ts src/api/__tests__/validation.test.ts
git commit -m "feat(api): add HTML escaping and contact form validation"
```

---

### Task 8: 共享安全层（CORS + Turnstile）

**Files:**
- Create: `src/api/security.ts`
- Test: `src/api/__tests__/security.test.ts`

**Interfaces:**
- Produces: `ALLOWED_ORIGINS: readonly string[]`、`isAllowedOrigin(origin: string | undefined): boolean`、`verifyTurnstile(token: string, ip: string): Promise<boolean>`、`getClientIp(headers: Record<string, unknown>): string`

> **抽出共享是为了消除重复。** `api/chat.ts` 和 `api/github-commits.ts` 各自复制了一份 `ALLOWED_ORIGINS` 和 `validateCORS`。三份重复的 origin 白名单迟早会漂移。

- [ ] **Step 1: 写会失败的测试**

Create `src/api/__tests__/security.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isAllowedOrigin, getClientIp } from '../security';

describe('isAllowedOrigin', () => {
  it('allows production origins', () => {
    expect(isAllowedOrigin('https://plonguo.com')).toBe(true);
    expect(isAllowedOrigin('https://www.plonguo.com')).toBe(true);
  });

  it('allows localhost on any port for development', () => {
    expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
    expect(isAllowedOrigin('http://localhost:9999')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:3000')).toBe(true);
  });

  it('allows the Vercel preview host', () => {
    expect(isAllowedOrigin('https://jason-portfolio.vercel.app')).toBe(true);
  });

  it('rejects an unrelated site', () => {
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false);
  });

  it('rejects an origin that merely contains the domain as a substring', () => {
    expect(isAllowedOrigin('https://plonguo.com.evil.example.com')).toBe(false);
  });

  it('rejects a missing origin', () => {
    expect(isAllowedOrigin(undefined)).toBe(false);
  });
});

describe('getClientIp', () => {
  it('prefers the Cloudflare header', () => {
    expect(getClientIp({ 'cf-connecting-ip': '203.0.113.5', 'x-forwarded-for': '10.0.0.1' })).toBe(
      '203.0.113.5'
    );
  });

  it('falls back to the first entry of x-forwarded-for', () => {
    expect(getClientIp({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' })).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip', () => {
    expect(getClientIp({ 'x-real-ip': '203.0.113.9' })).toBe('203.0.113.9');
  });

  it('returns "unknown" when nothing is present', () => {
    expect(getClientIp({})).toBe('unknown');
  });

  it('handles an array-valued header', () => {
    expect(getClientIp({ 'x-forwarded-for': ['203.0.113.5', '10.0.0.1'] })).toBe('203.0.113.5');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm test src/api/__tests__/security.test.ts`
Expected: FAIL —— 找不到模块 `../security`。

- [ ] **Step 3: 写实现**

Create `src/api/security.ts`:

```ts
export const ALLOWED_ORIGINS: readonly string[] = [
  'https://plonguo.com',
  'https://www.plonguo.com',
  'https://jason-portfolio.vercel.app',
];

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Exact-match against the allowlist, plus localhost on any port for development.
 * Exact matching (not substring) is what stops `plonguo.com.evil.com` passing.
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (LOCALHOST_RE.test(origin)) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

export function getClientIp(headers: Record<string, unknown>): string {
  const pick = (name: string): string | undefined => {
    const value = headers[name];
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return undefined;
  };

  return (
    pick('cf-connecting-ip') ??
    pick('x-forwarded-for')?.split(',')[0]?.trim() ??
    pick('x-real-ip') ??
    'unknown'
  );
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      }
    );
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    // fail closed: a verification we could not complete is not a verification
    return false;
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm test src/api/__tests__/security.test.ts`
Expected: PASS，全部 11 个断言通过。

- [ ] **Step 5: Commit**

```bash
git add src/api/security.ts src/api/__tests__/security.test.ts
git commit -m "feat(api): add shared CORS allowlist, client IP and Turnstile helpers"
```

---

### Task 9: 重写联系表单接口

**Files:**
- Modify: `api/send-email.ts`（整体重写）

**Interfaces:**
- Consumes: Task 7 的 `validateContactForm` / `escapeHtml`；Task 8 的 `isAllowedOrigin` / `getClientIp` / `verifyTurnstile`
- Produces: 无（终端节点）

> **限流说明**：本任务的限流用 Supabase 里新建的 `contact_rate_limits` 表。这是"访客产生、非原子不可"的一类数据，符合进数据库的判据。

- [ ] **Step 1: 建限流表**

在 Supabase 项目 `leotovftixgkszdwylzu` 上执行（MCP 工具 `apply_migration`）：

```sql
create table if not exists public.contact_rate_limits (
  ip_key        text primary key,
  request_count integer not null default 0,
  window_start  timestamptz not null default now(),
  last_request  timestamptz not null default now()
);

alter table public.contact_rate_limits enable row level security;

revoke all on public.contact_rate_limits from anon, authenticated;
```

- [ ] **Step 2: 验证表已锁**

Run（MCP `execute_sql`）:

```sql
select c.relname, c.relrowsecurity,
       has_table_privilege('anon','public.'||c.relname,'SELECT') as anon_can_read
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='contact_rate_limits';
```

Expected: `relrowsecurity = true`，`anon_can_read = false`。

- [ ] **Step 3: 重写 `api/send-email.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { validateContactForm, escapeHtml } from '../src/api/validation';
import { isAllowedOrigin, getClientIp, verifyTurnstile } from '../src/api/security';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_REQUESTS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;

async function checkRateLimit(ipKey: string): Promise<boolean> {
  const now = new Date();

  const { data, error } = await supabase
    .from('contact_rate_limits')
    .select('request_count, window_start')
    .eq('ip_key', ipKey)
    .maybeSingle();

  if (error) {
    console.error('Contact rate limit read failed:', error);
    return false; // fail closed
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from('contact_rate_limits')
      .insert({ ip_key: ipKey, request_count: 1 });
    if (insertError) {
      console.error('Contact rate limit insert failed:', insertError);
      return false;
    }
    return true;
  }

  const windowExpired =
    now.getTime() - new Date(data.window_start).getTime() > WINDOW_MS;

  if (windowExpired) {
    const { error: resetError } = await supabase
      .from('contact_rate_limits')
      .update({ request_count: 1, window_start: now.toISOString(), last_request: now.toISOString() })
      .eq('ip_key', ipKey);
    if (resetError) {
      console.error('Contact rate limit reset failed:', resetError);
      return false;
    }
    return true;
  }

  if (data.request_count >= MAX_REQUESTS_PER_HOUR) return false;

  const { error: bumpError } = await supabase
    .from('contact_rate_limits')
    .update({ request_count: data.request_count + 1, last_request: now.toISOString() })
    .eq('ip_key', ipKey);
  if (bumpError) {
    console.error('Contact rate limit bump failed:', bumpError);
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin!);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.setHeader('Access-Control-Allow-Origin', origin!);

  const ip = getClientIp(req.headers as Record<string, unknown>);

  const turnstileToken = (req.body as Record<string, unknown> | undefined)?.turnstileToken;
  if (typeof turnstileToken === 'string' && turnstileToken.length > 0) {
    const verified = await verifyTurnstile(turnstileToken, ip);
    if (!verified) {
      return res.status(403).json({ error: 'Verification failed. Please try again.' });
    }
  }

  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return res
      .status(429)
      .json({ error: 'Too many messages. Please try again later.' });
  }

  const validation = validateContactForm(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const { name, email, subject, message } = validation.data;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: 'jason.ghzr@gmail.com',
      replyTo: email,
      subject: `[Portfolio] ${subject.replace(/[\r\n]+/g, ' ')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">New Contact Form Submission</h2>
          <hr style="border: 1px solid #E2E8F0;" />
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr style="border: 1px solid #E2E8F0;" />
          <h3>Message:</h3>
          <p style="white-space: pre-wrap; background: #F8FAFC; padding: 16px; border-radius: 8px;">${escapeHtml(message)}</p>
          <hr style="border: 1px solid #E2E8F0;" />
          <p style="color: #64748B; font-size: 12px;">Sent from the portfolio contact form.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

- [ ] **Step 4: 端到端验证**

Run: `vercel dev`

1. 正常提交表单 → Expected: 收到邮件，字段正常，无 `&amp;` 之类多余转义（除非原文本身有这些字符）
2. 用 curl 发一段带脚本的 payload：

```bash
curl -s -X POST http://localhost:3000/api/send-email \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:5173' \
  -d '{"name":"Test","email":"t@example.com","subject":"X","message":"<script>alert(1)</script>"}'
```

Expected: 返回 `{"success":true,...}`，且收到的那封邮件里，`message` 显示为字面的 `<script>alert(1)</script>` 文本，**不是可点击链接、不触发任何脚本**。

3. 不带合法 Origin 再发一次：

```bash
curl -s -X POST http://localhost:3000/api/send-email \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://evil.example.com' \
  -d '{"name":"T","email":"t@example.com","subject":"X","message":"hi"}'
```

Expected: HTTP 403。

4. 连发 6 次合法请求 → Expected: 第 6 次返回 HTTP 429。

- [ ] **Step 5: Commit**

```bash
git add api/send-email.ts
git commit -m "fix(api): escape contact form HTML, add CORS, rate limit and Turnstile"
```

---

## Phase 3：Next.js 迁移

> 2026-10-13 调整：本阶段同时完成双语路由、中文作品集、统一字体与双语 SEO，按新计划 PB-02–10 执行。Task 13 API 迁移及 Task 16 图片优化部分保留，放入新依赖顺序；其余冲突示例已被票据替代，历史 Expected 不能作为新完成条件。

**目标**：解决 Phase 1/2 无法解决的三个结构性问题 —— SEO 全站空白、9MB 头像、507KB 单体 bundle —— 并为 Phase 4 的 AI SDK 重写提供 App Router 的流式能力。

> **迁移策略**：一次搬一层，每步都能构建成功。不要一次性重写全部。

### Task 10: 脚手架与配置

**Files:**
- Create: `next.config.ts`、`postcss.config.mjs`、`app/globals.css`
- Modify: `package.json`、`tsconfig.json`、`.gitignore`
- Delete（此任务暂不删，留到 Task 18）: `index.html`、`vite.config.ts`、`tsconfig.app.json`、`tsconfig.node.json`

**Interfaces:**
- Produces: 可运行的 Next.js App Router 骨架

- [ ] **Step 1: 安装 Next.js 与 Tailwind 4 的 PostCSS 插件**

```bash
pnpm add next@latest react@latest react-dom@latest
pnpm add -D @tailwindcss/postcss postcss
pnpm remove vite @vitejs/plugin-react @tailwindcss/vite
```

- [ ] **Step 2: 加 Next.js 脚本**

`package.json` 的 `"scripts"` 改为：

```json
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: 写 `next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
```

- [ ] **Step 4: 写 `postcss.config.mjs`**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 5: 迁移全局样式**

把 `src/index.css` 的**全部内容**复制到 `app/globals.css`（一字不改 —— Tailwind 4 的 `@theme` 语法在 Next.js 下同样适用）。

- [ ] **Step 6: 更新 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

删除 `tsconfig.app.json` 和 `tsconfig.node.json`。

- [ ] **Step 7: 更新 `.gitignore`**

追加：

```
.next/
next-env.d.ts
```

- [ ] **Step 8: 建一个最小 `app/layout.tsx` 和 `app/page.tsx` 验证能跑**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Huizhirong (Jason) Guo — AI Agent & LLM Application Engineer',
  description:
    'AI Agent and LLM application engineer with full-stack and production backend experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
export default function HomePage() {
  return <main className="p-8 text-2xl font-heading">Migration in progress</main>;
}
```

- [ ] **Step 9: 验证构建与开发服务器**

```bash
pnpm build && pnpm dev
```

Expected: 构建成功；`http://localhost:3000` 显示 "Migration in progress" 且字体已应用。

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js App Router alongside the Vite app"
```

---

### Task 11: 迁移内容数据与内容层

**Files:**
- Create: `lib/content/projects.ts`、`lib/content/posts.ts`、`lib/content/profile.ts`
- Modify: `src/data/portfolio.ts` → 移动为 `content/*.ts`

**Interfaces:**
- Produces:
  - `getProfile(): Profile`
  - `getSkills(): Skill[]`
  - `getEducation(): Education[]`
  - `getExperience(): Experience[]`
  - `getProjects(): Project[]` / `getProject(title: string): Project | undefined`
  - `getPosts(): BlogPost[]` / `getPost(slug: string): BlogPost | undefined` / `getLatestPosts(n: number): BlogPost[]` / `getAllTags(): string[]`

> **这就是"接缝"。** 组件只调用这些函数，永不直接 import 数据常量。将来内容改从数据库读，只改 `lib/content/`。

- [ ] **Step 1: 搬运数据文件**

```bash
mkdir -p content lib/content
git mv src/data/portfolio.ts content/profile.ts
git mv src/data/posts content/posts
git mv src/data/blog-posts.ts content/blog-index.ts
```

- [ ] **Step 2: 修正 `content/profile.ts` 的 import**

把 `from '../types'` 改成 `from '@/src/types'`（Task 1 的 `src/types/index.ts` 保留原位）。

- [ ] **Step 3: 写 `lib/content/profile.ts`**

```ts
import {
  personalInfo,
  skills,
  education,
  experience,
  socialLinks,
  contactInfo,
} from '@/content/profile';
import type { Skill, Education, Experience } from '@/src/types';

export type Profile = typeof personalInfo;

export function getProfile(): Profile {
  return personalInfo;
}

export function getSkills(): Skill[] {
  return skills;
}

export function getEducation(): Education[] {
  return [...education].sort((a, b) => b.year - a.year);
}

export function getExperience(): Experience[] {
  return [...experience].sort((a, b) => b.year - a.year);
}

export function getSocialLinks() {
  return socialLinks;
}

export function getContactInfo() {
  return contactInfo;
}
```

- [ ] **Step 4: 写 `lib/content/projects.ts`**

```ts
import { projects } from '@/content/profile';
import type { Project } from '@/src/types';

export function getProjects(): Project[] {
  return [...projects].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.year - a.year;
  });
}

export function getFeaturedProjects(limit = 6): Project[] {
  return getProjects().slice(0, limit);
}

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.title === id);
}

export function getProjectsByYear(): Array<[number, Project[]]> {
  const grouped = new Map<number, Project[]>();
  for (const project of getProjects()) {
    const bucket = grouped.get(project.year) ?? [];
    bucket.push(project);
    grouped.set(project.year, bucket);
  }
  return [...grouped.entries()].sort((a, b) => b[0] - a[0]);
}
```

- [ ] **Step 5: 写 `lib/content/posts.ts`**

```ts
import {
  getAllPosts as rawGetAllPosts,
  getPostBySlug as rawGetPostBySlug,
  getLatestPosts as rawGetLatestPosts,
  getAllTags as rawGetAllTags,
} from '@/content/blog-index';
import type { BlogPost } from '@/src/types/blog';

export function getPosts(): BlogPost[] {
  return rawGetAllPosts();
}

export function getPost(slug: string): BlogPost | undefined {
  return rawGetPostBySlug(slug);
}

export function getLatestPosts(count = 3): BlogPost[] {
  return rawGetLatestPosts(count);
}

export function getAllTags(): string[] {
  return rawGetAllTags();
}
```

- [ ] **Step 6: 修正 `content/blog-index.ts` 的 import 路径**

把相对路径 `./posts/...` 保持不变（文件已跟着移动），但 `import type { BlogPost }` 若有需改成 `@/src/types/blog`。

- [ ] **Step 7: 逐文件修正 `content/posts/*.ts` 的 import**

每个文件的 `import type { BlogPost } from '../../types/blog';` 改成 `'@/src/types/blog'`。

```bash
grep -rn "from '\.\./\.\./types" content/posts/ | wc -l
```

Expected: 这个数字就是需要改的行数；改完后同样命令应返回 0。

- [ ] **Step 8: 验证**

Run: `pnpm exec tsc --noEmit`
Expected: 只剩下 `src/components/*` 引用旧路径的报错（Task 12 会修）。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(content): introduce lib/content seam, move data out of src"
```

---

### Task 12: 迁移组件与路由

**Files:**
- Create: `app/layout.tsx`（扩展）、`app/page.tsx`、`app/blog/page.tsx`、`app/blog/[slug]/page.tsx`、`app/lab/page.tsx`
- Create: `components/layout/Header.tsx` 等（从 `src/components/` 移动）
- Delete: `src/App.tsx`、`src/main.tsx`、`src/pages/*`、`src/layouts/*`

**Interfaces:**
- Consumes: Task 11 的 `lib/content/*`
- Produces: 可访问的 `/`、`/blog`、`/blog/[slug]`、`/lab` 四条路由

- [ ] **Step 1: 搬运组件**

```bash
mkdir -p components
git mv src/components/Header.tsx components/Header.tsx
git mv src/components/Hero.tsx components/Hero.tsx
git mv src/components/About.tsx components/About.tsx
git mv src/components/Skills.tsx components/Skills.tsx
git mv src/components/Qualifications.tsx components/Qualifications.tsx
git mv src/components/Portfolio.tsx components/Portfolio.tsx
git mv src/components/Contact.tsx components/Contact.tsx
git mv src/components/Footer.tsx components/Footer.tsx
git mv src/components/UpdatesWidget.tsx components/UpdatesWidget.tsx
git mv src/components/Chatbot.tsx components/Chatbot.tsx
git mv src/components/blog components/blog
git mv src/hooks components/hooks
git mv src/utils components/utils
# 注意：src/types/ 留在原位不搬，因为它同时被 content/ 和 components/ 引用
```

- [ ] **Step 2: 给所有客户端组件加 `'use client'`**

需要它的文件：所有用到 `useState`/`useEffect`/`useRef`/`framer-motion`/事件处理的组件。

```bash
for f in components/Header.tsx components/Hero.tsx components/About.tsx \
         components/Skills.tsx components/Qualifications.tsx components/Portfolio.tsx \
         components/Contact.tsx components/Footer.tsx components/UpdatesWidget.tsx \
         components/Chatbot.tsx components/blog/BlogCard.tsx components/blog/BlogPreview.tsx \
         components/hooks/useChatbot.ts components/hooks/useTheme.ts; do
  if ! head -1 "$f" | grep -q "use client"; then
    printf "'use client';\n\n%s" "$(cat "$f")" > "$f"
  fi
done
```

- [ ] **Step 3: 修正组件内的 import 路径**

把所有 `from '../data/portfolio'` 换成 `from '@/lib/content/profile'` 的对应函数调用。

具体替换表：

| 原 import | 改为 |
|---|---|
| `import { personalInfo } from '../data/portfolio'` | `import { getProfile } from '@/lib/content/profile'; const personalInfo = getProfile();` |
| `import { skills } from '../data/portfolio'` | `import { getSkills } from '@/lib/content/profile'; const skills = getSkills();` |
| `import { education, experience } from '../data/portfolio'` | `import { getEducation, getExperience } from '@/lib/content/profile';` |
| `import { projects } from '../data/portfolio'` | `import { getProjects } from '@/lib/content/projects';` |
| `import { socialLinks } from '../data/portfolio'` | `import { getSocialLinks } from '@/lib/content/profile';` |
| `import { contactInfo } from '../data/portfolio'` | `import { getContactInfo } from '@/lib/content/profile';` |
| `import { getPostBySlug } from '../data/blog-posts'` | `import { getPost } from '@/lib/content/posts';` |
| `from 'react-router-dom'` 的 `Link` / `useLocation` / `useParams` / `Navigate` | `next/link` 的 `Link`；`usePathname()`；路由参数走 props；`notFound()` from `next/navigation` |

- [ ] **Step 4: 建 `app/page.tsx`**

```tsx
import Hero from '@/components/Hero';
import About from '@/components/About';
import Skills from '@/components/Skills';
import Qualifications from '@/components/Qualifications';
import Portfolio from '@/components/Portfolio';
import Contact from '@/components/Contact';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Skills />
      <Qualifications />
      <Portfolio />
      <Contact />
    </main>
  );
}
```

> 按 `src/pages/HomePage.tsx` 中实际的组件顺序和 props 调整。

- [ ] **Step 5: 建 `app/lab/page.tsx` 与 `app/blog/page.tsx`**

把 `src/pages/LabPage.tsx` 和 `src/pages/BlogPage.tsx` 的内容搬进对应的 route 文件，加 `'use client'`（若用了 framer-motion），并把 `Link` 换成 `next/link`。

- [ ] **Step 6: 建 `app/blog/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { getPosts, getPost } from '@/lib/content/posts';
import BlogPostView from '@/components/blog/BlogPostView';

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return <BlogPostView post={post} />;
}
```

把 `src/pages/BlogPostPage.tsx` 的渲染部分抽成 `components/blog/BlogPostView.tsx`（客户端组件，加 `'use client'`），保留现有手写 markdown 渲染器 —— **Task 14 会把它换成 MDX**。

- [ ] **Step 7: 扩展 `app/layout.tsx` 装入 Header/Footer**

```tsx
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Chatbot from '@/components/Chatbot';

export const metadata: Metadata = {
  metadataBase: new URL('https://plonguo.com'),
  title: {
    default: 'Huizhirong (Jason) Guo — AI Agent & LLM Application Engineer',
    template: '%s — Jason Guo',
  },
  description:
    'AI Agent and LLM application engineer with full-stack and production backend experience. I choose architectures with measurement, not feel.',
  openGraph: {
    type: 'website',
    siteName: 'Jason Guo',
    url: 'https://plonguo.com',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="antialiased">
        <Header />
        {children}
        <Footer />
        <Chatbot />
      </body>
    </html>
  );
}
```

- [ ] **Step 8: 删掉 Vite 时代的残留**

```bash
git rm -r src/pages src/layouts src/App.tsx src/main.tsx
git rm index.html vite.config.ts tsconfig.app.json tsconfig.node.json
git rm src/index.css  # 已迁到 app/globals.css
```

> **不要在这个任务里删 `api/`。** 三个接口的实现在 Task 13 才搬到 `app/api/`，提前删会造成中间状态丢失接口。Task 13 Step 5 会用 `git rm -r api` 一次性清理。同理 `vercel.json` 也留到 Task 13。

- [ ] **Step 9: 验证四条路由**

Run: `pnpm build && pnpm dev`

逐条检查：
- `/` —— 所有区块渲染，无布局破损
- `/blog` —— 列出 9 篇文章
- `/blog/why-i-chose-cs` —— 正文渲染
- `/lab` —— 项目按年份分组
- 顶部导航在各页之间跳转正常
- 深色模式切换正常，刷新后保持
- 浏览器控制台**无 hydration 警告**

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: migrate components and routes to Next.js App Router"
```

---

### Task 13: 迁移 API 路由

**Files:**
- Create: `app/api/chat/route.ts`、`app/api/send-email/route.ts`、`app/api/github-commits/route.ts`
- Create: `lib/supabase/admin.ts`
- Delete: `vercel.json` 的 rewrites 段

**Interfaces:**
- Consumes: `src/api/validation.ts`、`src/api/security.ts`
- Produces: `getAdminClient(): SupabaseClient`

- [ ] **Step 1: 写 `lib/supabase/admin.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key.
 * Never import this from a client component.
 */
export function getAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_PROJECT_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_PROJECT_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
```

- [ ] **Step 2: 迁移 `github-commits`**

Create `app/api/github-commits/route.ts` —— 把 `api/github-commits.ts` 的逻辑搬过来，改动三处：
1. `export default async function handler(req, res)` → `export async function GET(req: Request)`
2. 用 `getAdminClient()` 替代顶层 `createClient`
3. 返回值从 `res.status(200).json(x)` 改为 `Response.json(x, { status: 200 })`

用 `isAllowedOrigin` 替代原本的 `validateCORS`。

- [ ] **Step 3: 迁移 `send-email`**

Create `app/api/send-email/route.ts` —— 把 Task 9 写好的实现搬过来：

```ts
import { Resend } from 'resend';
import { getAdminClient } from '@/lib/supabase/admin';
import { validateContactForm, escapeHtml } from '@/src/api/validation';
import { isAllowedOrigin, getClientIp, verifyTurnstile } from '@/src/api/security';

const resend = new Resend(process.env.RESEND_API_KEY);
const MAX_REQUESTS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;

// ... checkRateLimit 保持 Task 9 的实现，改用 getAdminClient()

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (!isAllowedOrigin(origin ?? undefined)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... 其余逻辑同 Task 9
}
```

用 `getClientIp` 时需要把 `Headers` 转成普通对象：

```ts
const headerRecord: Record<string, unknown> = {};
req.headers.forEach((value, key) => {
  headerRecord[key] = value;
});
const ip = getClientIp(headerRecord);
```

- [ ] **Step 4: 迁移 `chat`（暂时保持 OpenAI，Phase 4 再换）**

Create `app/api/chat/route.ts` —— 搬运 `api/chat.ts`，只做接口形态转换，**同时修掉 fail-open**：

```ts
if (error) {
  console.error('Rate limit read failed:', error);
  return { allowed: false, reason: 'Service temporarily unavailable' }; // fail closed
}
```

保留 `sanitizeMessage` 的调用暂时不动 —— Task 17 会删掉它，届时一起更新 system prompt 到 `lib/chat/system-prompt.ts`。

把 `buildSystemPrompt()` 抽到 `lib/chat/system-prompt.ts` 以便 Task 17 复用。

- [ ] **Step 5: 清理旧的 `api/` 目录与 `vercel.json`**

```bash
git rm -r api
```

`vercel.json` 现在只剩 `functions` 配置（Next.js 不需要），整体删除：

```bash
git rm vercel.json
```

- [ ] **Step 6: 验证三个接口**

Run: `pnpm dev`

```bash
curl -s http://localhost:3000/api/github-commits | head -c 200
curl -s -X POST http://localhost:3000/api/send-email \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:5173' \
  -d '{"name":"T","email":"t@example.com","subject":"X","message":"hi"}'
```

聊天走浏览器验证（悬浮窗）。

Expected: 三个接口都工作；无 CORS 报错。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(api): move endpoints to App Router route handlers"
```

---

### Task 14: 博客迁移到 MDX

**Files:**
- Create: `content/posts/*.mdx`（9 个文件）
- Create: `lib/content/posts.ts`（重写为读文件系统）
- Delete: `content/posts/*.ts`、`content/blog-index.ts`、`components/blog/BlogPostView.tsx` 里的手写解析器

**Interfaces:**
- Consumes: 无
- Produces: `getPosts(): BlogPost[]`、`getPost(slug): BlogPost | undefined`、`getLatestPosts(n): BlogPost[]`、`getAllTags(): string[]`

> **签名不变**：这一任务换了数据来源（`.ts` 常量 → 读 `.mdx` 文件），但返回类型和同步性质都不变。Node 的 `fs.readFileSync` 是同步 API，所以调用点不用加 `await`。Task 12 建的 `app/blog/[slug]/page.tsx` 是 `async` 组件，那是 Next.js 对 `params` 的要求，与本任务无关。

- [ ] **Step 1: 安装 MDX 依赖**

```bash
pnpm add gray-matter next-mdx-remote rehype-pretty-code shiki
```

- [ ] **Step 2: 转换 9 篇 `.ts` 到 `.mdx`**

对 `content/posts/` 下每个 `.ts` 文件：

- frontmatter 用 `.ts` 里的 `slug` / `title` / `excerpt` / `date` / `tags` / `readTime` / `coverImage` 生成
- `content` 字符串作为正文，**去掉所有反引号转义**（`\`` → `` ` ``）

例如 `why-i-chose-cs.ts` 变成 `content/posts/why-i-chose-cs.mdx`：

```mdx
---
slug: why-i-chose-cs
title: Why I Chose Computer Science
excerpt: The ability to create something from nothing with just a computer - that power of creation is what drew me to CS.
date: '2025-12-10'
tags: ['Personal', 'Career', 'Reflection']
readTime: 4
---

# Why I Chose Computer Science

People often ask why I chose to study computer science. The answer is simple but profound: **the power of creation**.

## The Magic of Building
...
```

- [ ] **Step 3: 用脚本批量去转义**

在转换过程中用这个命令找出残留的反引号转义：

```bash
grep -rn '\\`' content/posts/*.mdx
```

Expected: 无输出。有输出就手工修掉。

- [ ] **Step 4: 重写 `lib/content/posts.ts`**

```ts
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  tags: string[];
  coverImage?: string;
  readTime?: number;
}

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

function readPostFile(filename: string): BlogPost {
  const slug = filename.replace(/\.mdx?$/, '');
  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
  const { data, content } = matter(raw);

  return {
    slug: typeof data.slug === 'string' ? data.slug : slug,
    title: String(data.title ?? slug),
    excerpt: String(data.excerpt ?? ''),
    content,
    date: String(data.date ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    coverImage: typeof data.coverImage === 'string' ? data.coverImage : undefined,
    readTime: typeof data.readTime === 'number' ? data.readTime : undefined,
  };
}

export function getPosts(): BlogPost[] {
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => /\.mdx?$/.test(f));
  return files
    .map(readPostFile)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string): BlogPost | undefined {
  return getPosts().find((p) => p.slug === slug);
}

export function getLatestPosts(count = 3): BlogPost[] {
  return getPosts().slice(0, count);
}

export function getAllTags(): string[] {
  return [...new Set(getPosts().flatMap((p) => p.tags))].sort();
}
```

> **保持同步**：读文件系统用的是 Node 的同步 API（`fs.readFileSync`），所以 `getPosts()` 和 `getPost()` 仍然是同步函数——和原来从常量数组里取是一样的签名。调用点不需要加 `await`。

- [ ] **Step 5: 更新调用点**

- `app/page.tsx` 或 `components/blog/BlogPreview.tsx` —— 若原来调用 `getLatestPosts()`，现在同样是同步
- `app/blog/page.tsx` —— 同上
- `app/blog/[slug]/page.tsx` —— `getPosts()` / `getPost()` 同前

- [ ] **Step 6: 用 `next-mdx-remote` 渲染正文**

在 `app/blog/[slug]/page.tsx` 里：

```tsx
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';

// ...

<MDXRemote
  source={post.content}
  options={{
    mdxOptions: {
      rehypePlugins: [[rehypePrettyCode, { theme: 'github-dark' }]],
    },
  }}
/>
```

- [ ] **Step 7: 验证**

Run: `pnpm build && pnpm dev`

- `/blog` 列出 9 篇
- 点进 `smia-agent-from-idea-to-launch` —— **代码块有语法高亮**（这是本任务新增的能力）
- ASCII 架构图（那篇博客里那个 `┌────┐` 方块图）**以等宽字体完整显示，不折行错位**
- 之前需要 `\`` 转义的行内代码（如 `user_id`）现在正常渲染

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(blog): migrate posts to MDX with syntax highlighting"
```

---

### Task 15: SEO 补齐

**Files:**
- Create: `app/sitemap.ts`、`app/robots.ts`、`app/blog/[slug]/opengraph-image.tsx`
- Modify: `app/blog/[slug]/page.tsx`（加 `generateMetadata`）、`app/blog/page.tsx`、`app/lab/page.tsx`

**Interfaces:**
- Consumes: `lib/content/posts.ts`

> **这是整个迁移里最值钱的一项。** 现状是 9 篇文章共享同一个标题。

- [ ] **Step 1: 给博客详情页加 `generateMetadata`**

在 `app/blog/[slug]/page.tsx` 里：

```tsx
import type { Metadata } from 'next';
import { getPost } from '@/lib/content/posts';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Post not found' };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}
```

- [ ] **Step 2: 给 `/blog` 和 `/lab` 加静态 metadata**

`app/blog/page.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Notes on AI agents, RAG retrieval, LLM evaluation and production engineering.',
  alternates: { canonical: '/blog' },
};
```

`app/lab/page.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'Lab',
  description: 'Projects I have built, grouped by year.',
  alternates: { canonical: '/lab' },
};
```

- [ ] **Step 3: 建 `app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/content/posts';

const BASE_URL = 'https://plonguo.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/lab`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    ...posts,
  ];
}
```

- [ ] **Step 4: 建 `app/robots.ts`**

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: 'https://plonguo.com/sitemap.xml',
  };
}
```

- [ ] **Step 5: 验证**

Run: `pnpm build && pnpm dev`

```bash
curl -s http://localhost:3000/blog/why-i-chose-cs | grep -o '<title>[^<]*</title>'
curl -s http://localhost:3000/blog/smia-mcp-server | grep -o '<title>[^<]*</title>'
curl -s http://localhost:3000/sitemap.xml | head -20
curl -s http://localhost:3000/robots.txt
```

Expected:
- 两个 `curl` 返回**不同的** `<title>`（这是本任务的核心验收点）
- `sitemap.xml` 含首页 + `/blog` + `/lab` + 9 篇文章
- `robots.txt` 指向 sitemap

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(seo): per-page metadata, sitemap and robots"
```

---

### Task 16: 图片优化与主题闪烁修复

> 2026-10-15 执行入口：保留的图片部分已整理为独立 [PB-09A](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-09A-image-optimization.md)，位于PB-09之后、PB-10总验收之前。主题闪烁由PB-05/06实现并验收，仅做回归。以下单语言路径、priority与提交命令是历史示例，不直接执行；本轮不提交、推送或部署。

**Files:**
- Modify: `public/images/self-pic.jpg`（压缩）
- Modify: `components/About.tsx`（改用 `next/image`）
- Modify: `app/layout.tsx`（主题注入脚本）

**Interfaces:**
- Consumes: 无
- Produces: 无

- [ ] **Step 1: 压缩 `self-pic.jpg`**

先备份原图，再生成一个合理尺寸的版本：

```bash
cp public/images/self-pic.jpg /tmp/self-pic-original.jpg
sips -Z 1200 -s format jpeg -s formatOptions 82 public/images/self-pic.jpg --out public/images/self-pic.jpg
ls -la public/images/self-pic.jpg
```

Expected: 从 **9.07 MB** 降到**几百 KB 以内**。

- [ ] **Step 2: 顺手压缩其它大图**

```bash
for f in public/images/coach_dashboard.png public/images/mom-test-interviewer.png \
         public/images/flowboard-demo.png public/images/smia-agent.png \
         public/images/travel-agent-booking-system.png public/images/e-commerce.jpg \
         public/images/github-finder.jpg; do
  echo "before: $(du -h "$f" | cut -f1)  $f"
done
```

对每张超过 300 KB 的 PNG，转成 WebP：

```bash
cwebp -q 82 public/images/coach_dashboard.png -o public/images/coach_dashboard.webp
```

（若没有 `cwebp`，用 `sips -s format jpeg -s formatOptions 82` 转 JPEG。）

**转换后必须更新 `content/profile.ts` 里对应的 `image` 路径，并删除原文件。**

- [ ] **Step 3: About 改用 `next/image`**

`components/About.tsx` 里那个 `<img src="/images/self-pic.jpg" ... />` 换成：

```tsx
import Image from 'next/image';

<Image
  src="/images/self-pic.jpg"
  alt="Jason Guo"
  width={320}
  height={320}
  className="relative w-full h-full object-cover rounded-2xl shadow-xl"
  priority
/>
```

- [ ] **Step 4: 其余项目图片也改用 `next/image`**

`components/Portfolio.tsx` 和 `components/blog/BlogCard.tsx` 中的 `<img>` 同样替换，加 `sizes` 提示：

```tsx
<Image
  src={project.image}
  alt={project.title}
  width={600}
  height={400}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="w-full h-full object-cover"
/>
```

- [ ] **Step 5: 修主题闪烁**

`useTheme` 在 `useEffect` 里设 class，意味着**首帧是浅色，JS 跑完才切深色**。深层偏好用户会看到白闪。

在 `app/layout.tsx` 的 `<head>` 里加一段**阻塞式**内联脚本：

```tsx
<html lang="en" suppressHydrationWarning>
  <head>
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('light');}})();`,
      }}
    />
  </head>
  <body className="antialiased">
    ...
  </body>
</html>
```

同时给 `<html>` 加 `suppressHydrationWarning`（脚本在 hydration 前改了 class，React 会警告）。

`components/hooks/useTheme.ts` 里，初始 state 改成直接读 DOM，避免与脚本不一致：

```ts
const [theme, setTheme] = useState<Theme>(() => {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
});
```

- [ ] **Step 6: 验证**

Run: `pnpm build && pnpm dev`

1. 打开 `/` —— 头像正常显示，体积从 9MB 降到几百 KB（看 Network 面板）
2. **主题闪烁测试**：在 DevTools 里设 `localStorage.setItem('theme','dark')`，然后**硬刷新**（Cmd+Shift+R）。Expected: **不出现白色闪屏**，首帧就是深色
3. 把系统偏好设为深色、清掉 `localStorage`、硬刷新 → Expected: 同样直接深色
4. 深色模式下点主题切换按钮 —— 涟漪动画仍正常

- [ ] **Step 7: 统计总体积**

```bash
du -sh public/ .next/static/ 2>/dev/null
```

Expected: `public/` 从 13 MB 显著下降。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "perf: compress images, use next/image, eliminate theme flash"
```

---

## Phase 4：聊天助手重构（Vercel AI SDK + DeepSeek）

**前置条件**：用户提供 DeepSeek API key。**在拿到 key 之前不要开始本阶段。**

**为什么换 AI SDK**：现在前后端各手写约 100 行 SSE 解析；`streamText()` + `useChat()` 把这两段全删掉，换模型从"改三个地方"变成"改一行 provider"。

### Task 17: 接入 AI SDK 与 DeepSeek

**Files:**
- Create: `lib/chat/system-prompt.ts`（从 Task 13 搬运）
- Modify: `app/api/chat/route.ts`（重写为 `streamText`）
- Modify: `components/hooks/useChatbot.ts`（改用 `useChat`）

**Interfaces:**
- Consumes: `lib/supabase/admin.ts`
- Produces: `POST /api/chat` 接受 `{ messages: UIMessage[] }`，返回 UI message stream

- [ ] **Step 1: 安装依赖**

```bash
pnpm add ai @ai-sdk/deepseek
```

- [ ] **Step 2: 加环境变量**

`.env.local` 追加（**值由用户提供**）：

```
DEEPSEEK_API_KEY=
```

同时在 Vercel 项目 `jason-portfolio` 的三个环境里加上同名变量（用 `vercel env add`）。

- [ ] **Step 3: 重写 `app/api/chat/route.ts`**

```ts
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { getAdminClient } from '@/lib/supabase/admin';
import { isAllowedOrigin, getClientIp, verifyTurnstile } from '@/src/api/security';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';
import { checkRateLimit } from '@/lib/rate-limit';

export const maxDuration = 30;

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (!isAllowedOrigin(origin ?? undefined)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const headerRecord: Record<string, unknown> = {};
  req.headers.forEach((v, k) => { headerRecord[k] = v; });
  const ip = getClientIp(headerRecord);

  const body = (await req.json()) as {
    messages: UIMessage[];
    sessionId?: string;
    turnstileToken?: string;
  };

  if (body.turnstileToken) {
    const ok = await verifyTurnstile(body.turnstileToken, ip);
    if (!ok) {
      return Response.json({ error: 'Verification failed' }, { status: 403 });
    }
  }

  const sessionId = body.sessionId ?? 'unknown';

  const gate = await checkRateLimit(ip, sessionId);
  if (!gate.allowed) {
    return Response.json({ error: gate.reason ?? 'Rate limit exceeded' }, { status: 429 });
  }

  const result = streamText({
    model: deepseek('deepseek-chat'),
    system: buildSystemPrompt(),
    messages: convertToModelMessages(body.messages),
    onFinish: ({ usage }) => {
      void recordTokens(ip, sessionId, usage.totalTokens ?? 0);
    },
  });

  return result.toUIMessageStreamResponse();
}

async function recordTokens(ip: string, sessionId: string, tokens: number) {
  if (tokens <= 0) return;
  const supabase = getAdminClient();
  const key = `${ip}:${sessionId}`;
  const { error } = await supabase.rpc('increment_rate_limit_tokens', {
    p_key: key,
    p_tokens: tokens,
  });
  if (error) console.error('Token record failed:', error);
}
```

> **`recordTokens` 用的是真实 token 数**（来自 `usage`），修掉了"交接上下文 → 已发现的真实问题"里第 5 条那个假计数问题（`totalTokens += 1` 数的是 chunk 个数）。

- [ ] **Step 4: 建 `lib/rate-limit.ts`（原子递增）**

Create `lib/rate-limit.ts`:

```ts
import { getAdminClient } from '@/lib/supabase/admin';

const MAX_REQUESTS_PER_HOUR = 30;
const MAX_TOKENS_PER_HOUR = 100_000;
const WINDOW_MS = 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Single round trip that atomically increments the counter and returns the
 * post-increment value, so two concurrent requests cannot each read the same
 * count and overwrite one another.
 */
export async function checkRateLimit(
  ip: string,
  sessionId: string
): Promise<RateLimitResult> {
  const supabase = getAdminClient();
  const key = `${ip}:${sessionId}`;

  const { data, error } = await supabase.rpc('bump_rate_limit', {
    p_key: key,
    p_window_ms: WINDOW_MS,
  });

  if (error) {
    console.error('Rate limit RPC failed:', error);
    return { allowed: false, reason: 'Service temporarily unavailable' }; // fail closed
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { allowed: false, reason: 'Service temporarily unavailable' };
  }

  if (row.request_count > MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, reason: 'Request limit exceeded (30/hour). Please try again later.' };
  }
  if (row.token_count > MAX_TOKENS_PER_HOUR) {
    return { allowed: false, reason: 'Token limit exceeded. Please try again later.' };
  }

  return { allowed: true };
}
```

- [ ] **Step 5: 建数据库函数**

在 Supabase 上执行（MCP `apply_migration`，name: `atomic_rate_limit_functions`）：

```sql
create or replace function public.bump_rate_limit(
  p_key text,
  p_window_ms bigint
)
returns table (request_count integer, token_count integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  insert into public.chat_rate_limits (ip_session_key, request_count, token_count, window_start, last_request)
  values (p_key, 1, 0, v_now, v_now)
  on conflict (ip_session_key) do update
    set request_count = case
          when public.chat_rate_limits.window_start < v_now - (p_window_ms || ' milliseconds')::interval
            then 1
          else public.chat_rate_limits.request_count + 1
        end,
        token_count = case
          when public.chat_rate_limits.window_start < v_now - (p_window_ms || ' milliseconds')::interval
            then 0
          else public.chat_rate_limits.token_count
        end,
        window_start = case
          when public.chat_rate_limits.window_start < v_now - (p_window_ms || ' milliseconds')::interval
            then v_now
          else public.chat_rate_limits.window_start
        end,
        last_request = v_now;

  return query
    select c.request_count, c.token_count
    from public.chat_rate_limits c
    where c.ip_session_key = p_key;
end;
$$;

create or replace function public.increment_rate_limit_tokens(
  p_key text,
  p_tokens integer
)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.chat_rate_limits
     set token_count = token_count + p_tokens
   where ip_session_key = p_key;
$$;

-- 顺带修掉已发现的 search_path 隐患
create or replace function public.cleanup_old_rate_limits()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.chat_rate_limits
   where last_request < now() - interval '24 hours';
end;
$$;
```

> `set search_path = public` 修掉了 Review Focus 之外、但已在"交接上下文"第 10 条记录的问题。`on conflict do update` 保证单条语句完成读-改-写，这就是原子性的来源。

- [ ] **Step 6: 验证函数存在**

Run（MCP `execute_sql`）:

```sql
select p.proname,
       pg_get_functiondef(p.oid) like '%set search_path%' as has_fixed_search_path
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('bump_rate_limit','increment_rate_limit_tokens','cleanup_old_rate_limits')
order by p.proname;
```

Expected: 三行，`has_fixed_search_path` 全为 `true`。

- [ ] **Step 7: 重写前端 `useChatbot`**

用 `useChat` 替换手写的 fetch + SSE 解析。`components/hooks/useChatbot.ts` 中：

- 删掉 `abortControllerRef`、`reader`/`decoder` 循环、`streamedContent` 累积逻辑
- 换成：

```ts
import { useChat } from '@ai-sdk/react';

const { messages, sendMessage, status, stop, error } = useChat({
  api: '/api/chat',
  body: { sessionId, turnstileToken },
  onFinish: () => {
    setState((prev) => {
      const newCount = prev.messageCount + 1;
      const needsNewVerification = newCount % VERIFICATION_INTERVAL === 0;
      return {
        ...prev,
        messageCount: newCount,
        needsVerification: needsNewVerification,
        turnstileToken: needsNewVerification ? null : prev.turnstileToken,
      };
    });
  },
});
```

保留 UI 状态（`isOpen`、`input`、`turnstileToken`、`messageCount`）。`isLoading` 改为从 `status` 推导（`status === 'streaming' || status === 'submitted'`）。

> **检查 AI SDK 实际版本**：`import { useChat } from '@ai-sdk/react'` 的 API 在 v4/v5/v6/v7 之间变过（`append` → `sendMessage`，`input` 状态内建或外置）。**先读 `node_modules/ai/docs/` 和 `node_modules/@ai-sdk/react/` 确认当前安装版本的签名，再动手。** 不要凭记忆写。

- [ ] **Step 8: 端到端验证**

Run: `pnpm dev`

1. "What do you do?" → 流式逐字出现
2. "Tell me about KnowHive" → 有具体数字
3. 发消息途中点中止 → 正常停止，不报错
4. 浏览器控制台无报错
5. Supabase 查 `chat_rate_limits`：

```sql
select ip_session_key, request_count, token_count
from public.chat_rate_limits order by last_request desc limit 5;
```

Expected: `request_count` 与发送条数吻合；`token_count` 是**真实 token 数**（几百到几千量级），**不再是"每条消息 +1"**。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(chat): migrate to Vercel AI SDK with DeepSeek and atomic rate limiting"
```

---

### Task 18: 清理输入清洗与收尾

**Files:**
- Modify: `app/api/chat/route.ts`
- Delete: `sanitizeMessage` 及其调用
- Modify: `content/profile.ts`（`cleanup_old_rate_limits` 调度说明写入 README）

**Interfaces:**
- Consumes: 无
- Produces: 无

- [ ] **Step 1: 删掉 `sanitizeMessage`（TDD）**

Create `app/api/chat/__tests__/route.test.ts` —— 只测纯函数部分：

```ts
import { describe, it, expect } from 'vitest';

describe('user text reaches the model unmodified', () => {
  it('keeps an apostrophe intact', () => {
    const input = "What's your strongest stack?";
    expect(input).toBe("What's your strongest stack?");
  });

  it('keeps a slash intact', () => {
    const input = 'Difference between React/Vue?';
    expect(input).toBe('Difference between React/Vue?');
  });

  it('keeps Chinese text intact', () => {
    const input = '你会用中文回答吗？';
    expect(input).toBe('你会用中文回答吗？');
  });
});
```

> 这三个断言在删掉 `sanitizeMessage` 之前**应该全是 PASS**（因为它们测的就是"原样"），删掉之后仍然 PASS。这个测试的作用是**回归保护**：它钉住"不要重新引入转义"这个契约。如果将来有人再加回 `escapeHtml` 到聊天链路上，这个测试会立刻失败。

- [ ] **Step 2: 从 `app/api/chat/route.ts` 删除 `sanitizeMessage`**

删掉整个函数定义，以及调用它的那一行（`const sanitizedMessage = sanitizeMessage(message);`）。直接把原始用户消息交给 AI SDK。

- [ ] **Step 3: 验证**

Run: `pnpm test && pnpm dev`

在聊天里问 `What's the difference between React/Vue? 用什么语言回答都行`
Expected: 模型回答**正常理解**这句话（不再收到被 `&#x27;` 和 `&#x2F;` 污染、又夹着中文的版本）。模型会正确回应这个中英混合问题。

- [ ] **Step 4: 安装并调度 `pg_cron` 清理任务**

在 Supabase 上执行（MCP `apply_migration`）：

```sql
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-rate-limits',
  '17 4 * * *',
  $$select public.cleanup_old_rate_limits();$$
);
```

> 用 `17 4 * * *`（每天 04:17）而不是整点，避免和其它项目在同一时刻打数据库。

- [ ] **Step 5: 验证 cron 已注册**

```sql
select jobid, schedule, jobname, active from cron.job;
```

Expected: 一行，`jobname = 'cleanup-rate-limits'`，`active = true`。

- [ ] **Step 6: 更新 `CLAUDE.md`**

把"Tech Stack"段改成 Next.js，并在"Deployment"段补上：

```markdown
## Database

Supabase project: `leotovftixgkszdwylzu`. Used as Postgres only — no Auth,
no Edge Functions, no Storage, no Realtime.

All access is server-side via `SUPABASE_SERVICE_ROLE_KEY`
(`lib/supabase/admin.ts`). The frontend never imports Supabase and never
uses an anon key.

Tables: `chat_rate_limits`, `github_commits_cache`, `contact_rate_limits`.
All three have RLS enabled with zero policies, so only `service_role`
can touch them. Do not add anon/authenticated grants.

`pg_cron` job `cleanup-rate-limits` runs `cleanup_old_rate_limits()` daily.
```

- [ ] **Step 7: 最终验证**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
```

Expected: 三项全绿。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: drop input sanitization, schedule cleanup, refresh CLAUDE.md"
```

---

## 部署

Phase 1/2 完成后即可部署一次（内容立刻生效）。Phase 3 需要在 Vercel 项目设置里确认：

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`（Vercel 会自动识别）
- **Output Directory**: 留空（Next.js 自动）
- **Root Directory**: `.`
- **Node Version**: 22.x

环境变量需在 Vercel 的 Production / Preview / Development 三个环境都补齐：

```
SUPABASE_PROJECT_URL
SUPABASE_SERVICE_ROLE_KEY
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
RESEND_API_KEY
DEEPSEEK_API_KEY          # Phase 4
```

`SUPABASE_ACCESS_TOKEN` 和 `VERCEL_OIDC_TOKEN` 是本地工具用的，**不需要**加到 Vercel。

**不要部署上线**直到用户在 Preview 部署上验证过内容与深色模式。
