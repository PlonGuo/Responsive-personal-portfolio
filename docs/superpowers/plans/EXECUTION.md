# 执行协议（每个新 session 开工前读这个）

## 当前发布状态（2026-10-15，覆盖下方历史状态）

用户明确“都通过”，并授权提交、推送迁移分支、配置 Vercel、Preview 验证及 Production 构建发布。PB-01–10 和 DeepSeek→OpenAI 追加验收通过，Phase 3 收尾；Phase 4 未开始。TUN 恢复后复验：真实聊天200且完整DONE；无效验证码403；GitHub fresh200后缓存命中200；受控DeepSeek503后真实OpenAI200非空回复。此前网络失败记录保留为历史，不再是当前阻塞。发布流程为迁移分支Preview验证、main的Production重建；部署状态以Vercel和发布交付为准。

配套计划：`2026-10-09-portfolio-content-and-nextjs-migration.md`

## 当前票据状态（2026-10-15，优先于下方历史执行模板）

- **逐票审核规则（用户最新指令）：** 每次只执行一个 ticket，完成其实现、验证和结果汇报后立即停止，等待用户明确审核通过并同意继续，才能开始下一个。不得预先编码后续票据，也不得把前置 Task 当作自动继续的例外；前置工作如需单独执行，先明确本次执行范围。审核修改仍归当前 ticket，修正后再次等待审核。
- **当前审核门：** PB-04A 已获用户审核通过。PB-05 及审核回修已完成，本轮逐项人工验收均获用户确认通过，PB-06（含主题脚本与 Hero 审核回修）已获用户于2026-10-15审核通过，PB-07及紧凑入口回修均获用户审核通过；PB-08核心字体/排版及warning回修均获用户审核通过；PB-09已获用户审核通过；PB-09A图片优化已获用户审核通过；PB-10清理与自动验收通过、整体尚未完成，AC-13当前真实接口因Supabase连接重置未通过。历史真实Next邮件发送/收件已确认；本轮GitHub fresh200已验证，缓存写入及聊天/邮件成功路径受网络阻塞，真实验证码重放仍未验证；用户本轮已确认中文事实及两份PDF内容/语言准确。

- 先阅读[Active 与双语 spec](../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)和[实施计划入口](2026-10-13-portfolio-bilingual-and-active-badge.md)。
- 用户已授权逐票实现；PB-01–04 已实现并完成技术验收，PB-04A 已获用户审核通过，PB-05 本轮逐项人工审核通过。PB-05 原完整33项浏览器回归、回修后的120 unit与新增4项专项浏览器验证均有记录；构建/typecheck/lint通过。PB-06含审核回修新增22 unit、19项生产浏览器用例；全套142 unit/56生产浏览器、另2项开发模式回归、构建/typecheck/lint通过，用户已确认PB-06及回修审核通过。无 Navigation API 的旧浏览器保留源页并提示失败，这项兼容边界仍保留。PB-07新增29 unit/9项浏览器（含紧凑入口回修）；全套171 unit/65 production浏览器、另6项dev专项、构建/typecheck/lint通过，核心及入口回修已审核通过。PB-08新增9 unit/18项字体排版浏览器；全套180 unit/83 production浏览器、另20项localhost dev专项、构建/typecheck/lint通过。两语冷缓存字体各181024bytes（176.8KiB），预算512000bytes；1byte负例非零退出。PB-08核心审核通过；warning回修后全量180 unit/86 production浏览器及5项dev专项、构建/typecheck/lint通过，用户已确认回修通过。菜单focus顺序及favicon404已修，Cloudflare iframe两条warning保留第三方边界，字体预加载在新页面与用户强刷后未再现。PB-09新增23 unit/8项SEO浏览器；全套203 unit/94 production浏览器通过，另dev与独立Preview各8项专项通过，Production/Preview构建通过并恢复Production。初始HTML、15个sitemap地址、9张OG图、索引规则已验证并获用户审核通过。PB-09A图片优化新增2 unit/8图片浏览器用例，最终205 unit/102 Production浏览器通过，构建/typecheck/lint/内容校验通过，用户已审核通过。PB-10清理与自动验收209 unit/108 Production浏览器通过（含IME回修）；当前Supabase网络失败使AC-13未通过，整体尚未关闭。新增叶子页面须自行枚举静态语言（PB-07 bottom-up Ruling）。详见 [progress.md](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/progress.md)。
- 当前分支 nextjs-migration；保留原工作区修改。已执行构建、单元与浏览器测试；不自动提交、推送或部署。暂停时更新进度，下次必须先读记录，不重复已完成工作。
- PB-01 加入 Phase 1；原 Phase 2 保留；Phase 3 的冲突单语言步骤由 PB-02–10 替代，原 Task 13 已由 PB-04A 完成并审核通过；Task 16 图片部分已由 PB-09A 完成并审核通过，不重复执行。顺序详见实施计划，不直接复制历史模板。
- 保留已有未提交和已暂存改动。任何后续提交都仅暂存当前任务的明确文件，不使用旧示例中的 `git add -A`；没有用户指令或已授权实施工作流时不自动提交、推送或部署。

