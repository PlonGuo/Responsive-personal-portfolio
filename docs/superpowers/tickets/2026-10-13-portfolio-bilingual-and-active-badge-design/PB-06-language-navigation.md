# PB-06：语言入口、滚动与焦点保留

状态：用户审核通过（2026-10-15，含主题脚本与 Hero 审核回修）。阶段：Phase 3。依赖：PB-05。规格：第 5、7 节；AC-07、AC-08、AC-09、AC-10。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

桌面左下角、移动汉堡菜单切换对应页面，新增浏览器历史，不整页刷新。首页保留章节相对位置，其他页面保留有效滚动位置；失败可重试，不丢原页面和输入。不采用主题涟漪或实验性 View Transition。

## Files

- Create：`lib/i18n/routes.ts`、`lib/client/language-navigation.ts`、`src/components/LanguageSwitcher.tsx`。
- Modify：`src/components/Header.tsx`、`Footer.tsx`、`MotionSection.tsx`、`app/[lang]/layout.tsx`、`app/[lang]/error.tsx`、`app/globals.css`。
- Create：`tests/unit/language-routes.test.ts`、`tests/e2e/language-navigation.spec.ts`。

## Interfaces

- `getLanguageTarget(current: URL, target: Locale): string | null` 返回 path+query+有效 hash；只支持 home/lab/blog，对英文文章返回 `/zh/blog` 并清理文章 hash，未知路由 null。
- `ScrollSnapshot = { source: string; target: string; y: number; sectionId?: SectionId; sectionRatio?: number; hash: string; focusId: string }`。
- `captureScroll(source, target, focusId): ScrollSnapshot`、`restoreScroll(snapshot): void`；首页以当前章节顶部偏移/章节高度比例恢复，再 clamp；其他页 y clamp 到新文档范围。按 history entry 保存源/目标快照，popstate 恢复上一语言。
- 浏览器单例导航状态保存 source/target/pending/errorCode，不在 locale 重挂时丢锁；`beginLanguageNavigation(target, router): Promise<void>` 做可达性预检后 `router.push(target, { scroll: false })`；pathname 观察确认到达后恢复滚动/焦点并释放锁，不靠定时器宣布成功。

## 实现步骤

- [x] 先写地址 unit 的正反例，包括保留 `?tag=AI#portfolio`、文章入口、fr/null；浏览器记录切语前后的 navigation document request 数，当前缺入口测试应失败。

```ts
import { test, expect } from 'vitest';
import { getLanguageTarget } from '../../lib/i18n/routes';
test('保留查询和有效锚点', () => {
  expect(getLanguageTarget(new URL('https://plonguo.com/en?tag=AI#portfolio'), 'zh'))
    .toBe('/zh?tag=AI#portfolio');
});
test('文章只有中文目录', () => {
  expect(getLanguageTarget(new URL('https://plonguo.com/en/blog/why-i-chose-cs#intro'), 'zh'))
    .toBe('/zh/blog');
});
```

- [x] 实现 URL path 解析；来源语言校验，hash 仅保留六章节或目标页实际存在的标识。Hash 不传给服务器。普通 section 链接同页滚动、跨页 next/link 到 `/${locale}#section`，移除 window.location.href。
- [x] 实现 snapshot/恢复/历史缓存。不要沿用旧 pathname 一变滚到顶逻辑。顶部偏移考虑 fixed Header；列表筛选 tag 随查询保留。两语 MotionSection 用单标签页入场集合按章节 ID 去重，语言切换不重新播全页；真实首次进入仍可动画。
- [x] 实现 LanguageSwitcher：明确两语言名称/当前项，桌面 `hidden md:block`，菜单内 `md:hidden`；左下角安全区边距，z-index 不压过移动聊天。新增 aria/focus 名称来自字典，桌面不加 Header 语言按钮。选择后关闭菜单，焦点回到菜单触发按钮或桌面入口，目标页焦点不能指向已卸载元素。
- [x] 预取目标，但不依赖预取完成。切换前以可中断的 same-origin HEAD 检查目标（5 秒超时），失败显示当前语言 errors.navigation 并保留源页；通过才 push，阻止重复点击。真实路由错误使用共享 source snapshot 返回源页面/提供 retry，清锁；不得用整页 reload 兜底。实现后验证所安装 Next 的失败行为，若框架仍强制 reload，不能关闭此票或声称满足 spec。
- [x] 浏览器逐个测试首页/Lab/列表切换、后退、章节比例、长文、375px 菜单、Tab/Enter、减少动画。通过注入单标签页 JS marker 和监听 document request，确认未整页刷新；不能只看 URL。
- [x] 使用 PB-05 延迟 SSE fixture：回复中切到中文，最终完整消息、POST 次数=1、sessionId 不变、表单草稿不变。未预取目标时拦截 HEAD/RSC 请求使失败，确认源页和草稿保留、错误可见；解除拦截重试成功。

## 验收与交付

运行 `pnpm exec vitest run tests/unit/language-routes.test.ts`、`pnpm run build`、`pnpm exec playwright test tests/e2e/language-navigation.spec.ts`。记录 actual Next 生命周期、document 请求、延迟流与焦点证据；导航/离线失败路径必须真实验证，不能把 timeout 解锁当成功。满足 AC-07/08/09/10 后关闭。


## 实际交付与验证（2026-10-15）

