# 执行进度 — plan: docs/superpowers/plans/2026-10-13-portfolio-bilingual-and-active-badge.md

## 当前发布状态（2026-10-15，覆盖下方历史状态）

用户明确“都通过”，并授权提交、推送迁移分支、配置 Vercel、Preview 验证及 Production 构建发布。PB-01–10 和 DeepSeek→OpenAI 追加验收通过，Phase 3 收尾；Phase 4 未开始。TUN 恢复后复验：真实聊天200且完整DONE；无效验证码403；GitHub fresh200后缓存命中200；受控DeepSeek503后真实OpenAI200非空回复。此前网络失败记录保留为历史，不再是当前阻塞。发布流程为迁移分支Preview验证、main的Production重建；部署状态以Vercel和发布交付为准。

开始日期：2026-10-13。用户已授权按 tickets 顺序实现。代码未经授权不提交、不推送、不部署。

## 当前执行规则（2026-10-13 用户最新要求）

- 每次只执行一个 ticket，完成其实现、验证和结果汇报后立即停止，等待用户明确审核通过并同意继续，才能开始下一个。不得预先编码后续票据，也不得把前置 Task 当作自动继续的例外；前置工作如需单独执行，先明确本次执行范围。审核修改仍归当前 ticket，修正后再次等待审核。
- PB-04A 已获用户审核通过；PB-05 及其审核回修已完成，本轮逐项人工验收均获用户确认通过。PB-06（含主题脚本与Hero回修）于2026-10-15获用户审核通过。PB-07及紧凑语言入口回修均获用户审核通过；PB-08及warning回修已获用户审核通过；PB-09已获用户审核通过；PB-09A图片优化已获用户审核通过；PB-10执行中，中文事实/PDF最终审核已获用户确认；AC-13因当前Supabase连接重置尚未通过。

## 基线

- HEAD：ea8a29a。Phase 1 已有类型、内容、经历提交；Hero/About/Skills/Portfolio/chat prompt 存在用户未提交修改，保留并在此基础上实现。
- `pnpm run build`：通过；现有 JS bundle 507.60 kB，Vite 给出 500 kB 提示，迁移阶段处理。
- `pnpm run lint`：失败，5 errors / 1 warning。useChatbot 未使用 parseError；LabPage 渲染调用 Math.random 四处；UpdatesWidget effect 缺 commits.length 依赖。
- 原 Phase 2 尚无 Vitest/共享安全层，联系接口仍有未转义 HTML；它是 PB-02 的前置工作，不能当作完成。

## 执行判断

- Ruling: 按已批准的原阶段约定，在当前 checkout 执行 Phase 1；Next.js 迁移前切独立分支。不创建额外 worktree，避免丢失用户未提交内容和已暂存删除。代价：必须持续按文件保护用户改动。
- Ruling: PB-01 是用户已批准的可逆低影响开关，遵循票据“不单独引入测试框架”，以浏览器正反例验收；逻辑票据从 Phase 2 起按 TDD 执行。
- Ruling: 新计划以独立票据而非 Task N 标题组织，不使用仅解析 Task N 的 task-start 工具；在本文件保留进度、判断和实际验证证据。
- Pre-flight: PB-01 Project.showActiveBadge → PB-02 元数据，名称一致；PB-02 locale/getter → PB-03/04 props，名称一致；PB-05 单例会话 → PB-06 导航，必须实际证明流式请求不因卸载中止；PB-07 固定英文 getter → PB-09 metadata/sitemap，名称一致。

## Tickets

- PB-01：代码及 AC-01/02 专项验收通过；全站 lint 既有失败待对应票据修复后统一复验。
- PB-02：实现、自动校验及中文事实最终人工审核通过（2026-10-15用户确认）。
- PB-03：静态壳及专项验收完成。
- PB-04：实现、技术验收和只读复核完成；按用户要求已暂停。
- PB-04A：原 Task 13 API 迁移已获用户于 2026-10-13 审核通过；真实 GitHub fresh/验证码重放仍未验证。
- PB-05：实现、技术验收及本轮逐项人工审核通过，包括 DeepSeek 聊天、更新面板、草稿、主题、移动聊天及审核回修；最后的跨页流式回复与显式停止也获用户确认。已暂停，等待下一票启动授权。
- PB-06：实现、技术验收及用户审核通过（2026-10-15，含主题脚本与Hero回修）；未提交。
- PB-07：核心文章/路由及紧凑入口回修均审核通过。
- PB-08：核心字体/排版及warning回修均获用户审核通过。
- PB-09：实现与技术验收及用户审核通过。
- PB-09A：原Task16图片优化获用户审核通过。
- PB-10：执行中，清理/自动验收通过；AC-13当前真实Supabase接口失败，整体未关闭。

## PB-01 验证

- 首页六张轮播全部检查：KnowHive、SmIA、Mom Test、GoChatroom、Travel Agent、Flowboard，徽章数均为 0，源码和 Demo 分支保留。
- Lab：10 项，徽章数 0，Demo 6、Code 8；链接与基线一致。
- 临时分别启用无 Demo 的 KnowHive 和有 Demo 的 SmIA，两页均只展示对应徽章；验证后全部还原 false。
- 浏览器证据：`/tmp/portfolio-bilingual-evidence/PB-01-lab-off.png`、`PB-01-lab-no-demo-on.png`、`PB-01-home-no-demo-on.png`，已查看；SmIA 另外有 DOM snapshot，截图因定位裁切不作为徽章视觉证据。
- 构建通过，修改的徽章/Portfolio/类型/数据 scoped lint 通过；Lab 与全站 lint 仍有已记录基线错误，不宣称全站通过。未验证 Demo 背后服务可用性。

## 原 Phase 2 前置工作

- Task 6：Vitest 5.0.4 与 tsx 4.23.15 已安装，测试配置覆盖 src/api 和后续 unit 目录；安装提示 esbuild build script 未运行，但测试实际运行正常。
- Task 7/8：验证测试由模块缺失失败，完成后 27 项通过；新增 IP 信任边界正反例先失败两项，修正后总计 37 项通过。
- 已只读确认目标 Supabase 项目：contact_rate_limits 尚不存在；本地所需现有密钥均已配置，未打印值。
- Ruling: 原 Task 9 示例把 Turnstile token 设为可选，且限流注释要求原子而代码是读改写。按安全目标修正为必填 token、action/hostname 校验和单 SQL 原子递增；代价是合法请求必须完成验证，不能保留旧绕过行为。
- Ruling: Vercel 上只信任平台覆盖的 x-vercel-forwarded-for；缺失或格式非法时共享 unknown 限流键，不信任客户端伪造的 Cloudflare 头。开发环境保留既有代理头回退；代价是代理后的 IP 精度取决于平台转发配置。
- Task 9：联系 handler 正反例通过，全部 unit 合计 48 项；scoped lint 与构建通过。新增 server tsconfig，使 Node API 与前端检查分开，根 build 同时检查二者；不把 Node 密钥代码引入客户端。
- Supabase migration `portfolio_contact_rate_limits` 已应用；RLS=true，anon/authenticated 无读取权限，anon 无函数调用权限，service_role 可调用。20 个并发 RPC 实测放行 5、拒绝 15；仅清理自己的临时计数键。
- 真正本地 HTTP 检查：缺 token、非法 Origin、无效 token 均 403；没有发出邮件。
- 当时阻塞（后续已解除）：现有 widget `Jason Portfolio Chatbot` 仅允许 `plonguo.com`，本地 `127.0.0.1` 返回 Cloudflare 110200。已只读核对账户/域名，sitekey 与当前配置一致；当时等待用户确认是否添加 localhost/127.0.0.1，未改 widget、未轮换 secret。成功提交后续已有用户验收，重复 token 仍未验证。
- 后续：用户批准增加本地域名，已更新为 plonguo.com、localhost、127.0.0.1；读回确认 sitekey、secret、模式、clearance 与其他设置不变。110200 消失，真实人工验证码显示。
- 用户在本机完成验证并确认“邮件发送成功了”；记录为真实成功提交的人工验收。真实重复 token 拒绝尚未直接复验（验证后 token 已在客户端重置），不把普通无效 token 的 403 当作重放证据。
- Ruling: 等待域名确认期间继续 PB-02 的内容读取、字典和纯数据校验等独立工作；不将原 Phase 2 或成功请求验收标为完成，真实端到端仍是最终关票条件。代价：若用户改变验证方案，需重新核对接线，纯内容结构不受影响。

## PB-02

- 已切新分支 nextjs-migration，保留工作区和原暂存区所有改动；未提交。
- 新测试先因缺模块失败；实现后全套 57 tests 通过，content:check 与原 Vite 构建通过，scoped lint 和 git diff --check 通过。
- 文字按语言和稳定 ID 存放，项目事实/技能/联系信息共用，两套字典完整校验；9 篇文章未改正文。
- 用 pdftotext 读取中文简历，对照姓名、教育、经历、KnowHive/GoChatroom 亮点与数值；清单见 content/portfolio/copy-inventory.md。用户最终页面内容审阅尚未进行。
- Ruling: 校验要求 showActiveBadge 为布尔值，不永久禁止 true；当前全部 false 由数据验收检查。否则未来设 true 无法构建，违背用户快速开关要求。已测试未来 true 合法、字符串非法；代价：徽章真实性由维护者确认。

## PB-03

- Next 16.4.0、Playwright 1.64.0、PostCSS 8.5.30 与 Tailwind PostCSS 4.3.3 已安装，保留 React 19 和 Node 22；Chromium/FFmpeg 已由官方 CDN 安装。npm registry 连接重置后通过重试/缓存完成，没有切换第三方 registry。
- 浏览器 RED：骨架缺 h1、中文 lang 不正确、未知语言返回 200，3 项失败，根 308 对照项通过。实现后生产构建静态生成 en/zh，4 项 browser 全部通过。
- 原 Vite 构建、57 项 unit 仍通过；Next/type/content scoped lint 通过，全站原始 lint 问题尚待 PB-04/05。
- Ruling: Next 把原 src/pages 当 Pages Router，与根 app 冲突；临时改为 src/views，App 引用同步调整，原页面运行逻辑不变。PB-04 完成后退役；代价是历史票据中的旧路径须以实际 src/views 为准。
- Ruling: 使用 tsconfig.next.json 隔离 Next 类型生成，旧 Vite 构建继续用原 references；Next config 明确 tsconfigPath、turbopack.root、outputFileTracingRoot。代价是切默认构建时须同步类型入口，最终清理会移除 Vite 配置。
- 安装 pnpm 依赖时并行写 manifest 导致新脚本被覆盖，已补回并实测 build:next。后续不在依赖安装过程中修改 manifest。

