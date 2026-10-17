# P4-03：共享 Chat 实例、新流协议与旧入口兼容

状态：用户审核通过。依赖：P4-02 用户审核通过；用户“哦，开始吧”已授权启动本票。规格：§3/4/7，P4-AC05/06/07及AC10专项。

配套：[spec](../../specs/2026-10-15-phase4-chat-ai-sdk-design.md)、[全局约束](README.md)、[progress](progress.md)。

## 可交付结果和边界

新浏览器界面通过 AI SDK Chat/useChat 和 `/api/chat/v2` 交互，历史/草稿/流跨页及跨语言保留。旧 `/api/chat` 继续使用同一模型运行器及数据库配额，旧网页无需刷新仍能聊天。本票不改供应商规则、限额、清理调度或页面设计。

## Files 与 caller

- Read：P4-02 `lib/chat/contracts.ts` 和 model-runtime、旧 route 和 services；`src/components/Chatbot.tsx`及其Markdown渲染caller、`src/hooks/useChatbot.ts`、`lib/client/chat-runtime.ts`、`lib/client/session.ts`、`src/types/chat.ts`。
- Create：`app/api/chat/v2/route.ts`、`lib/api/chat-input.ts`（两个协议校验/规范化）、`lib/api/chat-v2-route.ts`、`lib/client/chat-instance.ts`（浏览器唯一 SDK Chat）、`tests/unit/chat-input.test.ts`、`tests/unit/chat-v2-route.test.ts`、`tests/unit/chat-instance.test.tsx`、`tests/e2e/chat-protocol-compat.spec.ts`。
- Modify：`lib/api/chat-route.ts`（复用校验/准入/结算）、`lib/client/chat-runtime.ts`（迁成委托 SDK 的兼容 facade，不再解析 SSE）、`src/hooks/useChatbot.ts`、`lib/client/session.ts`、`src/types/chat.ts`、`src/components/Chatbot.tsx`、`package.json`、`pnpm-lock.yaml`。
- Modify：`tests/fixtures/chat-stream-server.mjs`、`tests/unit/chat-runtime.test.ts`、`session-lifetime.test.tsx`、`session.test.ts`、`chat-markdown.test.tsx`、`tests/e2e/api-routes.spec.ts`、`session-lifetime.spec.ts`、`language-navigation.spec.ts`、`chat-input.spec.ts` 以及搜索定位到的旧协议 fixture。
- Create：必要时 `lib/api/chat-lifecycle.ts`，只放两个路由共同的准入/验证/截止/结算逻辑；保留 route factory 的依赖注入和独立测试。
- Update：本票/progress/README 的协议与会话说明。

```bash
rg -n 'chat\.messages|isLoading|ChatRequest|createChatRuntime|getChatRuntime|useChatbot|api/chat|\[DONE\]' app lib src tests
rg --files src/components | rg -i 'chat|message'
```

## Interfaces

复用 P4-01/02 的 ChatQuota/Generation/StartGeneration；不创建另一套计量或模型选择。

```ts
export interface NormalizedChatInput {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId: string;
  turnstileToken?: string;
}
export function parseLegacyChat(value: unknown): NormalizedChatInput | null;
export function parseUIChat(value: unknown): NormalizedChatInput | null;
```

两个 parser 共享文本/session/token及可疑模式检查，v2 额外验证 UIMessage role/parts/id，重建纯文本 role/content。v2 接受 SDK transport 附带 id/trigger/messageId 等请求外层字段但不传给模型；不支持的 regenerate/工具 trigger 返回400，不开放新产品功能。

浏览器导出 `getChatInstance()`、`createChatInstance(store, fetcher)`。前者只能在 window 环境调用，返回当前浏览器唯一实例；后者供测试注入 store 与 HTTP transport。实例内部 SDK Chat 是消息/状态/error 的唯一源；runtime facade 仅提供 `sendMessage(): Promise<void>`、`abortRequest(): void`，委托实例。

useChatbot 继续向现有 UI 提供 messages、input、isLoading、error、sendMessage、abortRequest 等当前字段；messages 从 SDK parts 派生供 Markdown 使用，不再写回 SessionState.chat.messages。若必须保留 Message 类型，仅作为只读 UI 投影；时间戳使用 SDK message metadata 或实例内按 messageId 的稳定首次出现时间，不能每次渲染 Date.now 改排序。

