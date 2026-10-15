# 作品集双语迁移验收报告

日期：2026-10-15。分支：`nextjs-migration`；HEAD：`ea8a29a`，本轮及前票尚未提交。

**当前结论（网络恢复后更新）：用户确认全部通过，AC-13真实接口复验通过，PB-10关闭，Phase 3完成。** 用户开启TUN后聊天/Supabase恢复，以下此前失败诊断保留为历史；最新结果见文末“发布前复验”。用户已授权提交、推送及Vercel配置与发布；Phase4独立后做。

用户已逐票审核通过PB-01至PB-09A（含PB-04A），并在本轮明确确认“已核对，都准确”：中文版个人事实、教育/经历/项目及中英文PDF对应关系。最终PB-10整体审核仍待本轮结果。

## 环境与命令

- Node22.22.0、pnpm10.28.2、Next16.4.0，Chromium Playwright1.64.0；单worker，生产服务`http://127.0.0.1:3105`，独立延迟流fixture`:3219`。保留用户开发服务`http://localhost:3000`。
- `VERCEL_ENV=production pnpm build`：通过，先执行内容/字形校验；静态生成六个双语壳、九篇英文文章及九张OG图。无`output: export`。
- `pnpm content:check`、`pnpm lint`、`pnpm typecheck`、`pnpm exec tsc --noEmit`：通过。server类型配置独立于已退役Vite配置，额外覆盖TSX单元测试与浏览器测试，补DOM.Iterable及jsdom类型声明。
- `pnpm test`：209项通过；`PORTFOLIO_TEST_USE_EXISTING=1 VERCEL_ENV=production PORTFOLIO_TEST_PORT=3105 pnpm test:e2e`：108项通过，无跳过或重试。开发模式新增迁移专项4/4通过。
- `BASE_URL=http://127.0.0.1:3105 pnpm fonts:check`：中英文各181024bytes，小于512000bytes，真实Noto字形使用及本站响应均验证；`FONT_BUDGET_BYTES=1`负例按预期exit1，不记为验收失败或忽略。
- 日志根：`/tmp/portfolio-bilingual-evidence/`。本轮`pb10-*`；既有票据`pb01-*`至`pb09a-*`见同spec目录[progress.md](../tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/progress.md)。临时日志不进入Git。

本轮独立Preview：`VERCEL_ENV=preview pnpm build`与`PORTFOLIO_EXPECT_INDEXING=preview PORTFOLIO_TEST_PORT=3106 pnpm exec playwright test tests/e2e/seo.spec.ts`均通过（8/8），证据`pb10-preview-{build,e2e}.log`；随后恢复Production构建，避免留下错误索引产物。

## AC矩阵