## PB-04

- 首页、Lab、博客列表按 en/zh 静态生成；六章节 ID 不变。组件显式接当前语言 props，博客内容及详情链接固定英文。服务器不向客户端传文章正文或密钥，只有公开 Turnstile sitekey。
- 无 JS 验收先因缺 #home、Lab 404 失败；完成后两语页面可读。Hero 切换文本立即显示首句、旧计时器清理，减少动画偏好时首句完整静止；2 项 fake timer 测试通过。
- 默认 dev/build/start/preview 切 Next；build 执行 content:check 与 Next，新增 typecheck 分别检查 Next 和 Node API。退役 App/main/MainLayout 和临时 src/views（原 src/pages）；Vite 配置、依赖和旧数据最终清理归 PB-10。
- Lab 粒子改确定性索引；项目 key 使用稳定 ID；图标、头像改 public 路径，技能加载失败由 React state 管理。主题以相同 SSR light 初值恢复保存偏好，storage 拒绝时仍可切换；首屏无闪白引导归 PB-05。
- 最新 pnpm run build、pnpm run typecheck、pnpm run test 通过：59 unit tests。pnpm run test:e2e：18/18，通过无 JS、lang、404/308、水合、标签查询与无刷新、主题刷新/storage 拒绝、减少动画、移动导航和 375/768/1440 布局。
- pnpm run lint：0 errors、1 warning；UpdatesWidget 既有 commits.length effect 警告，组件本票未挂载，PB-05 处理。git diff --check 通过。保留原用户修改和暂存删除，无提交/推送/部署。
- Ruling: PB-03 骨架的 h1 是职位，完整 Hero 保留原姓名 h1；静态测试分别检查姓名 h1 和可读职位，不为了旧 fixture 塞隐藏标题。代价：旧断言须跟随真实内容更新。
- Ruling: 截图发现 768px 桌面导航裁切且头像出屏，导航改为 1024px 起展开；小宽度用汉堡菜单，Lab 菜单文字及背景保证可读。语言入口的 768px 分界仍由 PB-06 遵循 spec。375/768/1440 截图及 DOM 边界复验通过。
- Ruling: 清除 useChatbot 未使用的 catch 变量这一既有 lint error，不改聊天协议或状态；聊天接入仍未开始。
- 已检查首页、Lab、列表截图（含修复前后 768px），证据目录 /tmp/portfolio-bilingual-evidence/PB-04-*.png；截图不是中文内容准确性审核，最终中文介绍/经历/项目等待用户审阅。
- 暂时审阅地址：http://127.0.0.1:3000/zh 和 /en，使用生产构建本地服务器；不是线上部署。
- 明确未交付：Next /api/send-email 与聊天接口迁移、聊天/更新浮层及共享草稿、语言入口、文章详情/MDX、统一字体和双语 SEO。Next 页面上的发送邮件暂不能用于提交；用户确认的真实成功来自前面的 Vite + 3001 接口验证，不等同于 Next API 验收。
- 用户要求本票完成后停止；当前已暂停，不启动原 Task 13 或 PB-05。下次只有在用户明确审核通过并同意继续后恢复；原顺序为 Task 13 → PB-05，但仍须遵循逐票审核规则，先明确本次前置工作范围，不能连做两项。

- 只读复核指出减少动画的轮播/程序化滚动漏项，以及小写标签 URL 的选中状态问题；新增回归先确认两项失败，修正后包含这些路径的全套 18 browser tests 通过。Portfolio 减少动画时无退出位移/缩放、零时长；Hero/Header/Footer 使用 auto 滚动，主题跳过 View Transition。复核确认已修复，无剩余阻塞项。
- Ruling: 票据要求项目亮点显示当前语言，故补入原生 details（项目亮点 / Project highlights）；默认折叠维持卡片紧凑，支持无 JS 展开，文案及数值不改。无 JS 首页/Lab 亮点展开验收通过，不因为原组件没显示就遗漏批准范围。
- 未纳入本票的审查项均保留在后续票据：API、共享会话/浮层、语言导航、MDX、字体、SEO、Vite 最终清理。中文最终人工审阅尚未完成；本票技术完成不等于整条迁移可发布。

## PB-04A（原 Task 13）

- 用户澄清为开始实现下一项；授权越过 PB-04 暂停点，但不视为所有中文文案已人工审核。按依赖先执行原 Task 13，以 PB-04A 单独编号，保持同一 spec 目录。只做本票，完成后停止。
- Ruling: 旧 api/_shared 联系安全层先迁入 lib/api，再删除旧入口；不能整体删除 api 丢失复用逻辑。保留当前 api/chat.ts 用户修改的 prompt。
- Ruling: 原聊天数据库写操作未检查 error，读写失败均改为 503 并不调用模型；正常超限仍 429。原并发读改写和 token 近似计数暂不改数据库，风险记录，Phase 4 对应原 Task 17 处理。

- 审查恢复项：历史消息只投影 role/content，丢弃额外 OpenAI 参数；这是与旧 prepareMessages 不一致的输入边界回归，恢复旧契约并用 SDK fetch 替身测试 RED→GREEN，不调用付费模型。
- Ruling: 当前 Chatbot widget 未设置 action，验证器对聊天显式 action=空串时兼容上游空串/省略字段；contact 默认 action=contact 仍严格，不允许联系 token 混入聊天。正反例均覆盖。
- 流取消/异常也等待已有输出的记账；Next after 注册 completion 生命周期，避免 serverless 提前冻结。数据库零行更新也拒绝，不把 HTTP 成功但未更新记录当作配额已保留。


### PB-04A 验证与当前暂停门

- 已从当前工作区迁移三个 API；联系 handler 与旧代码完全相同，用户修改后的 prompt 逐字保留。旧入口/config/harness已删除，自己的 Vite5173/联系3001验证进程已停止，不关闭用户其他 Vite 进程。
- 92 unit、build、Next+Node typecheck 通过；lint 0 errors/1 既有 UpdatesWidget warning。生产 API 与原页面最终回归26项全部通过；git diff --check通过。扫描16个客户端静态文件，未发现现有 Supabase/OpenAI/Resend/Turnstile secret 值。
- 真正 OpenAI 流成功26 content events + DONE；从数据库按本票独有 session 后缀读回 request_count1/token_count26，删除确切自己的 key。首次查询误用了unknown IP前缀，已纠正，Next实际会传入本机IP；未打印密钥或访客IP。更新零行保护后真实SDK读写另测1请求/2计数，同样只清自己的临时key。
- 真实 GitHub 返回200且stale=true；诊断上游403/匿名余额0，不含GITHUB_TOKEN。已告知用户失败，未冒充fresh成功，没有自动创建token或变更GitHub认证。
- 2026-10-13 用户明确确认 Next3002/zh#contact “已发送并收到邮件”；真实 Next 邮件成功路径通过，覆盖人工验证码、提交和收件。真实重复验证码拒绝仍未验证。
- 只读复核无Critical/Important新增缺陷；历史对象多余字段穿透上游的Minor重判为契约回归，按旧行为丢弃多余字段，SDK fetch替身测试RED→GREEN后全套92 unit通过。其余declined边界保留：非原子/可换session/chunk计数、旧SSE客户端处理、浮层/共享会话/语言/MDX/字体/SEO、部署。
- API独立于[lang]，生产localhost Origin拒绝策略未放宽。20秒共享模型deadline+最多10秒持久化预算，取消等待记账并以Next after保留completion；正常提交前后不裸丢计数Promise。
- Next dev3002生成的AGENTS.md为框架自动说明，已阅读；不覆盖用户全局规则，不自动提交。当前只保留3002开发预览用于本票人工审阅。
- 当前票技术实现及真实 Next 邮件验收完成；用户于 2026-10-13 审核通过，freshGitHub/重放未验证项明确保留；PB-05未开始，等待启动指令。

- 此次邮件验收反馈不代表授权开始下一票；继续停在 PB-04A，PB-05 未开始。

- 审核记录（2026-10-13）：用户明确“PB-04A 审核通过”。下一票为 PB-05；本轮仅记录批准，不实施下一票。用户批准不改写未验证测试结果，也不授权提交/推送/部署。

## PB-05（2026-10-14）

- 用户明确授权开始 PB-05；依赖 PB-04A 已人工审核通过。本轮只实施 PB-05，结束后停下，不开始 PB-06。
- 已读 useChatbot/Chatbot、Contact、useTheme/Header、UpdatesWidget 和三个 API 契约。现状请求在 hook 卸载时 abort，Contact 草稿局部保存；需要移出视图生命周期。保持原 SSE、OpenAI、数据库和验证码频率，不改 API。
- 在现有 nextjs-migration 脏工作区继续，保留用户修改及原暂存删除；不提交/推送/部署。

### PB-05 实现与验证