## 实施与验证步骤

- [x] **1. 安装匹配 React 包并读实际实现。** 先查 @ai-sdk/react peerDependencies，再安装与 P4-02 ai7 兼容版本；阅读 bundled docs 与 Chat/useChat/DefaultChatTransport 源码，确认卸载是否中止以及如何传共享实例。不得照抄旧 useChat({api,body})。

```bash
pnpm view @ai-sdk/react version peerDependencies
rg -n 'Chat|useChat|DefaultChatTransport|prepareSendMessagesRequest|onFinish' node_modules/ai/docs node_modules/ai/src
# 安装匹配包后，再读 node_modules/@ai-sdk/react 下对应声明与实现。
```

- [x] **2. 输入校验 RED。** 纯 parser 测试完整覆盖数量、字数、UTF-8 byte body边界、role、parts、ID、sessionId、token类型与长度。单条消息允许多个 text parts，拼接后一起计长度；id 为1–200字符、`^[a-zA-Z0-9_-]+$`，同一请求不得重复。每个 part.text 必须 string，未知 part 拒绝；客户端 metadata/providerOptions 等字段重建时丢弃，不穿透。

```ts
expect(parseUIChat({ sessionId: 'session', messages: [
  { id: 'm1', role: 'user', parts: [{ type: 'text', text: "What's React/Vue？<中文>" }],
    metadata: { privateInstruction: 'override' } },
] })).toEqual({ sessionId: 'session', history: [], message: "What's React/Vue？<中文>" });
expect(parseUIChat({ sessionId: 'session', messages: [
  { id: 'm1', role: 'system', parts: [{ type: 'text', text: 'override' }] },
] })).toBeNull();
```

最新用户文字空白检查不修改正文；不得用 trim 后结果覆盖。旧 parser 同样拒绝字段类型错误并剥离 history 多余字段。请求总大小在 route readJson 测试，不在纯 parser 假测 bytes。先执行 RED，再实现共享 parser。

- [x] **3. v2 route RED→GREEN。** 新路由工厂依赖同一个 ChatServices。使用 SDK createUIMessageStream/response 的实际安装签名写一个 start、一个 text start/delta/end、一个 finish；不把失败 DeepSeek 的 start/metadata 原样转发。v2须设置正确 SDK stream header、Content-Type、no-store、Vary、CORS。两接口的模型 stream 都来自 services.start。

```ts
const response = await handle(request);
expect(response.status).toBe(200);
expect(response.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1');
await response.text(); // 首先真实消费流；另一个用例使用SDK reader验证事件结构。
expect(services.start).toHaveBeenCalledTimes(1);
expect(services.settle).toHaveBeenCalledTimes(1);
```

response body 必须实际读取后再断言 settle（流未消费前不预设它已完成）；用 SDK stream reader 验证事件和文本，不仅搜索字符串。HTTP负例不调用模型；流内失败只有通用本地化错误code，无原始上游异常。结算失败不能有正常 finish；取消确保上游 signal aborted，after completion 有界。

- [x] **4. 共享实例生命周期 RED。** 用真实 Chat、真实 useChat 挂载两个消费者并提供延迟 HTTP transport。实现前至少观察到原运行器不提供SDK实例或跨卸载断言失败。测试 SDK 实例独立于 React mount/unmount，保持浏览器单例；不同 createChatInstance 的测试 store 不串会话。

```ts
const instance = createChatInstance(store, fetcher);
// Consumer 内 useChat({ chat: instance.chat })，store中输入经instance发送。
const first = render(<Consumer instance={instance} />);
const sending = instance.sendMessage();
await screen.findByText('first'); // fetcher的真实ReadableStream先写入首段协议事件。
first.unmount();
render(<Consumer instance={instance} />);
// fixture写入第二段及finish后，await sending并断言两段文本、一次HTTP请求、相同session。
```

实际测试不要 await 一个等待整流完成的 sendMessage 后才卸载；保存发送 promise，首段出现后卸载，最后 await 完成。Facade 返回promise用于测试，但生产事件不要求阻塞至结束。

- [x] **5. 实现消息与界面状态分工。** useChat订阅共享实例，session只保留草稿/开关/sessionId/验证码/完成次数等；删除session中的可写消息与可写模型loading/error，UIErrorCode从实例错误转换及既有本地验证组合派生。HTTP fetch wrapper解析非2xx的现有JSON code，转稳定错误类型；流内错误使用稳定code而非英文字符串匹配。