- 桌面 >=768px 左下角入口；375px 仅菜单；768–1023px 虽仍是汉堡导航，但菜单不重复语言入口。当前语言有 aria-pressed，切换完成及历史恢复后保留焦点。
- 首页保留章节相对位置，Lab/列表保留有效 y，保留 query 和有效 hash，支持后退/前进。移动菜单展开时仅用导航横条高度计算偏移，避免切换后滚动偏移。
- HEAD 预检 5 秒超时。Next 16.4 对真实 RSC（服务端组件页面数据）失败会退回整页导航，已实测复现后加入仅在一次语言切换期间生效的 fetch 保护；传输失败、HTTP 失败、断流或数据错误时恢复原页，可重试。不会拦截聊天/邮件 API。
- 损坏的 Flight 数据即使返回 HTTP 200 仍可能触发 Next 的 document fallback；用浏览器 Navigation API 阻止这次程序性整页跳转，保留源页与草稿。没有该 API 的旧浏览器会显示失败并保留原页，暂不进行语言切换。这是本票明确的兼容边界，需用户审核；不改变普通站内导航或主动刷新。API 背景见 [MDN navigate 事件](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate_event)。
- 预检与路由等待期间修改筛选会取消旧语言请求；点击其他站内页面时按点击意图取消，旧失败不能覆盖新导航。独立复核发现的原 P2 已经 RED→GREEN 复验并关闭。
- Footer 的 Next 链接与 MotionSection 的跨语言 visited 集合已在前票实现，本票复用；不为满足 Files 清单重复修改。新增拆分文件 language-scroll.ts、language-flight-guard.ts 和 LanguageNavigation.tsx，各自负责位置、失败拦截和共享状态展示。Playwright 支持独立测试端口，避免占用用户 dev3000。
- 全套 142 unit、54 Chromium 浏览器测试（其中本票 17 项）、构建、Next/Node 类型检查、lint 通过。包含正常切换、网络/HTTP/损坏数据失败后重试、预取失败、查询竞态、历史位置/焦点、375/768px、实际普通动画下章节不重播，以及延迟真实 HTTP SSE 跨语言连续回复。
- 文档请求始终只有首次进入的 1 次，单标签页 JS marker 保留。延迟 SSE 两次主动发送只有两次 POST，sessionId 一致、连接未被取消；主题、联系草稿和聊天草稿保留。SSE 使用测试 HTTP 服务，不冒充本轮真实 DeepSeek 请求或邮件成功路径复验。
- 已查看 PB-06-mobile-language.png、PB-06-desktop-stream.png。证据与命令输出位于 /tmp/portfolio-bilingual-evidence/；自动化布局测试屏蔽外部字体/图标/验证码，不能作为它们联网可用的证据。完整回归的既有 API 拒绝路径无外部发送副作用。
- 英文文章地址映射已 unit 验证；实际文章页尚未由 PB-07 实现，因此文章内入口端到端未验证。PB-08 字体、PB-09 SEO 不属于本票。
- 无 commit/push/部署，用户 dev3000 保持运行。当前停在 PB-06，等待审核，不启动 PB-07。


## 审核回修：切语言时的主题脚本警告（2026-10-15）

- 用户报告 Next dev 的 React Console Error：RootLayout 的原生主题 script 随语言根参数更新进入客户端渲染。原完整回归只跑 production，未检查这一开发模式警告；此次补上 dev 验证。
- 用真实 localhost:3000 开发服务复现：en→zh 控制台出现相同脚本警告，测试先失败。ThemeBootstrap 改用 Next 公开 useServerInsertedHTML 在初次文档的 head 输出原有同步脚本；useRef 防止同一次服务端流式输出重复插入，客户端组件返回 null，语言导航不再创建可执行 script，也不重新读取存储覆盖当前主题。
- 减少动画模式另复现 Hero 样式 hydration mismatch：服务端保留 opacity/transform 最终样式，浏览器 animate=undefined 导致属性不同。已让 initial=false 的静态目标保持一致；箭头减少动画时固定 y=0，正常偏好仍上下移动。未放宽控制台错误断言。
- 新增 theme-navigation 浏览器两例，同时覆盖 reduce/no-preference；故意把存储值改为 light 后再来回切换、后退，内存中的 dark 仍保持，无脚本或 hydration 警告。开发模式 2/2、完整 production 56/56、142 unit、构建/typecheck/lint 均通过；原“阻止全部 Next JS 后首屏仍为深色”用例保留并通过，没有改为等待 hydration 后才应用主题。
- 静态 en/zh HTML 实测各仅一个可执行 theme-bootstrap，位于 body 之前的 head 中。独立只读复核未发现本次明确 P1/P2，相关7项unit复跑通过。
- 重复开发模式检查：已有 dev3000 运行时，执行 PORTFOLIO_TEST_USE_EXISTING=1 PORTFOLIO_TEST_BASE_URL=http://localhost:3000 pnpm run test:e2e tests/e2e/theme-navigation.spec.ts。默认测试模式仍启动独占 production 服务，不自动复用用户服务器。
- 此回修不提交、不部署，PB-06继续等待用户复验，不开始PB-07。


2026-10-15 后续审核补充：桌面入口视觉契约由PB-07用户审核意见更新为44×44单个目标“中 / EN”按钮；稳定焦点ID为language-desktop-toggle。手机菜单不变，PB-06历史两项桌面入口截图仅作当时证据，后续以spec第7节及PB-07回修验证为准。