- 会话、聊天草稿/历史/ID、联系表单字段与提交状态、主题改为浏览器单例。固定冻结空 SSR snapshot；真实浏览器数据不进入服务端 HTML，服务端调用访客会话直接拒绝。按 chat/contact/theme 分片订阅，流式消息不让整个页面逐块重渲染。
- chat runtime 独立持有请求与 AbortController；退订、关面板、页面卸载只离开视图，显式“停止回复”才 abort。沿用当前 SSE、历史末 10 条、1000 字上限与每 10 次成功回复验证规则；支持跨网络分块的 UTF-8/JSON、CRLF、DONE/错误事件、意外 EOF、取消后释放输入并保留部分回复。浏览器 runtime 同步拦截并发重复发送。
- Ruling: Contact 的异步完成与 3 秒状态复位也必须脱离组件生命周期，新增 contact-runtime；请求期间编辑的新草稿不会被旧请求成功清空。验证码仍为组件本地值，请求完成递增共享 verificationVersion，避免重挂后的旧 token 重用；不保存 token 到 storage。
- 聊天、更新面板的标签/按钮/时间/状态/aria/错误由当前语言字典提供；聊天正文和原始 Git commit 不翻译。未知 API 错误显示 generic，内部字符串不透传。更新仅用户打开/刷新时请求，不因挂载或翻译启动请求。
- Ruling: 主题 head 引导脚本先于水合应用保存偏好/系统主题，storage 拒绝仍可用。仅 html 对预期 class/style 差异 suppressHydrationWarning，正文及组件仍接受正常水合检查；主题挂载不拿 SSR light 覆盖实际深色状态。
- 移动聊天铺满视口、循环 Tab、Escape 关闭并还原入口焦点，减少动画时不用位移/缩放或平滑滚动；桌面保留原浮窗布局。已查看 375×900 移动截图及 1440×900 深色桌面截图。
- 独立只读复核发现 P2：已解验证码过期时丢失验证门槛。新增真实 hook solve→expire 回归先 RED，恢复门槛后 GREEN；复核方独立运行 3/3，确认该项关闭，其余本票范围未发现确定新 P1/P2。
- 浏览器测试时序修正：跨页邮件测试原来尚在主页就点击 Home 锚点，导致待完成 Lab 导航获胜；现在等待 Lab URL/标题再返回。焦点测试等待弹窗初始聚焦完成后才操作 Tab；专项重复 3 次通过。不增加任意 sleep 或延长产品提示时长掩盖失败。
- 最终验证：单元测试 114/114、完整生产浏览器测试 33/33（1.7 分钟）、Next/Node typecheck、构建、lint（0 errors/0 warnings）与 git diff --check 通过；移动焦点专项另重复 3 次通过。先前两个时序失败均保留上方原因，未跳过测试或启用重试掩盖失败。
- 真实冒烟：2026-10-14 在 Next dev3002/zh 的实际聊天 UI 发出一条英文问题，经现有真实 API/模型流收到完整英文回复，中文界面保留英文正文；截图 PB-05-real-chat.png。控制台第三方 Turnstile 出现字体/调试信息，未观察到本应用水合错误；不将第三方噪声记成“控制台无错误”。
- 测试边界：延迟流来自独立 loopback HTTP fixture3219，确认导航不中断、两个 POST 使用同一 ID、显式停止确实关闭连接；邮件跨页完成使用拦截响应与测试 token，未发送真实邮件。本票没有修改 API；真实 Next 邮件发送/收件仍引用 PB-04A 用户验收，真实验证码重放拒绝未验证，GitHub fresh 限额阻塞仍保留。
- PB-06 实际语言入口/切换链路尚未实施，不能把本票同语言页面导航与真实 hook 卸载测试称为 AC-08 全链路完成。Phase 4 继续复用 runtime 会话边界。证据位于 /tmp/portfolio-bilingual-evidence/PB-05-*.png，非仓库产物；不提交/推送/部署。
- 当前暂停门：PB-05 实现与技术验收完成，等待用户明确审核通过并授权下一票。只保留自己的 Next dev3002 供审阅；浏览器回归用3000与fixture3219已停止。PB-06–10 未开始。

### PB-05 人工审核期间的修改（2026-10-14）

- 按用户要求已停止自己的 Next dev3002/PID44130；用户自行启动的 Next dev3000 不关闭、不替换。
- 用户报告 `Chat request failed "generic"` 并选择不用 OpenAI、改为 DeepSeek；generic 仅为前端通用错误码。切换前在用户本地3000做一次独立会话诊断，HTTP200、23 content事件与DONE、无流错误；本次未复现原失败，不能认定原key失效或错误已修复。
- 用户明确供应商选择覆盖原票“不换供应商”约束。本轮仅服务端适配、针对性测试及使用文档，不进入 PB-06/Phase4。保留 OpenAI-compatible SDK 作为协议客户端，但只读取 DEEPSEEK_API_KEY、固定请求 https://api.deepseek.com；默认模型deepseek-flash，可用DEEPSEEK_MODEL配置，thinking disabled，现有prompt/SSE/限流/会话边界不变。
- 已核对DeepSeek当前官方API文档（https://api-docs.deepseek.com/ 与 /api/create-chat-completion/），不沿用旧模型名。Vercel CLI51.7.0不支持categories，discover deepseek返回空；本次使用用户指定已有供应商直连，不创建付费集成、不切AI SDK。
- SDK transport回归先3项RED再3项GREEN：验证真实目标域名、认证头使用DeepSeek测试key、默认/可选模型、非思考模式、流内容与历史投影；缺DeepSeek凭据时不请求也不回退OpenAI。全套116 unit、构建、Next/Node typecheck、lint与git diff --check通过。浏览器完整33项为切换前证据，本轮未重跑，不冒充DeepSeek端到端成功。
- 未读取/打印本地API key，未更改.env.local或Vercel env，未提交/推送/部署。用户需自行填本地DEEPSEEK_API_KEY并重启开发服务；线上在Vercel配置Secret并在获授权部署后验证。真实DeepSeek成功路径尚未验证，PB-05仍待审核；PB-06未开始。

### PB-05 用户人工审核反馈（2026-10-14）

- 排查配置时只输出本地DEEPSEEK_API_KEY是否存在的布尔结果，当时为false，未输出密钥值。用户随后自行配置并反馈“可以了”，记录为用户确认本地聊天恢复；不将此扩展为所有聊天边界、线上配置或生产部署通过。
- 用户按最近更新面板清单反馈“都没问题”，记录为该面板人工审核通过；GitHub fresh独立验证的历史限制不因此改写。
- 用户确认联系表单经站内首页→实验室→首页后字段“保留的，通过”，记录为联系草稿跨页保留人工审核通过。
- 用户按主题保留清单确认“通过”：深色主题经首页、实验室、博客列表及返回首页保持；深浅主题刷新恢复及无明显先白后黑的观察通过。此项为用户人工验收结果，不替代后续跨语言导航验收。
- 用户确认移动端聊天检查通过；另指出375px下“关于我”的两个简历下载按钮不居中，属于PB-04展示排版的审核回修。容器补justify-center sm:justify-start，窄屏换行后每个按钮居中，640px起沿用左对齐。
- 居中问题修复前375px中文按钮中心分别为94/110px；修复后中英两页均约187.5px（视口正中），1440px仍flex-start且无横向溢出，下载链接保留。已查看中英按钮截图PB-05-resume-{zh,en}-375.png；scoped ESLint与git diff --check通过，未为单个样式类新增单元测试或重跑无关API。gstack首次复查导航超时，HTTP200后改用直接Playwright完成实际浏览器验证；修正效果等待用户复看，未提交/推送/部署。
- 用户随后明确反馈“通过”，简历下载按钮375px居中修正人工审核通过。继续保留未提交修改；局部批准不自动启动PB-06，不替代PB-01至05其余未明确确认的验收项。
- 用户明确要求改完后再一起提交，避免触发Vercel同步；继续不commit、不push、不部署，不自动开始PB-06。上述局部通过不等于PB-01至05全部人工审核通过。

### PB-05 / PB-04 审核回修：聊天 Markdown 与贴顶渐进模糊导航（2026-10-14）

- 用户在继续审核时明确要求两项调整：AI回复中的Markdown正确渲染；导航取消顶部空隙、覆盖内容高度模糊，接近导航时逐渐模糊。只处理现有聊天展示和导航外观，不进入PB-06语言入口或Phase4重构。两项人工复验待用户。
- 根因：MessageBubble把所有回复放进纯文本p；Header原为top-4/left-4/right-4悬浮圆角块，滚动后统一glass blur20。已先读Header/Chatbot caller与全局CSS，保留其他已审交互、主题及用户改动。
- 新增独立memo ChatMarkdown，react-markdown10.1.0 + remark-gfm4.0.1处理助手回复的粗体、编号/列表、代码、链接及表格；用户消息仍为原始文本，会话与发送历史继续保存原Markdown，不把HTML写回历史。代码/表格在气泡内横向滚动；跳过原始HTML、保留库默认URL过滤、关闭外部图片、外链noopener。依赖npm registry出现超时/重试，最终安装成功；未批准新的依赖构建脚本。
- Header改top-0/inset-x-0全宽，保留内层导航宽度与原移动菜单。装饰层无指针事件，使用8/24/48px背景模糊与不同渐变遮罩，向下4rem衰减；导航自身清晰可点击，Lab/深浅主题保持对应底色。无背景模糊支持时使用实色回退，不修改正文filter或增加滚动逐帧计算。
- Markdown回归先因缺失组件RED，完成后4/4 GREEN：用户提供的第8条粗体、代码/表格/链接、HTML及危险URL/远程图像、未完成流式标记后补全。全套120 unit、构建、Next/Node typecheck、lint、git diff --check通过。
- 新增review-polish浏览器4项通过：375px真实聊天组件+SSE测试响应渲染Markdown，用户原始星号保留，长代码不撑出视口；375/768/1440px导航top=0、满宽、无横向溢出，深浅主题滚动截图及导航进入Lab成功。已查看手机聊天及两主题导航截图，证据PB-05-markdown-mobile.png与PB-05-navbar-{width}-{theme}.png。
- 浏览器验证使用独立生产3105，未占用/关闭用户dev3000。临时配置首次因cwd位于/tmp而启动失败，补repo cwd后运行；首次4项有1项goto等待load超时，trace确认SimpleIcons/Google Fonts/Turnstile网络未完成。新增布局测试显式屏蔽这些外部资源并等待DOM后4/4通过（3.5秒），不冒充外部字体/图标/验证码可用性验证，也未发真实DeepSeek请求。本次未重跑此前完整33项，保留其历史证据。
- 继续不提交、不推送、不改Vercel配置、不部署；保持用户本地审核服务运行。
- 独立只读复核未发现确定P1/P2，确认Markdown HTML/URL/图像边界、窄屏滚动和导航模糊层点击隔离；复核方另跑Markdown单测4/4通过。用户dev3000实际HTML返回200且含新版贴顶Header；效果等待用户审核。
- 用户随后明确反馈“通过”，记录为助手Markdown渲染及贴顶渐进模糊导航两项人工审核通过。此前被显示问题打断的聊天跨页流式回复与显式停止仍未收到单独通过结论；不把本次局部批准扩展为PB-05整票或PB-01至05全部批准，不启动PB-06，继续不提交/推送/部署。