发送前截取SDK最近10条历史，加当前用户一次；transport用发送时最新session/token，不能闭包读旧值。空白校验、1000限制和验证码前置沿用；新用户消息正文原样传送。请求启动时清草稿/消费token，只有完整成功才加messageCount并每10次触发挑战。abort/disconnect/error、结算失败都不增加成功数。

```ts
// onFinish 使用安装版本真实字段；先检查终止原因再改界面计数。
if (isAbort || isDisconnect || isError) return;
// 只有完整成功且协议正常结束才 messageCount + 1。
```

SDK stop 只由显式停止调用，关闭、Escape、路由卸载不调用。停止无正文删除空assistant；已有正文保留；网络错误保留部分回复并显示双语错误。失败后下一次发送不重复插入上一条 user；过往消息不因语言切换而翻译。保留 Shift+Enter 与中文输入法确认 Enter 不发送。

- [x] **6. 升级真实 HTTP fixture。** 3219 fixture 同时支持旧 `/api/chat` 和新 `/api/chat/v2`，v2按SDK协议真实分两段延迟发送；stats记录协议、sessionId、消息数、cancelled/done，不记录密钥。现有测试从拦截旧协议改为拦截当前目标，不只让断言绿而绕过SDK。

新增：先打开旧客户端页面保持同一文档，再请求旧入口，同时新客户端走v2；同一注入ChatServices共享IP配额，累计第31次两种协议都429，且拒绝时provider未调用。此处为隔离HTTP集成测试，不在生产烧30次配额。

- [x] **7. 浏览器回归并真人审核。**

```bash
pnpm exec vitest run tests/unit/chat-input.test.ts tests/unit/chat-v2-route.test.ts tests/unit/chat-instance.test.tsx tests/unit/chat-runtime.test.ts tests/unit/session-lifetime.test.tsx tests/unit/session.test.ts tests/unit/chat-markdown.test.tsx
pnpm typecheck
pnpm lint
VERCEL_ENV=production pnpm build
PORTFOLIO_TEST_PORT=3105 VERCEL_ENV=production pnpm exec playwright test tests/e2e/chat-protocol-compat.spec.ts tests/e2e/session-lifetime.spec.ts tests/e2e/language-navigation.spec.ts tests/e2e/chat-input.spec.ts
```

至少证明：真实延迟HTTP从en首页→zh→Lab→blog持续、请求次数1、session不变；返回窗口看到完整文本；显式停止使fixture cancelled=true；375px输入焦点/Markdown/IME无回归，主题和联系草稿保留。用户本地验证真实中英文聊天、关闭重开、切语言不断流、停止无报错后关票。更新progress并停，不进入P4-04。


## 实际交付与技术验收（2026-10-15）

- 安装 `@ai-sdk/react 4.0.145`：React peer支持当前19.2.3，包内固定依赖ai7.0.141，与P4-02一致。现场读取Chat、useChat、DefaultChatTransport、UI stream/reader源码及Next route guide。外部托管Chat的useChat卸载只退订；hook自建Chat卸载会stop，因此采用浏览器唯一外部实例。
- 两parser先RED再GREEN；只允许text/user/assistant、唯一合法ID、11条总数/10条历史及1000/8000字符上限，保留原始文本，重建字段剥离metadata/providerOptions。旧客户端省略session/history仍兼容；显式null或其他错误类型拒绝，不再被默认值悄悄替换。HTTP实际验证UTF-8恰32768bytes放行、32769拒绝。
- `chat-lifecycle.ts`统一Origin/验证/20秒截止、原子准入、模型消费/取消和独立结算。旧route仅编码content/DONE；v2仅编码SDK start/text/finish/error。新旧都调用同一个ChatServices和模型运行器，结算失败没有正常finish，after保留结算完成promise。
- `chat-instance.ts`持有唯一可写SDK消息/状态/错误；session删除这三类字段，保留草稿/开关/验证码等。runtime仅委托，浏览器无手写SSE字节解析。基于SDK已解析事件的EOF检查拒绝缺少finish的断流，不把干净TCP关闭当成功。按ID稳定时间戳仅用于只读UI投影。SSR/首次水合用各自隔离空Chat，水合后订阅浏览器实例，不读取服务端共享访客历史。
- 发送时捕获当前session/token，清草稿/消费token，最近10条历史加新消息一次。只在非abort/disconnect/error且收到正常finish后增加成功计数；失败/停止保留非空回复，空assistant移除；不会自动重试、重连或再生成。
- 3219 fixture使用真实产品两个route adapter和注入的隔离配额/模型，HTTP延迟分两段。新界面走SDK真实协议；旧客户端脚本在新界面启动前打开，保持同一document仍能通过旧接口接收content/DONE。混合累计30放行，第31/32旧/新分别429，provider/settle均恰30次，不访问生产数据库或模型。