---

## 一、历史执行模板（已由新实施计划及票据入口替代）

**跑 Phase 1 + 2：**

```
读 docs/superpowers/plans/2026-10-09-portfolio-content-and-nextjs-migration.md
和 docs/superpowers/plans/EXECUTION.md。

执行 Phase 1（Task 1-5）和 Phase 2（Task 6-9）。你是主 agent，自己写代码，
不要派 subagent——这两个阶段的 task 强耦合，需要连续性。

每个 task 做完跑它自己的验证步骤，通过了就 commit。Task 4、5 的视觉/交互
验证做完后停下来告诉我结果，我人要看着确认，不要自己判断"看起来没问题"。

遇到计划里标注为"可自行取舍"或"需要现场核对"的地方，停下来问我，
不要静默选一个继续。

Phase 2 结束时部署一次，然后停下。
```

**跑 Phase 3：**

```
读 docs/superpowers/plans/2026-10-09-portfolio-content-and-nextjs-migration.md
和 docs/superpowers/plans/EXECUTION.md。

执行 Phase 3（Task 10-16）。这次每个 task 派一个 subagent 实现，
完成后派另一个 subagent 独立验收。你是主 agent，只负责：
1. 按顺序派发
2. 把「当前 task 段落 + 上一个 task 的实际产出」传给 subagent（不要让它读整个计划）
3. 每个 task 完成后自己看真实 git diff，不要只读 subagent 的汇报

Task 12、16 的验证需要人眼看，做完停下来告诉我。

开头先在分支上开工：git checkout -b nextjs-migration
```

**跑 Phase 4（必须先拿到 DeepSeek key）：**

```
读 docs/superpowers/plans/2026-10-09-portfolio-content-and-nextjs-migration.md
和 docs/superpowers/plans/EXECUTION.md。

执行 Phase 4（Task 17-18）。DeepSeek API key 是：<粘在这里>

你是主 agent，自己写。Task 17 Step 7 换 useChat 之前，
先读 node_modules/ai/docs/ 和 node_modules/@ai-sdk/react/ 确认当前安装版本的
API 签名，不要凭记忆写——v4 到 v7 之间 append/sendMessage 变过。

Task 17 Step 5 的 SQL 我没有在真实 Postgres 上跑过，
执行时如果报错，停下来告诉我，不要自己改 SQL 绕过。
```

---

## 二、Phase 与执行方式的对应

| Phase | Task | 谁做 | 为什么 |
|---|---|---|---|
| 1 内容更新 | 1-5 | **主 agent 串行** | 类型→数据→组件→prompt 是一条接力链，subagent 之间看不见彼此的实际产出 |
| 2 联系表单加固 | 6-9 | **主 agent 串行** | TDD，有明确 Red/Green 信号；且是安全修复，要一次做对 |
| 3 Next.js 迁移 | 10-16 | **一 task 一 subagent + 独立验收** | 低耦合、每条路由可独立验证、错了是整站级别 |
| 4 聊天重构 | 17-18 | **主 agent 串行** | API 签名要现场核对，subagent 容易凭记忆写错 |

**为什么分界线在 Phase 3**：Phase 1/2 的任务互相依赖上一步**实际**做成了什么；
Phase 3 的任务各自有明确的 Expected 断言（标题不同、图片变小、无 hydration 警告），
适合交给没有上下文包袱的 reviewer 查——因为写代码的 agent 会倾向于相信自己写对了。