### PB-05 本轮人工审核完成

- 用户对最后补验的“回复过程中跨页不中断”和“显式停止回复后可继续输入”明确回复“通过”。结合前面的逐项通过反馈，记录PB-05本轮人工验收完成，包括本地DeepSeek聊天、更新面板、联系草稿、主题、移动聊天、简历按钮居中、Markdown与导航效果。
- 当前暂停门：PB-05已通过本轮审核，等待用户明确启动PB-06；本轮不实施下一票。用户要求全部改完后再统一提交，继续不commit、不push、不部署、不改Vercel环境变量。
- 该结果不代表PB-01至05全部内容审阅通过；中文内容最终审核、PB-04A保留的GitHub fresh与验证码重放、PB-06实际语言切换链路和后续字体/SEO仍维持原状态。

## PB-06 开始（2026-10-14）

- 用户明确授权实现PB-06；只做本票，完成后等待审核，不开始PB-07。不commit、不push、不部署、不修改线上配置，保留nextjs-migration当前未提交和已暂存改动。
- 已读spec第5–7节、PB-06票据、全局约束和现有Header/Footer/根布局/会话/博客筛选caller；开工120 unit通过。
- Pre-flight: PB-05浏览器单例与runtime供PB-06导航复用，接口一致；MotionSection已有按章节ID共享visited集合，保留；Header原1024px才展开，语言入口按批准规格768px区分，因此768–1023px只有左下角语言入口，菜单内不重复。
- 调查风险：已安装Next16.4的RSC请求失败可能自动退回document导航；HEAD预检本身不能证明请求开始后失败仍保留状态。先验证真实行为并实现失败保护，不能仅靠URL变化宣布无刷新。


## PB-06 交付，等待审核（2026-10-15）

- 只实施 PB-06。语言来自 URL；共享客户端导航单例在 locale 切换后仍持有锁、源/目标与 history entry 快照。入口遵守 >=768px 桌面左下角、<768px 仅汉堡菜单，无 Header 桌面重复入口。
- 完成对应首页/Lab/列表地址解析、有效 hash/query 保留、文章到中文目录的纯函数映射、章节比例或页面 y 的恢复与边界限制。后退/前进恢复位置与入口焦点；移动菜单展开高度不参与顶部偏移计算。
- Ruling：HEAD 5秒检查只能证明预检可达，不能防止之后的 Next RSC（页面组件数据）失败。实际安装的 Next16.4在 RSC 拒绝后会强制 document 导航；先用 marker/document计数复现，再加入短期 fetch guard。仅限该次语言目标的非预取 RSC，请求克隆先读完整，保留原 Response 身份/URL；聊天与邮件请求不受影响。失败后 supersede 原 transition，保留原页并显示当前语言错误/重试；10秒内未完成仅判失败，不按计时器宣布成功。
- Ruling：HTTP200 + text/x-component 也可能含无法解码的损坏数据。额外用 Navigation API 捕获该目标的程序性 document fallback，取消后回到源导航。真实浏览器已验证无 document 新请求、JS marker/联系草稿保留，解除拦截可重试成功。无 Navigation API 的旧浏览器不开始语言导航而提示失败，保证输入不丢失；这是提交审核的兼容边界，不是已完成全部旧浏览器支持。保留主动刷新/新标签/普通站内链接行为。实现依据与兼容说明见本票 MDN 链接；未来升级 Next 需重跑失败用例。
- 独立复核发现 P2：预检期间修改博客 tag 后旧目标会覆盖新选择。新增回归先失败；修正为完整 source URL 校验、portfolio-query/hashchange 取消、路由中 query 变化用最新地址 supersede；另补普通链接 capture intent 和 generation 校验，防止旧语言失败覆盖尚未提交的新页面导航。三个专项浏览器用例先失败后通过，追加路由等待时改筛选用例通过。
- Ruling：Footer 已有 Next 链接，MotionSection 已有单标签页按章节 ID 的 visited 集合，复用而不为清单重复改写。新增分离的 scroll/flight guard/controller 文件保持职责清晰；Playwright/fixture 可选测试端口与 CORS 来源，只用于生产3105的隔离测试，未改线上 API CORS。
- TDD：初始缺语言入口 RED；地址9项、滚动3项、导航5项、flight guard5项通过，共新增22 unit，含非法地址、重复点击、可达性失败重试、筛选竞态、旧浏览器与程序性 fallback/主动导航区分。修正过焦点早于 disabled 解除、移动菜单高度影响比例两项真实失败。
- 最终验证：pnpm run test => 142/142；pnpm run build => content校验与Next静态构建通过；pnpm run typecheck、pnpm run lint、git diff --check 通过。PORTFOLIO_TEST_PORT=3105 pnpm run test:e2e => 54/54（1.4分钟），含原有37项与PB-06新增17项；无跳过或重试通过。测试日志：/tmp/portfolio-bilingual-evidence/pb06-{unit,build,e2e}.log。
- 浏览器证据：正常语言切换和网络/HTTP/损坏Flight失败均保留单标签页 marker、document请求数=1；未预取目标的失败可重试。首页/Lab/博客列表、query/hash、历史滚动与焦点、375px菜单Enter、768px入口互斥、普通动画下已见章节不重播、减少动画与长内容无溢出均覆盖。已查看手机菜单与桌面聊天截图 PB-06-mobile-language.png / PB-06-desktop-stream.png。
- 延迟真实HTTP SSE fixture：回复途中 en→zh→en，两个主动发送对应两个请求、同一 sessionId、连接未 abort，完整回复与聊天历史/输入、联系草稿、深色主题保留。本轮未发送真实 DeepSeek/邮件，PB-05人工验收证据仍独立保留；新语言测试屏蔽外部字体/图标/验证码，不能代替这些服务可用性验证。
- 独立只读复审：原P2关闭，未发现新增明确P1/P2；复审方复跑语言22 unit通过，未独立重跑浏览器，实际全量浏览器由主实现者运行并读取输出。
- 未验证：PB-07尚未建立文章页面，文章内部语言入口只完成映射unit，端到端留待PB-07；字体/SEO留PB-08/09。旧浏览器缺少导航拦截能力时只能保留源页提示失败，待用户审核是否接受；不宣称全部浏览器兼容。
- 用户dev3000/PID42234保持运行。Playwright临时生产3105和fixture3219已退出；不commit、不push、不部署、不动线上环境变量。审核门：PB-06等待用户审核，PB-07不得自动开始。


## PB-06 审核回修：主题脚本与开发模式警告（2026-10-15）

- 用户真实反馈 en→zh 时 React 报 RootLayout 第31行原生 script 不能在客户端渲染。此前54项仅在 production执行，遗漏dev警告；保持PB-06审核门，不进入PB-07。
- 已读主题bootstrap/applyTheme/session使用方、根布局与Next16.4本地script/CSS-in-JS指南及server-inserted-html实现。原生head script在语言根参数更新时进入React客户端树；主题只应在首次HTML解析时执行，此后依赖已有会话主题。
- 新theme-navigation回归在真实用户dev3000复现同一警告后RED；新增ThemeBootstrap，以公开useServerInsertedHTML服务端插入原常量脚本，useRef避免多flush重复，组件客户端输出null。没有延后首次主题执行、没有改用hydration后的effect或重新执行脚本。
- 同一reduce回归揭示另一条真实Hero样式hydration警告：SSR最终opacity/transform与CSR animate=undefined不同。读取其首页caller后，只调整initial=false的静态最终目标两端一致，减少动画箭头固定y0，正常动画保留。控制台断言未忽略此警告；两种系统动画偏好均测试。
- 初次用127.0.0.1连接现有dev服务时HMR握手失败，未完成hydration，属于复现环境失败；改为与用户一致的localhost后完成真实复现。Playwright新增显式baseURL/reuse-existing环境选项，默认production独占逻辑不变；不关闭用户服务。
- 开发模式回归2/2 GREEN：en→zh→en及后退无脚本/hydration警告，故意改变存储为light也不覆盖live dark；development marker初始化后才操作，避免把未hydration点击当作结果。独立复审未发现明确P1/P2，相关7 unit复跑通过。
- 最终验证：142/142 unit；content校验/Next构建、Next/Node typecheck、全站lint、git diff --check通过；全量production browser 56/56（1.8分钟），包括原有全部54例与新增2例，无跳过/重试。阻止全部NextJS的首屏深色测试未放宽且通过。en/zh静态HTML各只有一个可执行bootstrap，实际在head、body之前。
- 证据：/tmp/portfolio-bilingual-evidence/pb06-theme-dev-{red,green}.log、pb06-theme-{unit,build,e2e}.log。dev命令见PB-06票据。production测试临时服务已退出，用户dev3000保持运行；不发真实聊天/邮件、不改线上配置、不commit/push/部署。PB-06回修完成等待用户复验，PB-07未开始。


## PB-06 用户审核通过（2026-10-15）

- 用户在主题脚本报错与Hero样式警告修正后明确回复“通过”，记录PB-06及本次审核回修人工验收通过。此前技术验证和旧浏览器兼容边界保持原记录，不扩展为未执行项目已验证。
- 当前审核门：等待用户明确启动PB-07；本次仅更新状态，不实施下一票、不运行新的产品改动，不commit、不push、不部署。


## PB-07 开始（2026-10-15）

- 用户明确授权开始PB-07；只实施英文博客迁移及文章路由，结束后等待审核，不开始PB-08、不commit/push/部署。PB-06及回修已审核通过。保留nextjs-migration既有未提交和已暂存内容，沿用当前隔离分支，不另开工作区丢失前票成果。
- 已读票据、spec、计划全局约束，核对四个blog getter及首页/列表/卡片/语言入口caller；基线142 unit通过。迁移前把九篇实际运行时对象写入/tmp/portfolio-bilingual-evidence/pb07-original-posts.json，记录逐篇正文SHA256，保留原TS源。
- Pre-flight：PB-02四个getter签名保持不带locale，PB-04客户端只接metadata；PB-06文章中文目标已有映射，但入口仍需明确“中文目录”名称。PB-09将消费同一份英文内容与manifest，不提前实现SEO。
- Ruling：按票据采用next-mdx-remote6.0.0，保留默认禁用JS表达式的安全选项，只编译git内可信MDX；该上游于2026-04归档，版本及长期维护限制在交付记录中披露，不扩展为远程内容执行。rehype-pretty-code0.14.5支持Shiki1–4，选当前Shiki4.5.0，Node22满足其>=20要求。

