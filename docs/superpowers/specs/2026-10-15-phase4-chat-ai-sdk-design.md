# Phase 4：聊天助手 AI SDK 重构

日期：2026-10-15。当前状态：P4-01–04已实现、通过技术及独立review，并于2026-10-17获用户最终审核通过，Phase 4关闭；具体版本/外部迁移/证据以tickets/progress及验收报告为准。下文现状描述保留拆票前基线，不作为当前执行状态。对应[实施入口](../tickets/2026-10-15-phase4-chat-ai-sdk-design/README.md)。

关联：[原计划 Task 17–18](../plans/2026-10-09-portfolio-content-and-nextjs-migration.md)、[迁移交接](../reports/portfolio-bilingual-verification.md)、[PB-05 会话边界](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-05-session-and-widget-state.md)。本规格获批后与后续逐票计划共同约束实现，旧示例不直接复制。

## 1. 目标和现状

用 AI SDK 接管模型调用和浏览器流式消息处理，修正并发限流及 token 计量，同时保留已经验收的聊天体验。AI SDK 是统一模型调用与消息流的工具包；像换掉水管，聊天窗口的使用方式仍应一致。

基线：本地 `main` 的 `c541a75`，比线上多一笔已审核的语言切换/PDF提交。Phase 4 独立开发，未经授权不提交、推送或部署。

当前事实：

- 已有 DeepSeek 直连及 OpenAI 备用、系统提示词、服务端密钥；无需重新索要密钥或创建服务。仅检查配置是否存在，不输出值。
- `app/api/chat/route.ts` 委托 `lib/api/chat-route.ts`；`chat-services.ts` 管供应商，`chat-rate-limit.ts` 管数据库计数。
- `lib/client/chat-runtime.ts` 是浏览器内存单例，组件卸载不会主动取消请求。`useChatbot` 及聊天窗口订阅共享状态。
- 当前请求是 message/history，响应是 SSE `{content}` / `[DONE]`。SSE 是服务器持续向浏览器发送事件的连接。
- 当前 token_count 数的是输出分片；读改写计数有并发覆盖风险，ip/session 联合键还能通过更换 session 绕过。
- Markdown 展示、IME 输入保护、双语界面已完成，不重新设计。

## 2. 方案选择

| 方案 | 收益 | 代价 |
| --- | --- | --- |
| 保留现有 OpenAI 客户端，只修计数 | 最小改动 | 继续维护手写 SSE；不完成原 Phase 4 目标 |
| AI SDK + 现有供应商直连（采用） | 完成重构，复用已有密钥和备用规则 | 需要迁移消息协议和浏览器运行时 |
| 同时迁 AI Gateway | 可集中路由与用量观察 | 增加服务配置和行为变化，不属于本次目标 |

保持用户已选的直连模式。无需新增工具调用、RAG、登录、数据库聊天历史、跨设备恢复、模型选择器或消息重新生成。

## 3. 版本与模块边界

2026-10-15 只读 registry 查询：`ai` 7.0.141、`@ai-sdk/react` 4.0.145、`@ai-sdk/deepseek` 3.0.65、`@ai-sdk/openai` 4.0.94。它们是调研快照，不是已安装版本。实施时核对 peer dependencies，使用兼容的稳定版本并由 pnpm lockfile 锁定；先读所安装版本的 docs/source，再写 API 调用。

- 模型层：服务端使用 AI SDK streamText 和供应商适配器；复用 `lib/chat/system-prompt.ts`，不重写人物事实。
- 路由层：验证输入、校验 Origin、限流、建立流和处理取消；HTTP 前错误与流内错误分别处理。
- 浏览器层：一个浏览器专属 Chat 实例持有 SDK 消息与请求；`useChat({ chat })` 订阅该实例，关闭窗口/切页/换语言不销毁它。禁止在服务端创建跨访客共享实例。
- 原 session store 继续持有草稿、开关、验证码、完成计数、主题和联系表单。SDK 消息为唯一消息源，不维护可分别修改的两份消息数组；旧 UI 所需格式只能派生。
- 默认 Node.js runtime；保留 Next after 对必要结算工作的生命周期支持。不得用“后台继续读完模型”破坏主动停止。

## 4. 消息协议与发布兼容

新的 SDK 接口使用 `/api/chat/v2`，请求为 `{ messages, sessionId, turnstileToken? }`，响应为 AI SDK UI message stream。现有 `/api/chat` 作为旧标签页兼容入口保留，使用同一模型层和限流逻辑，不复制供应商策略。此兼容层只负责格式转换，不保留第二套手写供应商解析。

一次部署更新前后端也无法更新已打开的旧标签页，所以本阶段不直接让 `/api/chat` 改说新协议。兼容入口的退役另行决定，不在验收后自动删除。

