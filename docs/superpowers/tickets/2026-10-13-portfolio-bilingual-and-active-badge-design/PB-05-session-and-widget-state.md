# PB-05：跨语言会话、草稿与组件文案

状态：实现、技术验收及本轮逐项人工审核通过（2026-10-14），等待下一票启动指令。阶段：Phase 3。依赖：[PB-04A API 迁移](PB-04A-api-migration.md)通过。规格：第 3、6、7 节；AC-08、AC-13。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

聊天请求和草稿独立于 locale 页面生命周期，挂载/卸载订阅者不 abort 正在返回的回复。界面全部双语，历史消息和提交消息不翻译。沿用当前 SSE 协议，不在此接 AI SDK、换供应商或改服务端限流。

## Files

- Create：`lib/client/store.ts`、`session.ts`、`chat-runtime.ts`、`src/hooks/useContactDraft.ts`、`lib/i18n/errors.ts`。
- Modify：`src/hooks/useChatbot.ts`、`useTheme.ts`、`src/components/Contact.tsx`、`Chatbot.tsx`、`UpdatesWidget.tsx`、`app/[lang]/layout.tsx`。
- Create：`tests/unit/session.test.ts`、`tests/unit/chat-runtime.test.ts`、`tests/unit/ui-errors.test.ts`、`tests/e2e/session-lifetime.spec.ts`、`tests/fixtures/chat-stream-server.mjs`。
- 补充实现：`lib/client/contact-runtime.ts`、`theme.ts`、`src/hooks/useSession.ts`；补充测试：`tests/unit/contact-runtime.test.ts`、`session-lifetime.test.tsx`。共享 `TurnstileWidget` 支持聊天 action 与卸载失效，`playwright.config.ts` 启动本地流 fixture；字典增加停止回复及验证完成文案。
- Read：`src/types/chat.ts`、`src/utils/chatbot-helpers.ts`、迁移后 `app/api/chat/route.ts` 与 `app/api/send-email/route.ts`，先确认真实 request/error 契约。

## Interfaces

```ts
// lib/client/store.ts：只提供与页面生命周期无关的同步状态容器
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => state,
    setState(update: T | ((previous: T) => T)) {
      state = typeof update === 'function'
        ? (update as (previous: T) => T)(state) : update;
      listeners.forEach(listener => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
```

- `SessionState = { chat: ChatState; contact: { formData: { name: string; email: string; subject: string; message: string }; status: 'idle'|'loading'|'success'|'error'; errorCode: UIErrorCode|null; verificationVersion: number }; theme: 'light'|'dark' }`。版本号让正在显示的旧验证码在异步请求完成后也失效。
- `UIErrorCode = 'generic'|'rateLimit'|'verification'|'validation'|'navigation'`；`getUIErrorCode(status: number, apiCode?: string): UIErrorCode`；`getErrorMessage(code, dict): string` 只输出字典消息。
- `createSessionState(sessionId: string): SessionState`、`getBrowserSession(): ReturnType<typeof createStore<SessionState>>`；后者仅浏览器模块单例，服务端调用拒绝，不能在服务端共享访客数据。
- SSR snapshot 使用固定空状态 `createSessionState('')`，对象引用缓存；挂载后才生成真实 sessionId。React `useSyncExternalStore` 的 getServerSnapshot 与首轮 HTML 一致，getSnapshot 对未改变状态返回同一引用。
- `createChatRuntime(store, fetcher = fetch): { sendMessage(): Promise<void>; abortRequest(): void }`，读取 store 输入/历史，维护自己的 AbortController；浏览器 runtime 仅创建一次。
- useChatbot 原对外动作与状态保持，DOM ref/scroll 行为仍由视图持有；订阅 cleanup 仅退订，不调用 runtime abort。明确 stop 动作才中断，标签页关闭由浏览器终止连接。

## 实现步骤

- [x] 读 Chatbot/useChatbot caller 和现有 unmount abort、Contact 局部状态。先写以下 unit 和 streaming 行为测试，运行确认未实现/现行为失败。

```ts
import { expect, test } from 'vitest';
import { createStore } from '../../lib/client/store';
test('卸载订阅者不丢草稿或后续更新', () => {
  const store = createStore({ input: '草稿', output: '' });
  const detach = store.subscribe(() => {});
  detach();
  store.setState(previous => ({ ...previous, output: '回复继续' }));
  expect(store.getSnapshot()).toEqual({ input: '草稿', output: '回复继续' });
});
```

chat-runtime 测试用真实 `ReadableStream` 返回当前 SSE 内容：先 enqueue 一个 content 事件，退订视图，再 enqueue 第二个事件和 DONE，等待 sendMessage；断言内容完整、fetch 一次、signal 未 abort、sessionId 不变。负例调用 abortRequest，断言 signal 中断且 loading 释放；第二次发送不得与进行中请求重复。