- PB-07阶段结果：转换/读取19项及九篇语义渲染+综合格式10项，共29 unit通过。保留MDX正文精确字节；gray-matter会缓存解析结果，已用深复制保持getter隔离（真实mutation用例先失败后通过）。高亮器grid默认给空行补空格，改grid=false保持代码/ASCII复制内容不变，四个真实渲染差异修复后通过。CLI首次调用漏传posts参数导致失败，已修正并成功重跑。
- Ruling：Next16.4实测不能按票据示例在zh子分支返回[]。源码generateRouteStaticParams会保留不完整父参数，hadAllParamsGenerated=false从而跳过全部文章静态输出；诊断确认en返回9个slug、zh返回[]，构建成功但所有英文文章404。采用官方bottom-up参数枚举：根布局保持共享，移除其参数枚举，home/lab/blog叶子各枚举en/zh，article叶子只枚举完整{lang:en,slug}。没有在zh父分支覆盖lang；对外地址与静态语义不变。代价：未来新增叶子页须明确声明其静态语言集合；避免为zh构建无用404文章占位或启用动态fallback。


## PB-07 实现完成，等待审核（2026-10-15）

- 九篇MDX保真迁移及server-only文件getter已完成，中文卡片保持英文标记，文章只输出英文界面/正文，桌面/菜单明确“中文目录 / Chinese index”。精确中文跳转仅来自九项manifest，未加zh通配规则。
- 最终验证：171/171 unit、content校验、构建、Next/Node typecheck、全站lint、git diff --check通过。完整production Playwright63/63（1.8分钟，新增7项），另用户dev3000的文章与主题专项4/4通过。无跳过或重试通过；29项新unit包括九篇字节/metadata对照、迁移不覆盖编辑和九篇渲染语义保真。
- 生产真实状态检查：九篇en200，九个已知zh和九个legacy第一跳308且query不丢，未知slug/fr/无效后缀/额外路径404；禁用JS逐篇可读。prerender-manifest恰好9个en文章、0个zh文章正文。bottom-up调整见上方Ruling，未来新增叶子页须显式枚举语言。
- 浏览器：中文列表→英文文章→中文目录保留单文档；手机375代码块内部滚动、Enter菜单与返回焦点通过；旧/#contact重定向后锚点保留。真实延迟SSE进入文章再切zh目录仍完整返回，1次POST、sessionId非空、连接未取消，回首页表单草稿保持。仅测试HTTPfixture，不调用真实DeepSeek/邮件。
- 已查看PB-07-mobile-article.png、mobile-ascii.png、desktop-dark-code.png与desktop-dark-table.png。ASCII scroller478/341px、scrollLeft100、页面总宽375，深色代码背景与token颜色正确。所有原文链接文本/href与渲染结构自动对照；没有真实图片的文章不假造图片证据，图片/嵌套列表用独立format fixture验证。外部字体/图标/验证码被专项测试屏蔽，不能据此声称这些联网服务可用。
- 独立只读复核：无确定P1/P2、无阻挡minor，独立运行29 unit通过并核对静态路由集合；bottom-up符合已安装官方指南。其未独立执行浏览器/build/typecheck/lint，这些结果来自主执行者本轮输出。Declined项裁定：PB08字体、PB09 SEO仍未实施；DeepSeek/邮件/GitHub/验证码不作本票新验收；原外链目的站点可用性未测，仅保真；旧浏览器导航限制沿用已审PB06，无扩大兼容声明。
- 完整原对象快照/migration hashes、RED和GREEN日志、全量日志位于/tmp/portfolio-bilingual-evidence。迁移命令再次执行成功且未改变目标文件。pnpm提示忽略esbuild构建脚本，但tsx迁移/content:check与构建/测试实际成功，未批准额外依赖脚本。一次tsx -e诊断因CJS与ESM包导出不兼容失败，改原生node ESM后诊断成功，不是产品路径。
- 审核门：PB07实现完成，等待用户审核；PB08不得自动开始。保留用户dev3000与全部未提交/已暂存改动，临时3105/3219测试进程退出。不commit、不push、不部署、不修改线上配置。


## PB-07 审核回修：桌面紧凑语言入口（2026-10-15）

- 用户明确回复PB07“通过”，并提出现有左下角两项入口及文章“中文目录/Chinese index”过宽遮字，要求单个按钮直接切换、切换后图标变化。核心文章/路由记录为人工通过；按其给出的具体单按钮方案做bounded回修，不另建架构票、不开始PB08。
- 设计：仅桌面>=768改44×44单一入口，显示目标“中 / EN”；文章页同样紧凑“中”，完整“中文目录 / Chinese index”由ARIA名称及悬停/键盘焦点提示表达，仍进入中文目录，不声称文章翻译。手机菜单保留直接两语言选项。提示Esc关闭。
- 已先读根布局/Header/LanguageNavigation/controller及测试caller；单按钮必须使用稳定language-desktop-toggle作为focusId，不能随目标语言换ID，否则切换后旧目标ID消失会丢焦点。菜单继续mobile-menu-toggle。现有测试仅更新选择器与单按钮契约，保留失败/重试、历史、滚动与延迟SSE断言。
- 新compact两个真实浏览器回归在旧UI因2个按钮/文章永久长标签失败RED；完成后开发模式6/6通过（含旧主题两模式与文章手机入口）。首次typecheck发现菜单分支仍比较已排除desktop的类型，已消除无效判断；单元171通过，typecheck/lint通过。
- Ruling：本地Next默认左下角开发角标实际拦截新按钮点击，真实dev测试因此30秒失败并记录nextjs-portal拦截。按已安装Next公开devIndicators:false配置隐藏角标；编译/运行错误仍会显示，不用强制click绕过测试。配置后真实鼠标点击、键盘Enter、后退焦点与提示Esc均通过。其影响仅开发角标显示，不改变线上页面。


## PB-07 紧凑语言入口回修验证（2026-10-15）

- 按用户审核意见，桌面入口改为44×44单个目标语言按钮：英文页“中”、中文页“EN”；文章页为真实中文目录链接，完整名称仅在无障碍名称及悬停/键盘聚焦提示中呈现，Escape关闭提示。手机菜单保留原两项。规格第2/7节已同步用户的新决定。
- 入口与导航恢复共用稳定language-desktop-toggle焦点ID；切换中button disabled、文章Link inert，导航单例在异步开始前加锁。保留原历史、滚动、错误恢复及聊天/草稿契约。隐藏Next开发角标以消除实际点击遮挡，编译/运行错误仍可显示。
- 最新验证：171/171 unit、content:check及生产构建通过；最终typecheck/lint通过。完整production浏览器65/65（1.9分钟）、真实dev专项6/6（8.1秒）通过，无跳过/重试。两个compact用例先RED后GREEN；独立只读复核未发现确定P1/P2，并另跑22项语言unit通过，未独立跑浏览器或build。
- 已查看浅/深色PB-07-compact-{light,dark}.png，入口实测44×44、左距24px，不再常驻显示宽标签。证据：/tmp/portfolio-bilingual-evidence/pb07-toggle-{unit,build,e2e,dev,typecheck,lint}.log。
- 用户随后说明仅每秒快速点击三四次时偶见闪烁，正常点击没有；按其反馈不追加动效或架构修复。检查确认现有切换期间锁，并重新运行language-navigation单测5/5通过（包括重复选择只发一次HEAD/一次push）。这不等于复现或修复连点视觉闪烁；该现象作为非阻塞观察保留。正常切换的document请求数=1由浏览器用例验证，不是整页刷新。
- 核心文章/路由审核已通过；本次入口回修完成，停止等待用户复验。不开始PB-08，不commit/push/部署、不改线上配置；不发真实聊天或邮件请求，保留用户开发服务与全部已有改动。


## PB-07 通过，PB-08 开始（2026-10-15）

- 用户明确“通过，下一个”，记录PB-07及紧凑语言入口回修人工审核通过，并授权仅开始PB-08字体/排版；原Task16图片优化另票/后续串行，不随本次自动执行。
- 读取票据、spec第7/8节、共享根布局/CSS及受影响组件调用处；沿用nextjs-migration已有隔离分支，保留全部未提交及已暂存改动。不commit/push/部署、不改线上配置、不进入PB-09。
- 按先字体预算负例→next/font实测→必要时本地子集→排版/失败回退→构建与浏览器的顺序执行。验证记录存/tmp/portfolio-bilingual-evidence/pb08-*。

### PB-08 中间验证与裁定

- 预算unit脚本先RED后GREEN；原页面浏览器检查因Google运行时请求/中英字体混用如期失败。next/font/google构建下载失败；Ruling：用已批准的next/font/local静态子集兜底，消除日常构建联网依赖，代价是新增未覆盖字时需按文档更新字体，不能删除文案或提高预算。
- 原始TTF经GitHub API blob下载（raw/CDN连续连接重置，已停止失败重试），核对Git blob SHA-1及TTF SHA-256；固定来源、完整OFL和重建脚本随字体保留。两份实际cmap各705字符；仅▸和👋可走系统符号/emoji字体，全部静态汉字/拉丁字母/数字/标点由两份子集覆盖。
- 真实中文375px测试因段落行高不足先失败；调整中文p/li行高1.75、允许长技术名安全换行、移除Lab静态UI等宽与大字距后通过，代码仍等宽和内部横向滚动。
- typecheck首次发现mjs测试导入缺声明TS7016，已添加明确d.mts类型并通过；没有用any或关闭检查。
- 初次dev字形布局12项通过但6项字体阻断后的主题点击失败；诊断证实127.0.0.1访问用户localhost开发服务被Next开发资源/HMR来源保护阻断，history为空且React事件未挂载；localhost同条件正常、生产模式也正常。Ruling：以用户的localhost域名完成dev验收，不为测试扩大allowedDevOrigins；测试增加实际hydration标记等待，避免只靠静态HTML宣称交互可用。
- 第一次生产82/83，其中1项context.close时产物ENOENT；原因是同时启动第二套Playwright清空共享outputDir并占用fixture3219，属于执行失误而非产品断言。改为串行并独立outputDir，完整83/83（1.2分钟）通过，再dev localhost的字体18项+原主题2项20/20（28.8秒）通过。
- 独立只读复核确认实际cmap/400与700字重、OFL/保留名、按文档重建逐字节相同，专项unit9/9，无确定P1/P2。提出无扩展名字体URL漏计minor；Ruling：该项涉及本票预算脚本“全部字体同源并实测传输”的已批准契约，按验收工具缺口本票修复，不留假通过边界。增加外域无扩展URL用例先RED；按实际font请求URL集合统计，实际HTTP无扩展字体fixture也测得89572bytes并通过。
- 人眼查看中文375经历截图发现新字体使32px年份圆点内的4位年份折行；保持本票内修正并加真实浏览器回归，不进入后续图片/SEO票。