服务端规则：

- 使用共享 readJson，JSON body 上限 32768 bytes；非 JSON 415、超限 413、结构错误 400。
- 最多 11 条消息：最后一条必须为非空 user 文本，最多 1000 个 JS 字符；此前最多 10 条 user/assistant，每条最多 8000 字符。前端只发送最近 10 条历史和本次用户消息。
- 仅接受 text parts；拒绝 system/tool 角色、文件、工具调用、未知 part 和不合法 ID。对允许字段重新构建消息，客户端 metadata/providerOptions 等不得穿透到模型。
- 既有可疑指令模式检查保留在最新用户文本上；它只是现有过滤规则，不宣称能防止所有提示词注入。
- 校验后用户文字原样进入模型，不进行 HTML 实体转义；空白是否可发送通过 trim 判断，实际正文不替换引号、斜杠、尖括号或中文。
- Origin、可信 IP 提取及错误 code 保留；400/403/413/415/429/503 均不调用模型。原联系邮件 HTML 转义必须保留。
- 保持当前验证码策略：提供 token 必须经服务器验证，无 token 不因此新增强制挑战。每 10 次成功回复后的前端挑战仍保留；取消、断流和失败不计为成功。此策略不是服务端每 10 次强制验证，不扩大其安全保证。

## 5. DeepSeek 与 OpenAI 备用

- 默认 DeepSeek，读取现有 DEEPSEEK_API_KEY / DEEPSEEK_MODEL，默认 deepseek-flash，明确关闭 thinking。备用读取 OPENAI_API_KEY / OPENAI_MODEL，默认 gpt-4.1-mini，继续使用 Chat Completions 协议，不顺带迁 Responses。
- 保留固定官方端点、两家凭证及参数隔离；max output 1024，DeepSeek temperature 0.7，SDK retries 为 0。
- DeepSeek 在第一段可显示文本之前 HTTP/网络/流失败、空响应，或 8 秒无正文，转 OpenAI 一次。首个文本后出错保留部分回答并提示中断，不拼接另一家回答。
- 缺 DeepSeek key 可直接使用已配置备用；缺备用 key 不影响正常 DeepSeek。两者均不可用返回通用服务错误，不暴露供应商正文或凭证。
- 请求总截止时间 20 秒，包含验证/限流/模型过程；备用共享剩余时间。用户取消或总截止不触发备用。
- 备用判断以正文为准，SDK 的 start/metadata 事件不算已输出。外层只生成一组一致的 assistant start/finish 事件，不能向客户端留下失败主用的空回复。

## 6. 原子限流与用量

原子操作是数据库一次完成检查和更新；像同一把锁管住进门和计数，避免两个人同时看到最后一个名额。

- 将门槛固定到服务端取得的 IP，30 次/小时、累计 100000 token/小时。sessionId 只标识界面会话，换 session 不能重置 IP 限额；同一出口 IP 的访客共享额度是明确取舍。不额外增加登录或 Cookie 身份系统。
- SQL RPC 单事务更新并返回放行结果与窗口标识。窗口采用数据库时间；并发 40 个新请求只允许 30 个，拒绝项不调用模型。数据库不可用/超时/异常返回 503，正常超限 429。
- 记录供应商返回的真实 input/output/total token usage；主用及备用有已知用量均计入，不按 chunk 数计费。取消/断流时没有完整 usage 的部分标为未知，日志不能写成真实 0，也不能把字数估算标成真实计量。
- 用量结算必须关联原请求和原窗口，重复回调不能重复加，旧窗口晚到结果不能污染新窗口。需要服务端生成的 request ID 和数据库结算去重记录；只保存计数/状态，不存聊天正文或原始密钥。
- token 门槛在请求准入时检查已结算累计量。并发在途请求及未知用量可能造成超额，这不是供应商账单的严格硬上限。本阶段不增加预扣/退款或供应商账单对账系统；30 次/IP/小时、输入大小、输出上限继续提供边界。不得宣称已解决所有成本滥用。
- 结算失败须有结构化服务端告警，不得静默吞掉或当作结算成功；已有正文可以保留，但请求不能以正常完整成功事件结束。结算工作须在请求取消后仍获得有界执行机会。
- 使用新增兼容表/函数，不破坏线上旧表。迁移文件纳入仓库；RLS 开启，撤销 public/anon/authenticated 表和函数权限，仅 service_role 可访问，固定 search_path。真实 schema 先只读核对，再生成迁移。

## 7. 前端体验与错误处理

