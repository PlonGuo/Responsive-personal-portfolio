# P4-02：AI SDK 服务端模型运行器与真实用量

状态：实现、技术验收及用户审核通过（2026-10-15）。用户已“启动”本票；P4-01已审核通过。规格：§3/5/6，P4-AC01/02/04、AC05 原样输入部分。

配套：[spec](../../specs/2026-10-15-phase4-chat-ai-sdk-design.md)、[全局约束](README.md)、[progress](progress.md)。

## 可交付结果和边界

旧 `/api/chat` 及浏览器请求/响应不变，底层模型改为 AI SDK，真实 usage 经 P4-01 去重结算。DeepSeek 主用、OpenAI 首字前备用保持。只迁模型层，不安装 @ai-sdk/react、不改 useChatbot，不提前实现 v2/cron。

## Files 与 caller

- Read：P4-01 实际 ChatQuota/ChatServices、`app/api/chat/route.ts`、`lib/chat/system-prompt.ts`、`lib/api/chat-services.ts`、`tests/unit/chat-services.test.ts`。
- Create：`lib/chat/model-runtime.ts`（统一生成和备用）、`lib/chat/providers.ts`（固定端点/参数）、`tests/unit/model-runtime.test.ts`、`tests/unit/provider-usage.test.ts`。
- Modify：`lib/chat/contracts.ts`、`lib/api/chat-services.ts`、`lib/api/chat-route.ts`、`tests/unit/chat-services.test.ts`、`tests/unit/api-routes.test.ts`、`package.json`、`pnpm-lock.yaml`。
- Update：本票/progress/README 的真实计量与取消说明。不修改系统提示词的人物事实。

```bash
rg -n 'chatServices|ChatServices|sanitizeMessage|from .openai.|buildSystemPrompt|retainCompletion' app lib src tests
```

## Interfaces

保留 P4-01 的 ChatPermit/UsageReport/ChatQuota；新增：

```ts
export interface ModelInput {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}
export interface Generation {
  text: AsyncIterable<string>;
  outcome: Promise<UsageReport>;
}
// 在第一段正文准备好之前不 resolve；失败可在 HTTP headers 前报告。
export type StartGeneration = (input: ModelInput, signal: AbortSignal) => Promise<Generation>;
export class GenerationStartError extends Error {
  constructor(public readonly report: UsageReport) {
    super('Chat service unavailable');
  }
}
```

`lib/chat/model-runtime.ts` 导出 `startGeneration: StartGeneration`。ChatServices 的 stream 改名 `start: StartGeneration`，admit/settle/verify 不变。模型层不调用数据库；路由消费 text 并最终使用 outcome 结算。outcome 无论 complete/error/abort 均有界 resolve；text 抛错也必须保留已知 usage；不得互相等待造成死锁。

首正文前reject统一抛GenerationStartError携带report，包含已尝试两家可获得的usage及终止原因；路由捕获它完成同一permit结算后才返回通用HTTP错误。否则Promise<Generation>尚未返回时的失败会丢失主用/备用已知usage。该report仅服务端使用，不放入HTTP响应。

## 实施与验证步骤

- [x] **1. 核对版本再安装。** 查询 ai 和供应商包 peerDependencies/engines，选择 AI SDK 7 的兼容稳定版本；先安装 ai，读 bundled docs/source，再安装兼容 @ai-sdk/deepseek、@ai-sdk/openai。pnpm 锁定，不运行全依赖升级。

```bash
pnpm view ai version engines
pnpm view @ai-sdk/deepseek version peerDependencies
pnpm view @ai-sdk/openai version peerDependencies
pnpm add ai@7
rg -n 'streamText|onAbort|totalUsage|maxRetries' node_modules/ai/docs node_modules/ai/src
```

记录安装版本、DeepSeek thinking 选项和 OpenAI Chat Completions factory 的实际签名；依赖安装不是产品逻辑 RED。保留现有 openai 依赖至 P4-04 搜索无引用后删除。

- [x] **2. 先写 provider transport RED。** 使用真实已安装 AI SDK，只替换底层 HTTP fetch，不 mock streamText。记录 endpoint、Authorization、JSON body 和 abort signal。DeepSeek 返回模拟分段 SSE/usage，备用返回 OpenAI 兼容 SSE/usage，供应商格式依据安装包实际测试 fixtures 构建。

