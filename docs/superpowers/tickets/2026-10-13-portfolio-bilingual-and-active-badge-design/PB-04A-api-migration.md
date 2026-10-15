# PB-04A：迁移三个 API 到 Next.js

状态：用户于 2026-10-13 审核通过。Next邮件人工验收通过；后续PB-10已验证GitHub fresh200，缓存回写/当前聊天与邮件路径因Supabase网络失败未通过；验证码重放仍未验证。当前状态见总验收报告。阶段：Phase 3。依赖：PB-04；原 Phase 2 联系接口安全层。对应原计划 Task 13；完成后等待用户审核，不自动进入 PB-05。

配套：[同名目录对应 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)、[实施计划](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)、[原 Task 13](../../plans/2026-10-09-portfolio-content-and-nextjs-migration.md#task-13-迁移-api-路由)。本票把已批准的前置 Task 13 单独编号，便于逐票审核，不新增阶段。

## 目标与边界

让现有 `/api/send-email`、`/api/chat`、`/api/github-commits` 在 Next 开发与生产服务器中可用。地址和现有 JSON/SSE（每次一条 `data:` 事件，最后 `[DONE]`）协议保持；密钥仅服务端。保留 OpenAI、现有模型、用户已修改的系统提示词和联系收件人，不改供应商、不接 AI SDK、不挂载浮层、不实现共享会话或语言入口。

## 文件与接口

- Create：`app/api/{send-email,chat,github-commits}/route.ts`，只负责框架出口，Node 默认运行时，原聊天 30 秒/更新 10 秒限制以 route `maxDuration` 保留。
- Create：`lib/supabase/admin.ts`，`getAdminClient(): SupabaseClient` 延迟读取服务端 env，`server-only` 阻止客户端导入；缺配置在请求边界返回错误，不使静态页面构建崩溃。
- Move：`api/_shared/contact.ts`、`contact-services.ts` → `lib/api/`；保留 `createContactHandler`、`ContactServices`、已验证的原子 RPC、转义、Turnstile action/hostname 和错误码。
- Create：`lib/api/http.ts`（Headers 适配、JSON 32 KiB 上限与结构化错误）、`contact-route.ts`、`chat-route.ts`、`chat-rate-limit.ts`、`chat-services.ts`、`github-commits.ts`、`github-services.ts`；通过显式依赖注入测试服务故障，产品不接测试开关。
- Create：`lib/chat/system-prompt.ts`，从当前工作区提取 `buildSystemPrompt()`，原文字逐字保留。
- Create：`tests/unit/api-routes.test.ts`、`chat-rate-limit.test.ts`、`chat-services.test.ts`、`tests/e2e/api-routes.spec.ts`；更新联系测试 import、server tsconfig 和测试 alias。
- Retire：旧 `api/` 入口及已被 Next 原生路由替代的 `vercel.json`；临时 `scripts/api-dev.ts` 验证服务器不再使用。保留用户改动，不能运行 `git rm -r` 丢失未迁移源码。

## 检查重点

1. 合法同源 GitHub GET 常不带 Origin，必须可用；写接口仍要求合法 Origin，OPTIONS 也严格检查，禁止反射任意域名。
2. 坏 JSON、非 JSON、过大请求、无效历史角色/类型返回结构化 400/413/415，不触发邮件或付费模型。只允许历史 `user/assistant`，不允许客户端插入 system 提示。
3. 联系接口令牌必填、限流服务不可用 503、超限 429；自动测试不发送真实邮件，真实人工提交到本人邮箱单独记录。
4. 聊天限流读取、首次插入、窗口重置、计数更新任何失败均 503，不调用模型；正常超限 429。不把故障当作放行，保留原 30 次/小时、100000 近似 token/小时阈值。本票不新建聊天数据库 RPC，原读改写并发限制及 token 估算不足须明确报告，Phase 4 处理。
5. SSE 正常渐进返回、异常有 error 事件、取消/超时停止上游；不能响应结束后裸丢弃计费/缓存 Promise。终止前完成现有计数写入；更新缓存写入受超时保护并等待，失败不遮盖已取得的公开 GitHub 数据。

## 实现与验收

- [x] 读三个接口、Contact/useChatbot/UpdatesWidget caller、安全工具及 env 名称，记录用户系统提示词改动；只读配置是否存在，不打印密钥。
- [x] 写并运行 factory/limiter 测试，确认缺失模块 RED：联系转义/验证码/限流、Origin/OPTIONS、JSON 解析、chat 正常/故障/SSE/取消、GitHub 新鲜缓存/更新/过期回退。
- [x] 实现可测试的 Request → Response 边界；复用联系安全 handler，验证后提取系统提示，不重写文案。限制 JSON 和历史输入，匹配既有错误码。
- [x] 实现延迟 server-only SDK 服务；聊天数据库读写检查每个 error 并 fail closed；GitHub 缓存失败按公开内容的既有 stale 回退，不允许绕过 Origin。
- [x] 接三个 route；先证明 Next 实际返回 API JSON/SSE，之后退役旧入口/config/harness并复核所有 import。不能用浏览器跳转桩当真实 API 成功。
- [x] 执行 `pnpm run test`、`pnpm run typecheck`、`pnpm run build`、`pnpm run lint`、`pnpm run test:e2e`、`git diff --check`；生产 HTTP 验收方法、CORS、坏 JSON、无 token 等无副作用路径；已有 18 项页面测试仍通过。
- [ ] 开发服务器下验证真实 GitHub、真实 OpenAI 流和本人联系邮件，明确人工 CAPTCHA/重复 token 路径；测试不得发给第三人。生产 NODE_ENV 拒绝 localhost Origin 的策略保持，人工本地提交在 dev 验证。
  - [x] 真实 OpenAI 流与记账；真实 GitHub stale 回退；本人 Next 邮件发送并收件（2026-10-13 用户确认）。
  - [ ] 真实 GitHub fresh 获取：当前匿名配额耗尽。
  - [ ] 真实已用验证码 token 的重放拒绝。
- [x] 回填证据、未验证项与风险，完成这一票后停止；用户于 2026-10-13 审核通过，不自动开始 PB-05。

## 技术依据

使用当前安装的 Next 16.4.0 和已核对的 [Route Handler 官方文档](https://nextjs.org/docs/app/api-reference/file-conventions/route)。不照搬旧计划的 `next lint`、未检查 Supabase 写错误或 `git add -A` 示例；不自动提交、推送或部署。


## 当前交付记录

- 三个 Next route 已生成，旧 api/、SPA vercel.json、临时联系 harness 已退役；系统提示及联系 handler 与迁移前工作区快照逐字比对相同。原用户改动未丢，未提交/推送/部署。
- 92 unit、Next build、Next/Node 两套 typecheck 通过；26 项生产服务器 browser/API 最终回归通过。lint 0 errors / 1 既有 UpdatesWidget warning；客户端静态产物未找到现有服务端密钥值。
- 真实 OpenAI 请求成功（26 个 content event、DONE、无 SSE error），数据库记账为 request_count=1/token_count=26；只清理本票自己临时 key。后续零行检查改动的真实 Supabase 保留与记账又单独复验，request_count=1/token_count=2，清理自己的 key。
- GitHub 实际返回 200 + cached/stale；上游匿名配额为 0，真实请求 403。没有配置 GITHUB_TOKEN，未改认证配置；fresh 成功只在无网络副作用的依赖测试中证明，真实 fresh 成功尚未验证。
- 2026-10-13 用户确认在 http://127.0.0.1:3002/zh#contact 完成人工验证码后“已发送并收到邮件”；记录为迁移后的真实 Next 邮件提交与收件成功。真实已用 token 重放拒绝仍未直接验证。
- 审查未发现阻塞级新增缺陷；历史消息多余字段穿透 OpenAI 的契约回归已用失败测试证明并修复，真实 SDK transport 替身只接收 role/content。原客户端 SSE 分片/error 处理归 PB-05；聊天非原子、可换 session、近似 token 统计仍是已知既有风险，原 Phase 4 改造前不能称为完整滥用防护。
- 2026-10-13 用户明确确认“PB-04A 审核通过”。记录为整票审核通过，未验证项仍保留，不全部勾选；下一票 PB-05 等待明确启动指令。