- 流式 Markdown、滚动、输入长度、375px 布局、焦点、IME Enter/Shift+Enter 维持现状。
- 成功完成才递增 messageCount；SDK onFinish 需区分 abort/disconnect/error，不因收到回调就算成功。
- 显式停止取消上游，保留已显示正文、停止 loading、不弹通用错误；无正文时不留下空 assistant 气泡。窗口关闭、组件卸载、语言切换均不调用 stop。
- 网络、非 2xx 和流内错误映射现有双语 UIErrorCode，用户手动重试；不自动重放收费请求。下一次输入仅发送一次，不重复插入上一条用户消息。
- 保留已有草稿、主题和共享会话测试，避免为了适配 SDK 删除断流或卸载负例。

## 8. 清理与调度

- 只删除已经无 caller 的旧解析器、sanitizeMessage 和 openai 依赖；共享联系邮件 escapeHtml 不删除。旧协议兼容输出 adapter 保留。
- 在数据库设置唯一命名的 cleanup 任务，每日 04:17 UTC 清理过期计数和结算去重记录（至少保留 24 小时，不清除活跃窗口）。迁移可重复执行，不产生重复 cron job。
- 先只读核对 pg_cron、权限及现有 cleanup 函数；不覆盖无关函数或作业。验证只清理本次测试记录；SQL 错误必须报告，不能跳过后声称完成。
- README/CLAUDE/执行入口与测试 fixture 更新为实际实现，旧计划标为被替代；密钥继续只在服务端。

## 9. 验收

| 编号 | 必须证明的行为 |
| --- | --- |
| P4-AC01 | DeepSeek 真实非空回复；受控主用失败后真实 OpenAI 备用；两种证据分别标明 |
| P4-AC02 | 首字前失败/超时仅备用一次；首字后失败、停止、总超时都不备用 |
| P4-AC03 | 并发准入准确，更换 session 不绕过；数据库故障时无供应商调用 |
| P4-AC04 | 已知 usage 精确累计；重复结算、窗口跨越、未知 usage、结算失败、取消均有正反例 |
| P4-AC05 | 实际模型请求中引号/斜杠/中文/尖括号原样；非法角色、parts、body size 等在模型前拒绝 |
| P4-AC06 | 真正延迟的 HTTP 流跨首页/Lab/blog及两语切换持续，同一会话、草稿、主题保留；主动停止实际取消服务器 |
| P4-AC07 | 旧 `/api/chat` 客户端与新 `/api/chat/v2` 均可用；两者共享限流和供应商策略 |
| P4-AC08 | cron 唯一且有效、SQL 权限正反例和只清理过期记录得到实际验证 |
| P4-AC09 | unit、typecheck、lint、content:check、Production build 与相关浏览器回归通过；真实服务结果不由 fixture 代替 |
| P4-AC10 | 用户人工确认中英文聊天、Markdown、停止、切语言不断流和移动端体验后关票 |

数据库外部操作按对应票据范围执行；没有实际数据库验证不能关限流/cron票。现有真实密钥无需展示或重复配置。提交、推送与部署分别需要明确授权。

## 10. 拆票边界（不是实施 tickets）

spec 审核通过后，在 `docs/superpowers/tickets/2026-10-15-phase4-chat-ai-sdk-design/` 编写匹配 tickets 和 progress。建议顺序：

1. P4-01：原子 IP 限流与可去重用量结算基础，保留当前协议及模型客户端。
2. P4-02：服务端 AI SDK 及真实 usage，保留旧 SSE adapter 和备用规则。
3. P4-03：新协议与浏览器共享 Chat 实例，旧入口兼容及跨语言流回归。
4. P4-04：安全清理、cron、文档和最终真人验收。

每张均独立实现、验证、停下等用户审核。P4-01 搭建的新计量基础在 P4-02 接入真实 usage 前不得声称已完成真实 token 统计；逐票计划需明确中间兼容状态。

## 官方资料

- [useChat：共享 Chat 实例、transport 与完成状态](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [UI message stream 协议](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)
- [DeepSeek provider 与 thinking 参数](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)
- [streamText：usage、取消及错误处理](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)

网页用于设计核对；实际 API 签名以实施时安装版本的文档和源码为准。


## 11. 用户追加裁定（P4-04）

P4-03审核通过后用户明确不增加新对话按钮，并要求prompt限制为本人相关问题：允许了解本人、已知经历/技能/项目/求职/兴趣/联系及网站；无关通用问答、作业、代码、翻译、计算和创作简短拒答，混合请求只答相关部分，相关追问继续。两供应商共享此限制；不增加分类模型或额外收费调用。固定拒答句按当前消息是否含汉字选择中/英文，避免备用模型在两条模板间选错。模型指令不能承诺完全抵挡提示词绕过或零成本拒绝，现有IP/输入/输出限额继续约束成本。
