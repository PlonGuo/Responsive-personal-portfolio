# Phase 4 聊天助手重构 Implementation Plan

> **For agentic workers:** 使用 superpowers:executing-plans，由主 agent 串行实现。用户规则优先：每次只实现一张 ticket，完成后停止，等待用户审核并授权下一张；不采用技能中的连续执行或自动提交步骤。

**Goal:** 用 AI SDK 替换模型调用与浏览器手写流解析，修正并发限流和用量统计，保留两语聊天体验与 DeepSeek→OpenAI 备用。

**Architecture:** 服务端模型运行器供旧 SSE 和新 UI message stream 两个接口共用，数据库按 IP 原子准入并按请求/窗口去重结算。浏览器一个 Chat 实例持有消息和网络请求，现有 session store 继续持有草稿、开关和验证码等界面状态。

**Tech Stack:** Next.js 16.4、React 19、TypeScript、pnpm、Node 22、Supabase Postgres、AI SDK 7 及兼容的 React/DeepSeek/OpenAI 包；实际版本在安装票中核对并锁定。

**Spec:** [2026-10-15-phase4-chat-ai-sdk-design.md](../../specs/2026-10-15-phase4-chat-ai-sdk-design.md)。执行前同时阅读 spec、本文件、当前票据和 progress。

## Global Constraints

- 一次一张，审核后继续；不自动提交、推送、部署，不执行旧计划中的 git add -A。
- 当前本地 main 基线 c541a75；已有未提交的 Phase 4 文档必须保留。实施时创建本地 `phase4-chat-ai-sdk` 分支，复用用户 localhost:3000 服务，不增加 worktree 或终止用户服务。
- 固定 DeepSeek 主用、OpenAI 首字前备用；不增加 Gateway、外部服务、工具调用、RAG 或聊天数据库历史。
- max output 1024；主用首正文等待 8 秒；请求模型阶段总截止 20 秒；两家 SDK retries=0；Next maxDuration=30。
- 验证、准入、模型共用 20 秒截止。数据库结算使用独立最长 5 秒信号，并由 Next after 保留有界生命周期；不得为了拿 usage 继续收费生成。
- JSON body 上限 32768 bytes；新消息最多 1000 个 JS 字符，历史最多 10 条、每条最多 8000 字符；新协议最多 11 条、仅 text parts、user/assistant 角色。
- `/api/chat` 旧协议保留，`/api/chat/v2` 新协议；不引入第三套模型/限流逻辑，不在本阶段删除兼容入口。
- 30 次/IP/小时、已结算 100000 token/IP/小时；sessionId 不参与额度身份。同出口 IP 共享配额，unknown IP 共用保守桶。
- usage 未知不写成真实 0，不把分片数/字数当真实 token；token 门槛不是严格的账单硬上限，不增加预扣退款系统。
- RLS 开启，public/anon/authenticated 无表与函数权限，仅 service_role；固定 search_path；不破坏已有线上表和作业。
- 真实供应商、真实数据库、HTTP fixture 和 mock 证据分开；未执行的验收写未验证，不能关票。
- server-only 密钥边界、现有 Origin/IP 信任边界、联系邮件 escapeHtml、主题/草稿/IME/Markdown 均保留。

## Review Focus

1. 正文前只收到 SDK start/metadata：不能误判已输出而放弃备用。P4-02 用延迟 HTTP 模拟验证。
2. 流中切语言导致 hook 卸载：不能取消或重复发送；停止按钮必须真实中止服务器。P4-03 共享实例及 HTTP fixture 验证。
3. 小时窗口刚重置，旧请求才结算：不得给新窗口加旧用量，也不能丢失旧请求审计。P4-01 SQL 与 P4-02 路由验证。
4. 同一完成结果被回调/取消清理重复结算：已知 usage 只加一次，冲突报告报错。P4-01 RPC 正反例与 P4-02 联合测试。
5. 旧网页没有更新 JS：旧 `/api/chat` 必须仍可流式回答，且与 v2 共享同一 IP 门槛。P4-03 双协议真实 HTTP 验证。

## Tickets 与中间交付

| 顺序 | Ticket | 完成后的可审核结果 | 依赖 |
| --- | --- | --- | --- |
| 1 | [P4-01](P4-01-atomic-chat-limits.md) | 现有聊天改用原子 IP 限流；具备去重结算基础，用量暂标未知 | spec/本计划获批并授权实现 |
| 2 | [P4-02](P4-02-ai-sdk-provider-runtime.md) | 旧界面和旧 SSE 不变，模型改 AI SDK，接真实 usage 与备用 | P4-01 用户审核通过 |
| 3 | [P4-03](P4-03-shared-chat-ui-protocol.md) | 新界面使用共享 Chat 与 v2，旧标签页仍能用 | P4-02 用户审核通过 |
| 4 | [P4-04](P4-04-cleanup-and-acceptance.md) | cron、无引用清理、完整回归及真人总验收 | P4-03 用户审核通过 |

不得提前写下一张产品代码。每张运行本票有意义的检查；只有新增改动/失败才扩大或重复测试。最终全量检查在 P4-04，不用重复全套构建代替专项证据。

## AC 归属

| Spec AC | 主责 ticket | 必须保留的证据 |
| --- | --- | --- |
| P4-AC01 | P4-02 | 真实 DeepSeek；受控主用故障后的真实 OpenAI |
| P4-AC02 | P4-02 | 两家实际 transport 调用次数、超时与取消 |
| P4-AC03 | P4-01 | 实际 SQL 并发与角色权限，路由不调用模型负例 |
| P4-AC04 | P4-01 基础、P4-02 完成 | 幂等/跨窗/未知/结算失败及真实 usage |
| P4-AC05 | P4-02 原样输入、P4-03 新协议校验 | 实际 provider transport body 断言 |
| P4-AC06 | P4-03 | 延迟真实 HTTP，跨页/跨语言、取消统计 |
| P4-AC07 | P4-03 | 同一服务实例和配额下的新旧客户端 |
| P4-AC08 | P4-04 | cron 读回、重复应用、权限、过期清理 |
| P4-AC09 | 每票专项、P4-04 总验收 | 命令/退出码、fixture 与外部服务分类 |
| P4-AC10 | 每票必要人工、P4-04 最终确认 | 用户确认，不以自动截图替代 |

## 验证命令与证据

单位测试采用 `pnpm exec vitest run <本票测试路径>`；全量 `pnpm test`。类型 `pnpm typecheck`，静态检查 `pnpm lint`，内容 `pnpm content:check`，生产构建 `VERCEL_ENV=production pnpm build`。

浏览器使用仓库 Playwright，默认测试端口 3105，fixture 3219；命令为 `PORTFOLIO_TEST_PORT=3105 VERCEL_ENV=production pnpm exec playwright test <spec路径>`。并行测试 worker 可以由项目配置管理，但不得同时启动两条 Playwright CLI 抢占 fixture 和 test-results。生产 CORS 的真实接口使用允许的测试 Origin；localhost 手动聊天使用 dev，不放宽生产白名单。

日志放 `/tmp/portfolio-phase4-evidence/`，完成后在 [progress](progress.md) 和本票记录命令、结果、外部改动、未验证项、人工结论及接口偏差。不把临时日志、环境文件或构建产物提交。不得用环境变量打开生产“跳验证码/绕限流/强制故障”后门；故障注入通过测试依赖实现。