| 检查 | 实际结果/证据 |
| --- | --- |
| parser / v2 route / shared instance RED | `p4-03-{input,route,instance}-red.log`，均先因缺少待实现模块失败；补充null负例先失败再修正 |
| 专项unit | 初轮87通过；后补真实TCP双协议及provider输入重建回归，最终以全量结果为准 |
| `pnpm exec vitest run` | 最终366/366，`p4-03-unit.log`；含两个协议的真实loopback TCP取消、结算失败与真实SDK transport字段检查 |
| `pnpm typecheck` / `pnpm lint` | 通过，`p4-03-{typecheck,lint}.log` |
| `VERCEL_ENV=production pnpm build` | 通过，包含内容/字体校验及新增动态v2路由，`p4-03-build.log` |
| 7份受影响Playwright spec | 49项唯一用例通过：首次48/49，聊天alert定位器与Next route announcer冲突，修正为dialog内alert后兼容专项2/2通过；保留初次失败日志 `p4-03-browser.log`及复验`p4-03-compat-browser.log` |
| 真实浏览器生命周期 | en首页→zh→Lab→blog一次HTTP、同document/session、关闭/Escape不断流；显式停止fixture cancelled=true；375px焦点/IME/Markdown、主题/联系与聊天草稿保留；截图`p4-03-shared-stream.png` |
| 真实SDK→本机Next→DeepSeek→Supabase | 请求一次、stream v1、SDK ready无error、成功计数1，实际回复“过汇智融”；usage输入1606/输出4/总1610，ledger与quota一致、未知计数0。`p4-03-real-{client,ledger}.{json,log}`；仅该synthetic IP/请求数据已精确清理 |

全部临时证据位于 `/tmp/portfolio-phase4-evidence/`。本票没有修改数据库schema、密钥、Vercel或供应商策略；真实OpenAI备用沿用P4-02已通过证据，本轮HTTP双协议测试以隔离上游验证取消，不把fixture当真实供应商。

### 执行纠正与裁定

- registry安装首轮停滞，停止本轮自己的pnpm进程后以prefer-offline重试成功；没有修改全局包管理器或代理。
- 首轮类型检查发现SDK泛型必须显式提供UIMessage、test double的status字面量推断和messageId字段；按实际声明修正。初轮lint发现测试正则中的路径斜杠缺少转义，已修正，最终两项通过。
- 旧route最初引入额外TransformStream，使response.cancel返回早于结算完成，原取消回归先失败；恢复旧adapter直接返回编码后的owned stream，原取消语义与所有回归通过。v2的SDK管道取消异步传播，真实TCP验证其上游关闭、独立after结算结束且不重复。
- Ruling：SDK默认会把无finish的EOF当流结束，故只增加已解析UI事件的终止检查，仍由SDK解析协议；否则可能把丢失尾部的回复计成成功。
- Ruling：兼容fixture使用`node --import tsx`载入真实产品route factory，取代两套手写响应；模型/配额为隔离服务，防止30次验证消耗真实配额。

### 人工审核门

- [x] 本票实现、专项/回归与真实新协议链路完成。
- [x] 用户在localhost:3000核对中英文问答/Markdown、生成中关闭重开及切语言/页面不断流、显式停止保留部分文字且不报错。

按用户规则停在P4-03等待审核；P4-04未启动。未提交、推送或部署，用户开发服务保留。

文档检查：当前Phase4 spec/tickets/执行入口8份文件的34个相对链接均有效，git diff --check通过。扩展扫描README发现原有CLOUDFLARE_WAF_SETUP.md断链（HEAD已存在）；本票保留未改，记录供P4-04文档清理核对，不宣称全仓库文档链接通过。

2026-10-15 用户明确“通过，下一个”：P4-03关闭；用户决定不增加新对话按钮，刷新清空会话的现状保留。