```ts
const run = await startGeneration({ message: "What's React/Vue？<中文>", history: [] }, signal);
expect(await collect(run.text)).toBe('reply');
expect((await run.outcome).attempts).toEqual([
  { provider: 'deepseek', inputTokens: 23, outputTokens: 7, totalTokens: 30 },
]);
expect(providerRequests).toHaveLength(1);
expect(lastUserText(providerRequests[0])).toBe("What's React/Vue？<中文>");
```

collect/lastUserText 为本测试文件内的小 helper，分别消费 AsyncIterable 和读取捕获的供应商 messages；实际断言必须针对模型请求，不能仅比较 input 常量。先运行并保存未实现新运行器导致的 RED。

- [x] **3. 实现固定供应商配置。** server-only 模块读取现有 key/model；DeepSeek=deepseek-flash、thinking disabled、temperature0.7、maxOutputTokens1024；备用=gpt-4.1-mini、Chat Completions、1024、无 DeepSeek 参数。忽略客户端或无关 OPENAI_BASE_URL 对端点的覆盖；测试验证两家 key 不串用。禁用 SDK 默认 retries。

模型消息只由 server system prompt、重建 role/content 的 history 和原样当前用户文本构成。删模型链路 sanitizeMessage；保持联系邮件 escapeHtml。当前 suspiciousPatterns 仍由路由校验。

- [x] **4. 实现首正文门控及备用。** SDK chunk 解码交给 SDK；运行器从其流事件提取正文/usage/error。先读到首个非空正文，才向 route 返回 Generation；空字符串、start、metadata、reasoning 不算正文。为 DeepSeek 单独创建 8 秒启动 abort，与请求总 signal 合并；首正文后清定时器。主用失败的流必须取消/关闭后再开一次备用，备用不重复主用8秒定时器，但共享总截止。

```ts
// 应用层不依赖 SDK 自动重试或自动备用。
// emitted=true 后所有错误沿当前回答失败，不再启动第二家。
if (signal.aborted) throw signal.reason;
if (emitted) throw new Error('Chat service unavailable');
// 只有首正文前主用失败/空流/启动超时才选择备用。
```

将已尝试主用/备用的可用 usage 收集到 outcome。未提供数字为 null；正常 null total 且 input/output 齐全时按 P4-01规则规范化。SDK 没给 complete usage 的取消不能伪造精确量；不能通过 consumeStream 忽略取消继续生成。

- [x] **5. 增加备用/取消 RED→GREEN 矩阵。** 每项断言真实 transport 调用次数和 signal 状态：HTTP401/429/503、连接错、正文前错误、空流、8秒无正文、只有 metadata8秒、缺主用 key、缺备用 key、两家失败；正文后错误、显式取消、20秒截止均不得备用。fake timers 有界推进，并确认上游 abort；不得让测试真实等8/20秒。

```ts
expect(providerRequests.map(item => item.provider)).toEqual(['deepseek', 'openai']);
expect(providerRequests[0].signal.aborted).toBe(true);
expect((await run.outcome).attempts).toHaveLength(2);
```

单测模型层和 route 联合用例：主用已知 usage 后备用、备用输出后取消、未知主用+已知备用、非数字 usage、输出后结算失败。route 必须在 headers 前失败也结算已准入请求，正常 DONE 必须在 settle 成功之后。

- [x] **6. 接回旧 SSE。** route 使用 services.start，并将 Generation.text 转成原 `{content}` / `[DONE]`，不修改浏览器。所有退出路径归同一结算终点，after 保留 completion；settle 的独立5秒信号不受已取消模型信号影响。请求创建时启动20秒截止，验证/准入后均检查剩余时间，超时不启动任何供应商。

```ts
const generation = await services.start({ message: body.message, history: body.history }, signal);
// 消费 generation.text；结束/失败/取消后取得 generation.outcome，调用 settle。
// complete 且结算成功才发送 [DONE]；其他情况发既有通用流错误或关闭已取消连接。
```

- [x] **7. 自动验证与真实外部复验。**

