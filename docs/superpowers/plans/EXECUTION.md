# 执行协议（每个新 session 开工前读这个）

配套计划：`2026-10-09-portfolio-content-and-nextjs-migration.md`

---

## 一、复制这段开新 session

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