## PB-08 实现完成，等待审核（2026-10-15）

- `lib/fonts.ts`以next/font/local提供Noto Sans SC 400/700，根布局只添加共享CSS变量，theme/live navigation不重建。app/globals.css移除Google运行时import，标题/正文/控件统一；中文p/li行高1.75，长token可换行；Lab标签/说明/技术标签改统一字体，pre/code保留等宽与横向滚动。
- 来源/许可/重建：public/fonts两份WOFF2、OFL、README、manifest；scripts/font-characters.ts收集全部静态来源，scripts/subset-font.py固定上游hash和FontTools/Brotli版本。content:check纳入实际二进制哈希与静态字形覆盖；字体更新只需开发时用uv，正常Node构建无Python/Google依赖。代码注释亦收集，可能略增加重建频率，当前预算充分，不增加解析器。
- 最终文件大小：400为89572bytes，700为91452bytes。浏览器对/en和/zh分别全新context、CDP禁HTTP缓存、禁service worker、fonts.ready后字体响应体encodedBodySize合计均181024bytes（176.8KiB/500KiB）。全部字体来自目标本站origin；CDP实证h1使用Noto Sans SC/Bold自定义字形，非系统回退假通过；失败字体/零响应/零大小/外域均报错。1byte负例两语均报超预算且exit1，无扩展名实际HTTP字体fixture89572bytes实测通过。
- 年份圆点回归：新字体四位年份折行已按截图修复为10px/等宽数字/nowrap，保留原圆点与颜色。最初用scrollHeight检测把字形超出line box也算换行，已改用文本Range的实际行片段数+父容器宽度；对375px截图确认年份单行。追加后全量浏览器再通过，非仅放宽测试。
- 最终验证：180/180 unit（新增9），content:check、build、Next/Node typecheck、全站lint、git diff --check通过。完整production Playwright83/83（1.2分钟，新增18），最终真实localhost dev字体18项+既有主题2项20/20（28.3秒）；均无跳过/重试。此前失败与环境/工具冲突保留在中间记录，不伪称从未失败。
- 截图：PB-08-{en,zh}-{light,dark}-{375,768,1440}-{hero,qualifications,portfolio,contact,lab,code}.png，另PB-08-fallback-{en,zh}-{375,768,1440}.png。已查看全部12组Hero及代表性经历/项目/表单/Lab/代码/回退截图；少见姓名“过汇智融”、品牌缩写及中英标点未见缺字方框，代码ASCII不折行。测试阻断外部图标/验证码，不以这些截图证明第三方服务联网可用；中文事实最终内容审阅仍由用户决定。
- 独立只读复核无确定P1/P2；字体9项unit、实际cmap/字重、内嵌OFL/保留名、固定来源逐字节重建均获独立确认。唯一minor（无扩展字体漏计）按预算契约缺口已RED→GREEN修复；新增真实HTTPfixture验证，最终180unit和预算实测通过，无待修minor。独立复核未重跑整套build/type/lint/browser，这些来自主执行者本轮输出。
- 日志与JSON：/tmp/portfolio-bilingual-evidence/pb08-{unit,build,typecheck,lint,e2e,dev-localhost}.log、pb08-font-production.json、pb08-font-budget-negative.json、pb08-extensionless-font-{red.log,green.json}、pb08-year-{red,green}.log。初始baseline、Google下载失败、字体hash与重建日志另存同目录。
- 审核入口用http://localhost:3000/en与/zh；保留用户开发服务。测试临时生产3105及fixture3219在收尾退出。不commit、不push、不部署、不动线上配置；PB-09、图片优化、真实API新验收均未开始。PB-08停止等待用户审核。

### PB-08 最终截图发现的 Lab 动画警告

- 看到dev Lab截图“1 Issue”后未忽略，实际读取控制台确认Lab Header/Timeline的animate={reduced ? undefined : final}在SSR没有系统偏好、客户端reduce=true时分别生成style={opacity:1,...}与空style，形成hydration attribute mismatch。该问题原存在于PB-04，字体测试之前未检查Lab控制台，单纯构建/静态截图不能证明无警告。
- 本票减少动态效果验收要求覆盖该路径，故保持本票修复：两个initial=false容器始终使用一致最终样式，reduce仅取消timeline延迟；粒子原有reduce禁用及CSS减动画保留。Typography矩阵新增pageerror/hydration console采集，真实localhost375中文在修复前明确RED；修改后重跑完整dev和生产，不凭之前通过结果关票。

- Lab修复后最终结果：dev localhost矩阵+主题20/20（28.3秒），新错误采集无pageerror/hydration警告，已查看新的375px Lab截图无Issue角标。重新build、180unit、typecheck/lint均通过；使用该最终构建再跑全量production83/83（1.2分钟），字体实际181024bytes与1byte负例均复验。独立复核的原字体/许可/再现结论保持有效；年份及Lab追加修复由主执行者以真实失败回归验证，不宣称另有独立二次复核。
- 当前任务只读复查通过：不引入新客户端状态/副作用，字体声明在模块级、根布局仍服务端共享、现有稳定ID与会话边界未变。PB-08停下等用户审核。


## PB-08 审核通过，warning回修开始（2026-10-15）

- 用户明确字体/排版“通过”，随后贴出验证码OTS/WebGPU、菜单aria-hidden焦点及字体preload警告。记录核心审核通过；只排查/回修当前warning，不自动开始PB-09，不commit/push/部署。
- 先读Header/LanguageSwitcher及导航、主题、字体、Turnstile调用者。加载systematic-debugging和Turnstile现有集成参考，仅用于诊断；不运行创建/更换widget向导，不接触secret或线上配置。
- 真实localhost浏览器未屏蔽Turnstile时，精确复现“No available adapters”和OTS WOFF2 parsing，console.location明确为challenges.cloudflare.com内部challenge iframe。本文档不把它们说成Noto字体损坏，也不宣称所有验证码异常均可忽略；本次不自动解题、不请求Siteverify、不发送邮件/聊天，不新增真实成功/重放验收。frame存在于shadow DOM，原普通document.querySelector查找为空不代表iframe未加载，真实frame列表作为来源证据。
- 新浏览器en→zh→en检查：Noto400/700已loaded、CDP真实h1使用Noto，preload as=font/type=font/woff2/crossorigin正确、两语共享root字体class不丢；等待6.5秒未见preload warning。旧开发页面HMR残留为待验证假设，已询问用户强制刷新是否复现；不靠关闭preload或过滤console隐藏问题。

### PB-08 warning 定位与回修

- 用户强刷后贴出的日志不再包含本站字体preload，剩余Cloudflare两条及favicon.ico 404；不能据“日志没有贴出”推断所有缓存情况已消失。新鲜浏览器zh→en→zh实测Noto实际使用，延迟6.5秒无preload/OTS警告；字体配置及文件未改，不通过关闭preload掩盖问题，旧HMR残留只是未证实假设。
- 菜单Root cause：language-menu-en仍有focus时先setIsMenuOpen(false)，React挂aria-hidden/inert时Chrome无障碍树仍认为focus在后代。启用CDP Accessibility后精确复现用户原文Blocked aria-hidden；之前只测最终焦点，遗漏关闭瞬间，补入真实Chrome Log监听。
- Header统一稳定closeMenu回调：仅当focus在menu内时先同步focus汉堡按钮（preventScroll），再setIsMenuOpenfalse；语言选择、普通链接、锚点、导航pending订阅及toggle关闭共用。保留inert/aria-hidden与原滚动/导航策略，未删除属性绕开警告。
- favicon原SVG仅由旧Vite index.html引用，Next无.ico默认资源。按已安装Next app-icons约定，将现有JG图标转换为32px PNG-in-ICO放app/favicon.ico（996bytes），Next自动关联；不重新设计图标、不实施PB-09 SEO。
- 两项真实浏览器负例先RED（原Blocked aria-hidden、favicon404），修复后dev2/2通过；再含font实际使用/延迟警告及原主题用例dev5/5（11.1秒）通过。字体用例初始即正常，属于复现边界/回归保护，不宣称字体bug先RED后修复。
- 独立只读复核无确定P1/P2：确认callback refs/setter无旧闭包、先focus后隐藏、所有关闭路径接入；独立解析ICO 32×32/32位、offset/length/PNG CRC均正确；读RED/GREEN日志确认真实原始错误。复核方未另起browser/build，避免测试并发。字体测试验证指定文本/切换流程，不扩大为所有字重/浏览器/缓存场景均无警告。
- 公开Cloudflare文档用于核对callback错误边界，不能证明本次两条内部警告必然无害；本轮未完成人工验证码/重放/真实邮件，既有用户成功记录保留，不改widget/secret/allowed domains，不压制console、不替换验证码。

### PB-08 warning 回修完成，等待复验