```ts
import { expect, test, vi } from 'vitest';
import { createStore } from '../../lib/client/store';
import { createSessionState } from '../../lib/client/session';
import { createChatRuntime } from '../../lib/client/chat-runtime';
test('卸载订阅者时延迟 SSE 仍完成且只请求一次', async () => {
  let writer!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(controller) { writer = controller; } });
  const fetcher = vi.fn<typeof fetch>(async () => new Response(body));
  const store = createStore(createSessionState('same-session'));
  store.setState(previous => ({ ...previous,
    chat: { ...previous.chat, input: 'hello' },
  }));
  const detach = store.subscribe(() => {});
  const runtime = createChatRuntime(store, fetcher);
  const pending = runtime.sendMessage();
  const encoder = new TextEncoder();
  writer.enqueue(encoder.encode('data: {"content":"第一段"}\n\n'));
  await vi.waitFor(() => expect(store.getSnapshot().chat.messages
    .some(message => message.content === '第一段')).toBe(true));
  detach();
  writer.enqueue(encoder.encode('data: {"content":"第二段"}\n\ndata: [DONE]\n\n'));
  writer.close();
  await pending;
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
  expect(store.getSnapshot().chat.sessionId).toBe('same-session');
  expect(store.getSnapshot().chat.messages.at(-1)?.content).toBe('第一段第二段');
});
```

- [x] 实现容器/浏览器单例/SSR snapshot，把原 sendMessage 读写和解析循环迁到 chat-runtime；保留历史截取、输入上限、verification 计数及错误码，不因 locale 新增请求。保留真正的网络错误记录，UI 不透传内部错误。
- [x] Contact 读写共享 formData/status，异步提交完成与 3 秒提示复位也更新 store，不随页面卸载丢结果；不新增发送请求。Turnstile token 等验证状态尊重原安全失效规则，视图重建不伪造验证。
- [x] 给 Chatbot/UpdatesWidget 注入当前语言 Dictionary 子集，替换标签/加载/错误/aria，消息正文、Git commit message 原样；API 未知错误统一 generic。真实错误码与已有 HTTP status 映射写 unit 正反例。
- [x] 统一主题状态，加小型 head 引导脚本先读保存主题/系统偏好、try/catch 捕获 storage 拒绝；hydration 不抹掉已应用 class，JSX 初始一致，挂载同步主题。挂载两个浮层，检查 SSR session 空值不会触发请求。
- [x] 本地 stream fixture 用 Node HTTP 写第一段 SSE 后延迟第二段；Playwright 将 `/api/chat` 请求 continue 到同协议本地 fixture（配置允许 localhost CORS），不修改产品 API。DOM 脚本只卸载/重挂订阅者的 unit 证据与浏览器延迟流证据分开；PB-06 才完成语言入口整条链路。
- [x] 跑三个 unit 文件、生产构建、session-lifetime 浏览器；localStorage throw 的浏览器反例页面仍可读可切主题。记录真实 API 冒烟与 fixture 区别；不发邮件到他人。

## 验收与交付

不以“provider 在 root”代替生命周期验证。退订/重订后消息、草稿、ID 和流继续，SSR 无数据串访客，主题 storage 失败不白屏。明确 PB-06 尚需用实际语言导航复验 AC-08；Phase 4 必须复用此会话边界，不重新把 AbortController 放进页面卸载清理。

2026-10-14：114 unit、33 browser、生产构建、Next/Node typecheck、lint（0 errors/0 warnings）、git diff --check 通过。真实聊天 UI→API→模型流冒烟成功；跨页提交为测试响应，不冒充真实邮件验收。独立复核发现的验证码过期 P2 已修复并复核关闭。完整证据与保留边界见 [progress.md 的 PB-05](progress.md#pb-052026-10-14)。本票完成后暂停，PB-06 未开始；不提交、推送或部署。

审核修改（2026-10-14）：用户报告 generic 错误并明确选择 DeepSeek，覆盖本票原供应商不变约束，仅更换服务端适配。改为 `DEEPSEEK_API_KEY`、直连 DeepSeek、默认 `deepseek-flash`／可选 `DEEPSEEK_MODEL`，关闭思考模式；聊天协议及会话边界保留。116 unit、构建、typecheck、lint 通过。用户那次 generic 未复现；切换前诊断请求成功不等于已定位原因。真实 DeepSeek 回复等待用户自行配置密钥后复验，原 OpenAI 冒烟和 33 browser 记录不得替代此次供应商真实验收。未修改本地密钥/Vercel env，未部署，PB-06 未开始。

后续审核记录：用户自行配置本地密钥后确认聊天恢复；最近更新、表单草稿、主题、移动聊天以及简历按钮居中修正均已收到局部通过反馈。新增审核回修为助手Markdown渲染与Header贴顶渐进背景模糊；120 unit、构建、typecheck、lint及新增4项生产浏览器测试通过，两项效果仍待用户复看。外部资源网络隔离、测试响应及原完整浏览器证据的范围详见progress.md，不将局部通过扩展为整票或PB-01至05整体批准。

最新人工反馈：用户已确认上述Markdown与导航两项效果通过。聊天跨页流式回复和显式停止的人工确认仍待补齐；PB-05整票最终批准尚未记录，继续暂停，PB-06未开始，不提交/推送/部署。

最终人工反馈：用户对最后补验的跨页流式回复与显式停止也确认“通过”，PB-05本轮逐项人工验收完成。保持暂停，等待用户明确启动PB-06；实际跨语言导航仍在PB-06验收，不将本次审核扩展为PB-01至05全部中文内容审核通过。继续不提交、推送或部署。