| AC | 实现与本轮验证 | 结果及证据 | 人工结论/未验证边界 |
| --- | --- | --- | --- |
| 01 徽章全关 | PB-01/04；content unit、images/migration浏览器，六轮播/十Lab项目 | 通过；所有共享flags=false；8个源码/6个Demo链接两语一致 | PB-01至04及PB-09A用户通过；不代表探测Demo后台健康 |
| 02 临时开关 | PB-01；`migration-acceptance.test.tsx`四组合（两语×有/无Demo） | 通过；两个真实组件SSR开关0→1，链接不变，内容原对象仍全false | 之前PB-01浏览器临时开启/还原已记录；本轮用克隆数据，不修改正在运行的项目配置 |
| 03 内容事实 | PB-02；字典/实体/缺项负例、content:check | 通过；共享ID/年份/数字/链接与翻译分层不变 | 本轮用户最终确认中文事实准确；博客内容不翻译 |
| 04 无JS内容 | PB-03/04；static-shell/localized-pages、禁JS最终PDF验证 | 通过；两语home/Lab/blog初始HTML含主体，HTML lang正确 | 不从localStorage或cookie选语言 |
| 05 路由兼容 | PB-03/07；blog-routing、static-shell、language-navigation | 通过；正式200、旧地址308、无环、旧contact锚点有效 | 所有测试真实HTTP状态，不仅客户端URL |
| 06 英文博客 | PB-07；九篇metadata+SHA-256基线、语义渲染/代码图表、路由404 | 通过；原正文逐字节哈希不变，中文列表明确英文，真实中文slug308、未知404 | 旧源已退役；基线捕获自旧运行时而非当前MDX；人工PB-07通过 |
| 07 无整页刷新 | PB-06；导航/回退/筛选/离线/失败重试；最终全站旅程 | 通过；最终旅程document请求仅1、错误数组空、无Vite运行时；`PB-10-navigation-console.json` | 无Navigation API的旧浏览器保留源页并显示可重试错误，是已确认兼容边界 |
| 08 状态保留 | PB-05/06；独立延迟SSE fixture、取消、草稿/主题与跨文章导航 | 通过；真实本地HTTP流只请求一次、不因换语言中断，会话/草稿保留 | fixture验证生命周期，不当作本轮DeepSeek成功证据；历史用户真实聊天通过另列 |
| 09 移动键盘 | PB-06/07/08；375菜单、768/1440 dock、tooltip焦点、ARIA日志 | 通过；44px入口与焦点关闭顺序维持，应用ARIA/hydration回归无错误 | 逐票视觉审核通过；Cloudflare iframe内部两条已接受警告不归为本站字体错误 |
| 10 动画长文 | PB-06/08/09A；Hero timer、reduce、两语三宽深浅、长技术名/代码滚动 | 通过；无双计时器、页面无横向溢出；`PB-08-*`、`PB-09A-*`截图 | 已有人工作品/移动排版审核，PB-09A本轮之前用户通过；不声明所有浏览器均覆盖 |
| 11 字体 | PB-08；字形/hash校验、真实平台字体、冷缓存及1byte负例 | 通过；两语各181024bytes，0失败字体，预算负例非零退出 | 动态聊天未知字形按规格系统回退；OFL许可保留 |
| 12 SEO | PB-09；禁JS15页、canonical/hreflang/OG、精确sitemap、9图/404 | 通过；Production初始HTML可读，文章无虚假中文alternate；`PB-09-production-*.html`/sitemap/OG | Preview独立构建本轮8/8 SEO通过，随后恢复Production产物；未请求收录或声明排名 |
| 13 构建/API运行 | PB-04A/05/10；真实Next负例、隔离数据库/限流/超时/SSE契约、真实接口诊断 | **通过（网络恢复后复验）**；真实chat200/DONE、无效验证码403、GitHub fresh及cached200 | 追加OpenAI真实备用200；此前503保留为历史，用户确认全部通过 |

## 外部服务与桩的区别

| 层级 | 已验证事实 | 未验证/失败事项 |
| --- | --- | --- |
| 隔离unit | Origin白名单、大小/JSON校验、HTML转义、限流429/数据库不可用503、验证失败403、流式协议/中断/计费异常、GitHub fresh/cache/stale分支 | 使用注入服务或隔离fetch，不能证明线上数据库和供应商可达 |
| 独立本地HTTP fixture | 延迟流、会话稳定、导航不中断、显式取消、表单pending完成一次 | fixture不调用模型或实际邮件 |
| 当前真实GitHub接口 | 正常GET返回200、5条最新提交、`cached:false`，上游fresh已实际通过 | Supabase缓存写入失败，缓存命中/回写本轮未通过；未清缓存或改生产数据制造结果 |
| 当前真实聊天接口 | 合法Origin/正常请求进入限流层，因数据库连接失败返回503；`pb10-real-api.json` | 未进入模型流，当前DeepSeek成功路径未通过，不归因于缺key |
| 当前真实邮件接口 | 缺token403/VERIFICATION_FAILED，未发邮件；含无效token在数据库限流前置503 | 本轮验证码验证/成功发送/收件未重测；未向任何人发送测试邮件 |
| 既有人工真实记录 | PB-04A用户确认Next提交并收到邮件；PB-05用户确认DeepSeek正常及跨页流；PB-09A视觉已通过 | 保留为历史证据；当前503发生后不以历史成功宣布当前可用 |

`pb10-database-diagnostic.json`仅保存变量已配置的布尔值和错误类型，未输出密钥；数据库只读select返回fetch failed。`pb10-network-diagnostic.json`：Node底层ECONNRESET/read、curl退出35连接被重置；稍后`pb10-network-recheck.json`仍为ECONNRESET/read，未取得数据库HTTP响应，尚不能确定是代理/本机网络、网络路径还是服务端的问题。未更改环境文件、数据库、DNS、代理、Cloudflare或Vercel设置；已询问用户本机聊天是否正常。