- 最终验证：180/180 unit、build（含静态内容与字形校验）、Next/Node typecheck、全站lint、git diff --check通过；完整production Playwright86/86（1.3分钟，新增3项warning专项），dev真实localhost专项5/5（11.1秒），无跳过/重试。两语字体仍各181024bytes，1byte负例仍exit1。独立复核无确定P1/P2，无遗留minor。
- 最终修改仅Header.tsx焦点关闭顺序、新增app/favicon.ico、tests/e2e/review-warnings.spec.ts及关联执行文档；不动字体/预加载配置、Cloudflare脚本/配置、API或环境变量。Cloudflare两个内部警告作为第三方边界保留，本轮未重测人工验证码及真实邮件发送。
- 日志：/tmp/portfolio-bilingual-evidence/pb08-warnings-{red,green,dev,unit,build,typecheck,lint,e2e}.log、pb08-warnings-fonts{,-negative}.json；来源诊断pb08-turnstile-origin.log、pb08-menu-focus-before.log、pb08-warnings-diagnostic.log。新鲜浏览器/用户强刷后未再见字体preload提示，不声称已证明所有旧缓存或浏览器场景；旧HMR残留未获直接证明。
- 用户开发服务保留http://localhost:3000；临时3105/3219测试服务收尾退出。PB-08核心通过、本次回修停止等用户复验，PB-09及图片优化未开始；不commit/push/部署。


## PB-08 回修通过，PB-09 开始（2026-10-15）

- 用户明确“不重要，通过！下一个”，记录PB-08及warning回修审核通过；Cloudflare iframe两条日志保持既有第三方边界，不推断新验证码成功结论。只授权开始PB-09，不自动执行图片优化/PB-10，不commit/push/部署。
- 按executing-plans/TDD与已安装Next16.4 metadata/OG/sitemap/robots指南执行。预检现有PageKind/locale/dictionary.seo接口完整；PB-07 server-only post getter与slug白名单可复用；共享root只放metadataBase/robots等默认，避免文章继承错误语言关联。
- 继续nextjs-migration已有隔离分支及全部未提交/已暂存改动，不另开worktree丢失前票成果。验证以初始HTML/真实HTTP及Production、Preview独立构建为准，日志存/tmp/portfolio-bilingual-evidence/pb09-*。

### PB-09 实现与技术验收完成，等待用户审核

- 新增server-only `lib/seo.ts`，正式域名固定`https://plonguo.com`。首页/Lab/博客目录各两语读取既有字典SEO文案，canonical各自指向自身，语言关联完整`en / zh-CN / x-default`；文章保留英文原始title/excerpt，canonical及分享信息指向各自英文地址，根布局无可误继承的languages。
- sitemap精确列出六个双语壳及当前九篇英文文章共15个地址，文章lastModified使用真实发布日期，其他页不伪造更新日期；无旧地址、查询参数或中文文章。robots指向正式sitemap。
- Ruling: 只在构建环境`VERCEL_ENV=production`时允许index/follow；Preview、Development及变量缺失默认noindex/nofollow且robots disallow全部。环境判定不读请求cookies/headers，保留静态生成；README说明本地indexable build需显式设置变量，线上构建须可读取Vercel系统变量。未更改Vercel配置、环境值或部署。
- 文章分享图使用Next文件约定，bottom-up枚举九个真实英文slug，1200×630 PNG；unknown/zh/fr图片路径均404。标题仅在图片显示中归一化空白并限制140个Unicode码点，文章metadata不截断；九张实际图已逐张查看，标题完整、无裁切。
- Ruling: 安装版ImageResponse不支持WOFF2。字体生成脚本增加可选`--og-font`，由PB-08同一粗体子集导出174340bytes TTF，仅服务端使用。网页400/700 WOFF2与重建临时文件SHA-256完全相同；不增加浏览器字体下载或预加载，字体字形/哈希校验通过。来源、许可及重建步骤保留在public/fonts与lib/assets说明中。
- TDD证据：unit先因缺失lib/seo失败，补实现后23/23通过；HTML/sitemap用例先因缺title和sitemap404真实RED。测试设施曾因Node22直接JSON导入缺type属性退出，已改fs解析；实现后开发测试的`toHaveText(head title)`返回空，直接读取DOM textContent及原始HTML均有完整标题，改用专用`toHaveTitle`后8/8通过，不更改产品以适配断言。
- 最终验证：203/203 unit，content:check、Next/Node typecheck、全站lint、git diff --check通过；显式`VERCEL_ENV=production`构建后完整Playwright94/94（1.4分钟），dev localhost专项8/8；独立`VERCEL_ENV=preview`构建后SEO8/8；最后恢复Production构建并SEO8/8再次通过。无跳过或重试。Production/Preview各15页禁JS检查初始head，并保存原始HTML；robots和sitemap分别保存、集合逐项比对。
- 独立只读复核Critical/Important/Minor均0，核对安装版Next文档与实际测试日志。复核排除的九图逐张视觉检查由主任务完成；真实部署/线上环境/排名收录、PB-01–08历史实现和API安全均按本票边界排除，不据本次结果扩大既有验收结论。
- 证据：`/tmp/portfolio-bilingual-evidence/pb09-{unit-red,unit-green,html-red,unit-all,production-build,production-e2e,preview-build,preview-e2e,production-restored-build,production-restored-e2e,dev-verified-seo,final-typecheck,final-lint}.log`；`PB-09-{production,preview}-*.html`、`PB-09-{sitemap,robots}-{production,preview}.*`、`PB-09-og-*.png`。完整记录保留测试设施失败，不把它们当作产品缺陷。
- 用户开发服务`http://localhost:3000`保留，开发环境noindex是预期；临时3105/3106/3219测试服务已退出。只完成PB-09，等待审核；PB-10及原Task16图片优化未开始，不commit/push/部署，也不请求搜索引擎收录。


## PB-09 审核通过，PB-09A 图片优化开始（2026-10-15）

- 用户“通过，下一个”确认PB-09通过。读取PB-10后发现原Task16图片前置未执行，已向用户明确本轮只补图片优化、完成后停止，不同时开始PB-10。
- Ruling: 将已批准且保留的原Task16图片部分整理为同spec目录PB-09A，不新增产品功能；主题实现沿用PB-05/06，只做回归。相应更新依赖顺序，不能把PB-10提前标为完成。
- Pre-flight: About/Header硬编码本地图、Portfolio/Lab读取shared项目image，BlogCard只由BlogList调用且当前文章没有coverImage；shared图片改名两语共用。五张旧PNG仅旧src/data存在过时路径，无运行时caller，统一退役留PB-10；不覆盖旧内容或清理未引用图片。
- 保留nextjs-migration与所有用户未提交/暂存改动。继续executing-plans/TDD，依安装版Next16.4 Image指南使用fill/sizes；禁止新增过时priority示例或整页主题script。不commit/push/部署。
- 基线：public约14MiB、.next/static约1.2MiB；原图逐文件尺寸/字节保存pb09a-image-baseline.json，8张原图备份/tmp/portfolio-bilingual-evidence/pb09a-original-images。个人照片9065407bytes、导航头像428074bytes。

### PB-09A 实现与技术验收完成，等待用户审核

- 八张已引用大图先备份后处理：个人照片最长边1200px/质量82（9065407→69540bytes）、头像256px（428074→9710bytes）、电商1600px（340930→60991bytes）。五张大PNG用cwebp质量82转WebP，像素尺寸不变，替换shared路径并删除无运行时caller的旧PNG。保留未引用图片及旧src/data，后者归PB-10。逐图表见PB-09A票据与pb09a-image-conversion.json。public总文件14559212→2522320bytes，节省12036892bytes；.next/static约1.2MiB。
- About保留方形容器/居中裁切；导航头像保持32/36px。Portfolio把原motion.img动画移到同key的motion.div，内部Image fill，原opacity/scale/exit/reduced规则保持；Lab和BlogCard沿用既有容器与裁切，准确提供sizes。Lab首张图eager，其余内容图lazy，无新增图片preload或priority。
- Ruling: 原Task16的About priority示例已过时且图片在首屏下方，按安装版Next16.4指南保留lazy；Lab第一张真实首屏图改eager。程序scrollIntoView会在无用户输入时产生LCP候选，安装版get-img-props观察器不判断首屏；验收加入真实wheel输入结束初始测量，没有修改产品或屏蔽console。
- TDD：可选BlogCard真实Image静态渲染先1失败/1通过，后2通过；源码体积与图片加载原实现2项RED（9MB超预算、缺响应式候选），实现后资源用例通过。dev全7初次因LCP建议失败，先核对观察器/真实首屏，再补Lab eager的失败用例并修复，最终dev7/7。审查指出704px实际图626px而sizes644会选750，专项先RED后补640–767区间，GREEN确认选640。
- 独立只读审查Critical/Important均0，两个Minor已在本票处理：详情封面原自然比例被新aspect-video裁切，因此撤回这处超原Task16范围的替换、保留原分支；Lab平板sizes18px偏大已修并增加真实选图断言。本轮不是整分支最终审查，PB-10仍需总验收。原图构图、PNG尺寸、动画、旧路径边界及程序LCP排除项逐项接受；当前文章无coverImage，BlogCard仅组件静态渲染覆盖，不宣称文章封面浏览器解码已验证。无遗留Minor。
- 最终验证：205/205 unit（25文件），显式VERCEL_ENV=production构建成功且内容/字形校验通过，Next/Node typecheck、全站lint、git diff --check通过；修改后完整Production Playwright102/102（1.7分钟），无跳过/重试。此前完整101/101与dev7/7记录保留；704px专项dev1/1。包含两语375/768/1440深浅布局、六项目轮播/十张Lab解码、主题首帧及语言切换、状态/流式/失败路径、15页SEO与路由回归。未重测真实邮件/模型/GitHub服务，既有人工记录不扩大。
- 另用全新浏览器上下文读取真实照片WebP响应：375px/DPR1=6022bytes、375px/DPR2=23656bytes、1440px/DPR1=11244bytes、1440px/DPR2=23656bytes，全部HTTP200。pb09a-browser-image-bytes.json是真实浏览器响应体；图片专项中request客户端复取的8534/15937bytes为JPEG变体响应，两类证据分开，不当作同一种实际传输。
- 截图与视觉：已查看两语About代表屏、六轮播图及转换后的项目图，未见新裁切/破图；有损压缩观感待用户审核。证据pb09a-{unit-red,unit-green,images-red,lcp-red,sizes-red,sizes-green,dev-images-final,delivery-build,delivery-unit,delivery-typecheck,delivery-lint,delivery-e2e}.log；PB-09A-{locale}-{width}-{theme}-{about,lab}.png及carousel-0至5.png。
- localhost:3000用户开发服务保留，3105/3219测试服务均退出。源码与暂存区用户改动保留；只完成PB-09A并停止，等待审核，不启动PB-10清理或Phase4，不commit/push/部署。