```bash
pnpm exec vitest run tests/unit/model-runtime.test.ts tests/unit/provider-usage.test.ts tests/unit/chat-services.test.ts tests/unit/api-routes.test.ts tests/unit/chat-rate-limit.test.ts
pnpm typecheck
pnpm lint
VERCEL_ENV=production pnpm build
```

本地真实 DeepSeek 回复200非空；在隔离测试依赖中让主用503，再调用真实 OpenAI，记录备用200非空及数据库对应已知用量。不得修改生产模型配置或故意破坏线上服务；不输出 key 或完整用户对话。比对 provider usage 与本次 request ledger；主动停止、结算失败另由受控 HTTP 验证。

运行旧 API/会话浏览器专项，用户本地确认旧窗口仍正常、Markdown和主动停止无回归。保留“真实外部服务”与“模拟主用失败”的区别。更新 progress 后停，等待审核；不进入 P4-03。


## 实际交付（2026-10-15）

- 安装并锁定ai7.0.141、@ai-sdk/deepseek3.0.65、@ai-sdk/openai4.0.94，Node要求>=22；已阅读所装版本源码及provider参数/usage转换。没有安装@ai-sdk/react，没有新增v2，没有配置cron，没有新建供应商集成。
- 新增providers/model-runtime，ChatServices.stream改为start:StartGeneration；原有两个服务端准入/结算RPC复用。model-runtime首正文准备后返回Generation，启动失败通过GenerationStartError携带报告；route在headers前失败也结算。旧content/DONE输出与前端运行时不变。
- 删模型链路sanitizeMessage，实际provider请求中引号/斜杠/尖括号/中文原样；联系邮件HTML转义原实现和测试保留。系统提示词中文全名回修保留并验证两家供应商都收到。
- Usage来自单个SDK reader的finish-step.usage.raw，避免SDK将缺失字段补0、将total变成简单相加；未提供total且input/output齐全才相加。首字前备用/8秒、首字后失败不备用、整体取消/20秒、密钥缺失、HTTP/网络/流错误、空流、非法用量、原始total不同于输入输出和均覆盖。
- TDD：新model-runtime接口首先因模块缺失RED，接线路由10项RED；实现后专项及全量通过。最终287项unit、34项Production浏览器、Production构建（含内容）、typecheck/lint通过，无跳过。新增真实loopback HTTP测试2项，验证停止关闭上游TCP连接、结算失败不产生DONE；不把fetch替身当真实外部供应商。
- 真实外部验证：DeepSeek200非空DONE，input1604/output31/total1635；受控模拟主用503后真实OpenAI200非空DONE，input1590/output18/total1608。两次report与真实数据库ledger及quota逐项一致，模拟失败的主用保持null，测试自己的记录已清理。此处是Web Request route factory配合真实外部HTTP，不冒充Next监听端口。
- 另经真实Next dev localhost:3000/api/chat：200非空DONE（约2.3秒）；ledger记录DeepSeek input1604/output26/total1630，quota匹配且unknown_usage_count=0；已只清理本次精确requestId和测试IP记录。
- 过程修正：providerOptions联合类型产生可选undefined属性，不符合SDK JSON类型，改为安装版本参数派生的明确配置类型后通过；DeepSeek V4适配器自动生成空reasoning_content属SDK协议行为，history泄漏测试改为断言不含客户端name/tool_calls；测试catch空块lint修正为明确已关闭状态。未修改生产网络、密钥或供应商配置。
- 本轮自行复核；整Phase结束后再独立分支审查。openai旧依赖保留至P4-04确认无caller再退役。完成本票后停止，等待用户体验审核，不提前P4-03，不提交/推送/部署。

证据：/tmp/portfolio-phase4-evidence/p4-02-{install-ai,install-providers,model-red,model-green,route-red,route-green,matrix,http,unit-final,typecheck-final,lint-final,build,e2e}.log，p4-02-real-runtime.{log,json}、p4-02-dev-chat.json、p4-02-dev-ledger.json。步骤7的技术项均已完成；用户正常问答/Markdown/主动停止审核待确认。


2026-10-15用户确认“通过”，本票人工体验审核通过并关闭。P4-03待启动；未提交、推送或部署。