## 最终独立审查与回修

独立只读审查Critical0、Important1、Minor1。Important为中文输入法候选确认Enter被错误发送：两个真实Chatbot浏览器事件用例先RED（草稿被清空），修复后dev2/2通过；回修后全套Production108/108通过。输入组合期间及结束时的229事件不进入发送；普通Enter发送一次、Shift+Enter保留单行草稿。依据[MDN keydown与输入法事件](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event)同时检查isComposing与229，不通过改后端或吞网络错误处理。测试模拟浏览器事件，不宣称覆盖所有操作系统原生输入法。

Minor为当前执行入口仍要求重复图片优化，已按本票文档交接要求同步为PB-09A完成。审查另以只读AST提取退役备份的原始模板字面量及trim后的正文，九篇SHA-256全部与独立基线匹配，确认不是自比较。无遗留代码审查发现；AC-13外部失败仍独立保留。

## 清理与保留

已退役：Vite HTML/config、旧app/node类型配置、旧全局CSS、旧作品集源、九个旧文章TS及聚合入口、一次性迁移CLI、Vite/React模板图标。删除前逐一查caller，变动前文件备份于`pb10-retired/`，包括用户未提交的旧源内容。`api/`与`vercel.json`已由PB-04A退役，不重复删除；`app/api`和共享`src/api`保留。

直接依赖移除：`vite`、`@vitejs/plugin-react`、`@tailwindcss/vite`、`react-router-dom`、`@vercel/node`、`eslint-plugin-react-refresh`。Vitest仍通过peer依赖使用Vite，不能把lockfile含Vite误判为产品迁移失败。加入`@types/jsdom`用于原先未覆盖的测试类型检查。保留组件/Hook目录、用户原始简历/头像源资产、已暂存的三个图标删除和全部其他用户更改。

旧博客正文不复制成另一份可编辑文章；测试基线只保存元数据与原正文SHA-256。基线文件SHA-256：`757b328679d5547baa0bfa592f4507ad9672b07fe24266ffee2cb22ac204183d`。原迁移转换逻辑只留在`tests/helpers/migrate-posts.ts`用于转义和防覆盖回归，无产品入口/命令。README、旧README-portfolio入口、CLAUDE上下文已更新；使用指南明确标注历史并转向当前文档。

两份PDF本轮HTTP200且文件头%PDF-，用户确认内容/语言对应；英文SHA-256 `a89b35bd7b20fe5a2f9af7592d51addcbe82635572557baded0f96c3ae057c8a`，中文`34a4e5dbd64a41334cba115d28821a11f095aed9936117fe17f3b9f9e3fb09eb`。未重写用户PDF。

## 交接与待办

1. 恢复Supabase网络可达后，复验真实聊天流、联系限流/验证码拒绝路径、GitHub缓存写入与命中；必要时由用户再验证邮件成功收件。保持AC-13未完成，直到有当前证据。
2. PB-10总体审核后，用户另行决定提交/部署；Vercel需Next.js preset、默认输出，去掉旧dist覆盖，系统VERCEL_ENV在构建时可用。本轮不改控制台、不提交、不推送、不部署。
3. Phase4尚未开始；现有DeepSeek连接不等于已迁AI SDK。后续必须保留内存会话、草稿、SSE协议、主动取消和服务端密钥边界，不能因迁移清理重复重写已完成内容。

最终收尾：IME回修后Production重新构建并108/108浏览器通过；unit209/209及最终lint/typecheck/root tsc通过。`pb10-final-{build,production-e2e,unit,typecheck,lint,root-tsc}.log`为最终证据。临时3105/3106/3219服务退出，用户localhost:3000保留。AC-13仍未通过，PB-10保持未关闭，Phase4未开始；没有提交、推送或部署。


## 用户追加：DeepSeek → OpenAI 降级与网络复查

本节是此前 PB-10 结果之后的追加，未改变 AC-13 未通过的状态。