---

## 三、派 subagent 的硬性规则

1. **不要把整个计划塞给它。** 计划 3100+ 行，18 个 subagent 各读一遍是巨大浪费，
   且绝大部分内容与它无关。只传：
   - 「Global Constraints」那一节（短，且每个 task 都需要）
   - 当前 task 的完整段落
   - 上一个 task 的实际产出（接口签名、实际文件路径）

2. **验收 agent 必须是另外一个。** 同一个 agent 检查自己的输出没有意义。

3. **主 agent 要看真实 diff。** 每个 task 完成后跑 `git show HEAD --stat` 和
   关键文件的 `git diff`，不要只读 subagent 的文字汇报。

4. **收尾要 branch 级 review。** Phase 3 全部做完后，派一个 agent 通读整个分支，
   而不只是逐个 task 检查。

---

## 四、必须回到人眼的验证点

这些是我**故意**留给你、而不是留给 agent 的。agent 会主动说"看起来正常"，
但这个判断不可靠。

| 位置 | 要看的 |
|---|---|
| Task 4 Step 7 | 浅色 + 深色两种模式下，技能分组的对比度、项目卡片布局、打字机有无跳动 |
| Task 5 Step 2 | 聊天助手实际回答是否用新定位（问 "What do you do?"） |
| Task 12 Step 9 | 浏览器控制台**无 hydration 警告**；深色模式刷新后保持 |
| Task 14 Step 7 | 博客代码块有高亮；`smia-agent-from-idea-to-launch` 里的 ASCII 架构图**不折行错位** |
| Task 16 Step 6 | `localStorage` 设 `dark` 后**硬刷新**，不出现白色闪屏 |

机械性的截图可以用 `/browse`。"好不好看"不能。

---

## 五、需要停下来问我的决策点

计划里这些位置我特意没替你决定：

| 位置 | 待定的事 |
|---|---|
| Task 2 Step 3 | Bosch 的两条经历（邮件助手 / 智能排班 POC）拆成两条还是合并成一条 |
| Task 5 Step 1 | 聊天 prompt 里提到了具体数字（P95 52s→18s 等）—— 确认这些可以对访客说 |
| Task 11 Step 1 | 把 `src/data/` 整体搬到 `content/` 会改变 git 历史路径；确认可以接受 |
| Task 14 Step 2 | 9 篇博客从 `.ts` 转 `.mdx` 是**机械转换**，转换后每篇的行内代码转义要人工看一眼 |
| Task 17 Step 7 | `useChat` 的实际 API 签名——现场读 `node_modules/` 确认，不要猜 |

---

## 六、已知的不确定项（我标出来，不是保证）

1. **Task 17 Step 5 的 `bump_rate_limit` SQL 没在真实 Postgres 上验证过。**
   `returns table` + `on conflict do update` 的组合逻辑正确，但我没跑过。
   报错就停下，不要自己改 SQL 绕过。

2. **Task 2 Step 5 新增的 Simple Icons slug 没全部验证。**
   计划里有一步 `curl` 批量检查的脚本，跑它。非 200 的要换。

3. **AI SDK 的版本相关 API 我全部标注了"现场核对"。**
   不要凭记忆写。

---

## 七、其他约束

- **不要 `git push`**，除非明确说了。
- Phase 1/2 在 `main` 上做（本来就该尽快上线）；
  **Phase 3 开分支**（`git checkout -b nextjs-migration`），验证通过再合。
- **Phase 1 做完就部署一次**，不要等四个阶段全做完。内容是正确的这件事，
  和架构迁移完全解耦，没有理由让它陪着等。
- Phase 4 需要 DeepSeek key，**拿到之前不要开始**。

2026-10-15 发布追加：f53ffec已推送迁移分支并通过Preview21项线上检查，随后main生产重建Ready。线上发现原有apex→www永久跳转与计划中的canonical不一致，用户明确选择保留www.plonguo.com主域，授权统一SEO；SITE_URL、初始HTML/分享地址、sitemap/robots测试与spec同步，域名跳转规则不改。此SEO补发仍属本次发布，不启动Phase4。发布中出现用户新修改src/assets/Huizhirong Guo.pdf，保留未提交，public简历仍为已审核版本。