## PB-09A通过，PB-10总验收执行（2026-10-15）

- 用户明确“通过，下一个是什么？”批准PB-09A，在告知PB-10范围后指令“开始”。本轮仅PB-10，不提交/推送/部署/启动Phase4。用户本轮明确最终中文事实、教育经历项目及两语PDF内容/对应关系“已核对，都准确”，同步PB-02/04状态。
- 按executing-plans/TDD和安装版Next类型/测试指南执行；保留已有nextjs-migration隔离分支，巨大的未提交迁移与用户暂存内容不重置。Pre-flight：旧blog入口仅3个测试及迁移CLI引用；tsconfig.server仍extends旧Vite node配置，先改调用者再退役；app/api调用lib/api与src/api安全层，不因删除旧api而删除共享安全代码。
- 清理RED：migration-regression检查因index.html等入口仍存在先失败。备份待退役文件到/tmp/portfolio-bilingual-evidence/pb10-retired，含用户修改的旧portfolio/config；以旧运行时文章捕获metadata+body SHA-256基线，SHA文件757b328679d5547baa0bfa592f4507ad9672b07fe24266ffee2cb22ac204183d。旧正文不复制成新编辑源，现MDX逐字节hash仍对照独立基线。原转换函数移到tests/helpers仅保留转义/拒绝覆盖测试，无生产命令。
- 删除无caller的index.html、vite.config、旧app/node tsconfig、src/index.css、src/data旧作品集及9个文章TS/聚合、迁移CLI、Vite/React模板SVG。原api/vercel.json由PB-04A已删除，本轮不重复操作app/api。用户原PDF/头像源资产及已暂存的3图标删除保持。
- 直接依赖移除vite、@vitejs/plugin-react、@tailwindcss/vite、react-router-dom、@vercel/node、eslint-plugin-react-refresh；Vitest的间接Vite peer合理保留。新server类型配置独立且纳入测试TSX/E2E，初次扩大检查暴露DOM.Iterable、jsdom声明和无用React导入，已修并加@types/jsdom30.0.0。pnpm冻结锁校验--ignore-scripts通过，仅说明当前安装/锁一致，不宣称执行过干净新机安装或安装hooks。
- 新增4项最终浏览器旅程/PDF/链接/清理断言，当前事实既有实现通过；初次旅程因选择器命中隐藏移动链接严格模式失败，修为visible，不改产品绕过。新增4组件验收（两语×有/无Demo），clone flag off/on证明Portfolio/Lab共享开关及按钮独立且原项目flags仍全false，无临时修改线上或本机共享数据。
- README/README-portfolio/CLAUDE更新Next/内容/字体/脚本/服务端环境/静态索引与部署接缝；旧使用指南明确历史。已建立中文总报告，逐AC命令、实际证据、用户结论和未验证分栏，不引用无依据Lighthouse/全站无障碍/线上可用性指标。
- 技术初验：209 unit、106 Production浏览器、dev迁移4/4、contentcheck/lint/typecheck及root tsc通过。两语字体冷缓存各181024bytes，预算512000bytes；1byte负例exit1。独立Preview构建+SEO8/8通过并恢复Production。字体/预算证据pb10-fonts{,-negative}.json；Preview证据pb10-preview-{build,e2e}.log。
- 真实服务检查失败必须保留：GitHub fresh200、5条commits已验证，cache写失败；正常chat503未进入模型；邮件缺token403，无效token因DB限流前置503，未发邮件。密钥仅检查已配置布尔值；只读Supabase select报fetch failed，独立HEAD Node ECONNRESET/read、curl35连接被重置，稍后重试仍失败。未改.env、凭证、DB、DNS、代理或控制台。用户关于本机聊天/网络的异步问题待答；AC-13不能用历史真实邮件/聊天成功或桩测试覆盖。证据pb10-real-api.json、pb10-database-diagnostic.json、pb10-network-{diagnostic,recheck}.json。
- Final review：fresh reviewer读取整个实际未提交迁移及untracked源码，Critical0/Important1/Minor1。Important中文IME确认Enter误发已按用户实际影响认定本票必须修复，2个isComposing/229事件先RED草稿丢失、guard修复后dev2/2 GREEN，普通Enter一次与Shift+Enter保留单行草稿同时通过；按MDN keydown文档实现，不复用主题或重写协议。Minor旧Task16提示属本票必要文档同步，已更正不重复图片优化。原始文章基线由reviewer独立AST读取退役备份9篇hash验证，无自比较。
- Final Ruling（真实服务/重放/缓存排除）：当前AC-13明确未通过，保留阻塞而不以历史成功作完成，等外部网络恢复；代价是本票不能关闭。
- Final Ruling（网络归因排除）：只确认连接重置，不能确定代理/链路/服务端责任；不猜测修改密钥或生产配置，代价是需用户环境信息后继续。
- Final Ruling（生产部署/配置排除）：本地Production不等于线上，未检查/修改Vercel或Cloudflare；保留后续用户授权部署门，代价是正式环境仍需另验。
- Final Ruling（全浏览器/原生IME排除）：Chromium事件回归验证具体guard，未测试所有OS输入法；旧无Navigation API按已批准源页保留策略，代价是兼容范围有限且明确。
- Final Ruling（中文事实/PDF真实性排除）：用户本轮明确确认作为事实审核，技术只验语言对应/资源字节；不由reviewer代替用户事实，代价是依赖用户确认。
- Final Ruling（压缩观感/全部截图排除）：复用PB-09A用户审核，新截图技术回归有据，当前未改变图片；不宣称reviewer重新看完全部视觉，代价是人眼结论沿用已批准版本。
- Final Ruling（原有并发限流/token估计/协议架构排除）：已裁定留Phase4、PB10未改，不重新包装迁移缺陷；代价是已知后续设计接缝仍在。
- Final Ruling（Demo/第三方iframe/SEO收录排除）：不探测Demo后台或承诺排名，Cloudflare内部警告保留既有边界；代价是外部目的站健康不由本地回归担保。
- Final Ruling（用户文件排除）：保护.claude删除、PDF、图标暂存；无具体回归依据不重置它们，代价是所有后续提交需按明确路径复核。

### PB-10最终交付状态：代码与自动验收完成，AC-13等待恢复网络

- 最终IME回修后Production构建、209/209 unit、108/108 Production浏览器、typecheck、lint、root tsc与git diff --check通过；独立Preview8/8已通过且产物恢复Production。证据pb10-final-{build,unit,production-e2e,typecheck,lint,root-tsc}.log；无跳过/重试。
- 所有可独立完成的清理、文档、人工事实核对及技术验收已完成；网络复查仍ECONNRESET/read，未取得数据库HTTP响应。AC-13保持未通过，PB-10未关闭，不能自动进入后续票据、Phase4或部署。真实服务复验必须等待网络恢复，已向用户提问本机聊天是否正常。
- 用户开发localhost:3000保留，临时3105/3106/3219均退出。无commit/push/部署、环境变量/密钥/DB或网络设置修改。原文件备份和独立blog哈希基线保留，不还原用户旧内容；暂存区3图标删除保持原状。


### PB-10 用户追加：双供应商降级与网络定位（2026-10-15）

- 用户授权默认 DeepSeek、失败后 OpenAI。已实现直连备用，8 秒首内容等待、无 SDK 重试、开始输出后不切换；取消/总截止时间沿用原路由，限流不绕过。两家密钥仅检查是否配置，无值输出或修改；`OPENAI_MODEL` 默认 gpt-4.1-mini，依据官方模型/Chat Completions 文档确认流式及 max_completion_tokens 参数。
- 先写失败用例，原代码 10 项 RED；实现后专项 25/25、全量 unit 231/231、生产浏览器专项 21/21、生产构建、typecheck/lint/root tsc 通过。首轮类型错误为 generator.return 缺实参，已修正后重新检查。测试包含 HTTP401/429/503、连接/空流/首内容错误、超时、跨供应商凭证参数隔离、首内容后中断不切换、取消和 SSE/计费联合边界。浏览器使用既有 fixture，不能代替外部服务验证。
- requesting-code-review 要求 fresh 只读 reviewer，未发现 Critical/Important；Minor 的备用输出后取消/计费联合用例已补通过。没有扩大为 AI SDK/网关迁移。
- 真实 DeepSeek 200 回复成功；受控模拟 DeepSeek503 + 真实 OpenAI 请求发生 ECONNRESET；真实开发聊天仍 503。网络只读对照：系统代理已开、终端直连失败，显式让 curl 经现有系统 HTTPS 代理后 Supabase 和 OpenAI 均返回无密钥预期401，支持终端未经过可用代理路径的判断。未改系统代理/TUN、环境文件或生产配置；尚未实测鉴权后的数据库/备用生成成功。用户已询问如何排查，交接提供终端代理路径检查。
- README、CLAUDE、PB-10 及总报告同步。证据 /tmp/portfolio-bilingual-evidence/fallback-*。AC-13/PB-10 保持未关闭，停止等审核；不提交/推送/部署，用户开发服务保留，暂存的3个图标删除不变。

发布前最终本地检查：231/231 unit、108/108 Production浏览器、Production构建、typecheck/lint通过；证据release-{unit,production-e2e,build,typecheck,lint}.log。明确路径暂存；原已暂存图标删除与用户简历一并纳入已审核迁移，.claude仅记录已跟踪文件退役，忽略本地配置。

2026-10-15 发布追加：f53ffec已推送迁移分支并通过Preview21项线上检查，随后main生产重建Ready。线上发现原有apex→www永久跳转与计划中的canonical不一致，用户明确选择保留www.plonguo.com主域，授权统一SEO；SITE_URL、初始HTML/分享地址、sitemap/robots测试与spec同步，域名跳转规则不改。此SEO补发仍属本次发布，不启动Phase4。发布中出现用户新修改src/assets/Huizhirong Guo.pdf，保留未提交，public简历仍为已审核版本。

www主域修正验证：先12项SEO期望RED，修正后23/23SEO单测；全量231/231 unit、Production构建、类型/lint与8/8Production SEO浏览器通过。独立审查Critical/Important/Minor均0，另复验SEO+安全46/46；无需修改API白名单或域名永久跳转。证据release-www-{red,green,unit,build,typecheck,lint,seo-e2e}.log。