实现：默认 DeepSeek，首内容前失败/空流或等待超过 8 秒后直连 OpenAI，默认 `gpt-4.1-mini`，可用 `OPENAI_MODEL` 覆盖。两家各尝试一次、禁用 SDK 自动重试；已经输出后不拼接回答，取消/总截止时间停止上游。Supabase 限流不变，密钥服务端隔离且未输出/修改。依据 [OpenAI 模型说明](https://developers.openai.com/api/docs/models/gpt-4.1-mini) 和 [Chat Completions 参数](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)。

追加验证：25 项供应商/路由专项、231 项全量 unit、21 项 Production 聊天/API/生命周期浏览器回归、Production 构建、lint、typecheck、root tsc 均通过。初次 RED 10 项失败，首轮类型检查 generator.return 缺参数已修正后重跑通过；无跳过。独立审查未发现 Critical/Important，Minor 的备用输出后取消与计费联合测试已补。日志 `fallback-{red,green,unit,e2e,build,lint,typecheck,root-tsc}.log`。

| 验证 | 当前实际结果 | 边界 |
| --- | --- | --- |
| 真实 DeepSeek 直连 | HTTP200，非空回复 | 服务级验证，未经过 Supabase 限流 |
| 受控主用失败 + 真实 OpenAI | 主用503为模拟；确实向 OpenAI 发起请求，但 ECONNRESET | 备用真实回复未通过，不与模拟回归混同 |
| 真实开发聊天接口 | 503/SERVER_ERROR | Supabase 限流失败，未进入模型 |
| Node/curl 直连 Supabase | DNS成功、URL形状正常，ECONNRESET/curl35，无 HTTP 响应 | 未认定凭证或表权限错误 |
| curl 显式使用当前系统代理 | Supabase REST、OpenAI 均401；请求未携凭证，符合预期 | 证明该网络路径可达，不能证明凭证/表权限/生成成功 |

系统代理已启用，终端未配置代理环境变量。直接路径失败、显式代理路径可达，后续应先让开发服务器使用可达网络路径，例如代理客户端支持的 TUN/虚拟网卡模式，再复验实际聊天/数据库。不要据此重置密钥或重建表。[Supabase 官方网络排查](https://supabase.com/docs/guides/troubleshooting/nxdomain-error-connecting-to-a-supabase-project)也建议比较不同网络/代理；本例 DNS 已成功，不是 NXDOMAIN。

证据：`fallback-live-model.json`、`fallback-live-openai.json`、`fallback-live-route.json`、`fallback-supabase-network.json`。未改系统代理/环境文件/密钥/数据库/Vercel，不提交、不推送、不部署；PB-10 保持未关闭，等待用户审核及真实接口复验。


## 发布前复验（2026-10-15）

用户确认“都通过”，并授权先发布当前迁移，Phase4以后单独进行。本机TUN恢复后真实HTTP聊天200，流式非空并DONE；联系接口无效验证码403/VERIFICATION_FAILED；GitHub首次fresh200、随后cached:true，证明当前数据库读写恢复。受控模拟DeepSeek503后，真实OpenAI请求200且非空，明确主用失败为模拟、备用请求为真实；不故意破坏生产供应商。证据 `release-real-api.json`、`release-real-openai.json`。真实邮件收件沿用用户人工成功确认，本轮不重复发信。AC-13通过，PB-10已关闭，Phase3完成。

发布准备：确认Vercel关联Huizhirong Guo’s projects/jason-portfolio，Production分支main。原framework:null（Other）、outputDirectory:dist；调整为Next.js、pnpm build、默认输出。原已有的五个服务端变量保留，仅为Preview/Production补缺失DEEPSEEK_API_KEY及TURNSTILE_SITE_KEY；凭证由本地进程stdin传递，未输出值。使用临时pnpm dlx Vercel64.2.0，不修改仓库依赖或全局CLI。旧生产deployment id与配置元数据保存至本地release-vercel-before.json，以便回退。当前部署执行中，最终URL与结果以发布交付为准。

发布前最终本地检查：231/231 unit、108/108 Production浏览器、Production构建、typecheck/lint通过；证据release-{unit,production-e2e,build,typecheck,lint}.log。明确路径暂存；原已暂存图标删除与用户简历一并纳入已审核迁移，.claude仅记录已跟踪文件退役，忽略本地配置。
