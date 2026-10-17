# Phase 4 聊天重构验收报告

技术验收：2026-10-15；用户最终审核：2026-10-17。P4-01–04实现、技术验收、分支独立review及用户审核均通过，Phase 4关闭。未提交、推送或部署。

规格：[Phase4 spec](../specs/2026-10-15-phase4-chat-ai-sdk-design.md)；实施与逐票证据：[tickets/progress](../tickets/2026-10-15-phase4-chat-ai-sdk-design/progress.md)。基线c541a75，本地phase4-chat-ai-sdk；线上仍8a7ebfb。P4-01–04均已获用户审核。

## 最终行为

- AI SDK7.0.141、React适配4.0.145、DeepSeek3.0.65/OpenAI4.0.94；移除无caller的直接openai依赖及ChatRequest/ChatError旧类型，保留邮件HTML转义与旧SSE兼容入口。
- DeepSeek主用、OpenAI首正文前备用一次；8秒首正文、20秒总截止、每家SDK重试0，输出1024；停止取消模型，不为取usage继续生成。
- 新浏览器共享Chat/useChat及/api/chat/v2；旧/api/chat仍可用，同一配额、模型、结算。SDK为消息/状态/模型错误唯一源，SSR不读访客单例；关闭、换语言、跨页不断流，显式停止才取消。
- IP原子30次/小时，已结算100000tokens门槛；实际未知用量为null，token门槛不是严格账单上限。服务端请求ID去重，晚结算不污染新窗口，结算失败没有正常完成事件。
- 按用户追加要求，只回答本人/背景/经历/技能/项目/求职/兴趣/联系及本站相关问题。通用代码、算术、翻译、作业、创作等拒答；混合请求只答相关部分。两provider共享指令，拒答句按当前消息有无汉字选中/英。不加新对话按钮；刷新重置记录。

## 数据库变更与清理

P4-01真实迁移20261015085504；P4-04真实迁移20261015144154（chat_quota_cleanup），本地文件版本与真实历史匹配。仅新增本阶段表/RPC与cleanup；原cleanup_old_rate_limits定义hash前后相同，原表保留。

pg_cron1.6.4预加载但初始未启用。本票启用并创建唯一job portfolio-chat-quota-cleanup，active=true，17 4 * * *，cron时区GMT（等于UTC），执行select public.cleanup_chat_quotas();。迁移重放不增加作业。未修改数据库时区或其他cron。

已结算ledger创建和结算均超过24小时才删；未结算超过48小时且IP不活跃才删；quota的window_start和last_request均超过24小时且没有保留ledger才删。这样保留ledger还能做幂等/晚结算。清理按quota→ledger锁顺序，跳过busy IP。RLS保留，anon/authenticated无法执行，service_role具备所需权限，函数invoker/空search_path。

全函数先在独立Postgres18测试库RED（函数不存在）→GREEN；涵盖旧/活跃quota、新last_request、最近结算、年轻/过期未结算、当前窗口、孤儿ledger、重复清理和角色正反例。真实Supabase17使用安装函数定义和空表副本在独立schema事务中运行相同测试；全部回滚，原函数anon/authenticated执行负例也通过。不通过验收脚本全局清理访客数据。

2026-10-15验收时配置已读回，首次每日04:17的自动触发尚未到时。本次2026-10-17仅录入用户审核，未新增定时执行日志观察证据。SQL执行与权限通过直接的隔离测试验证。

## AC对照

| AC | ticket/环境/证据 | 结论 |
| --- | --- | --- |
| 01 主备真实模型 | P4-02真实DeepSeek/OpenAI与数据库；P4-04范围8×2真实模型探针（主用受控503后真实OpenAI） | 已验证；主用故障为注入，备用为真实 |
| 02 备用/截止/取消 | P4-02模型transport及P4-03双协议真实loopback TCP；当前全量unit | 已验证 |
| 03 原子准入 | P4-01真实SQL40并发；P4-04真实RPC复验30放行/10拒绝，数据库失败unit不调用模型 | 已验证 |
| 04 真实用量/去重 | P4-01/02/03 ledger；P4-04重复并发结算、冲突、跨窗与未知复验；新/旧Next真实链路 | 已验证，未知/并发超额边界保留 |
| 05 输入/边界 | 两parser、v2 UTF-8 32768/32769边界、实际SDK provider原样请求；迁移acceptance同时检查邮件转义 | 已验证 |
| 06 生命周期 | P4-03真实延迟HTTP跨en→zh→Lab→blog、同document/session一次请求；375px/IME/Markdown/停止 | 自动与P4-03人工均通过 |
| 07 兼容 | 旧页面先打开后与新UI共用HTTP quota，混合30次后两协议均429；当前新/旧Next真实HTTP | 已验证 |
| 08 清理与cron | 唯一有效job读回/重复应用、隔离SQL正反例、真实schema副本与权限 | 已验证；未等待每日首次触发 |
| 09 自动与真实服务 | 368unit、114Production browser、content/type/lint/production build；真实服务与fixture分列 | 技术及独立review通过 |
| 10 人工 | P4-01–03已通过；用户决定不加新对话，2026-10-17明确通过P4-04及追加拒答/相关问答 | 用户审核通过 |

## 本票命令与证据

所有临时证据位于/tmp/portfolio-phase4-evidence/，不纳入提交：

- pnpm test → 368/368，p4-04-unit.log；pnpm content:check、pnpm typecheck、pnpm lint均通过。
- VERCEL_ENV=production pnpm build通过（含字体/内容检查）；PORTFOLIO_TEST_PORT=3105 VERCEL_ENV=production pnpm test:e2e → 114/114，p4-04-browser.log。无跳过用例。
- p4-04-cleanup-{red,green}.log：独立数据库全函数SQL测试；p4-04-real-cleanup.log：真实项目隔离副本/权限/回滚；p4-04-db-{before,after}.json与migration-repeat：扩展、job、版本及旧函数hash。
- p4-04-real-quota.log：真实40并发、幂等、冲突、跨窗、未知及门槛，syntheticCleanup=complete。
- p4-04-scope-red.log：原prompt实际回答579而未拒答，证明回归有效。p4-04-scope-{deepseek,openai}-final.log：每家8个固定正反例，含无关算术/翻译/代码/冒称本人授权，相关姓名/项目/追问及混合请求。拒答语言不稳定先被真实探针抓到，改为每次只给一条当前语言模板后通过。
- 真供应商探针只用固定公开synthetic问题，直接运行现有模型层；不冒充数据库准入端到端。新SDK→Next和旧Next真实请求/ledger另外分列，测试记录精确清理。

## 已知边界

- Prompt不是无法绕过的服务器授权规则，拒答仍占一次模型请求与tokens；IP/输入/输出/超时边界继续控制调用。不增加分类模型或额外请求。
- 同出口IP共享限额，未知/在途usage可能超额；不保证硬账单上限。
- 无关scope固定探针通过不代表穷尽所有提示词攻击；其他第三方Cloudflare字体/adapter warning沿用历史边界，不当作站内错误。
- 正常聊天、Markdown、主动停止、切语言/跨页和375px已获P4-03人工通过；新增相关问答/拒答及P4-04结果于2026-10-17获用户最终确认。不自动进入其他Phase，不提交/推送/部署。


## 本轮真实HTTP与清理收尾

- 新SDK→本机Next v2→真实DeepSeek：一次HTTP，stream v1，ready无error，回复“过汇智融”；输入1908、输出4、总1912，ledger/quota匹配、synthetic精确清理。
- 旧Next /api/chat→真实DeepSeek：200非空content/DONE、GoChatroom相关回答；输入1909、输出30、总1939，ledger/quota匹配、synthetic精确清理。
- 最终数据库读回job_count=1、active=true、schema_leftovers=0、synthetic_quotas=0、synthetic_ledgers=0；旧cleanup函数hash=f914357ec1997019c06b14a78c507dcf，前后一致。
- 清理锁探针：占用IP在137ms内跳过，锁释放后下一轮删除过期行。测试仅在本轮独立Docker数据库。

## 整分支独立审查

独立reviewer只读检查c541a75上的全部未提交tracked与untracked改动，含五项Review Focus、当前SDK源码、SQL锁/权限/保留条件、共享会话、输入边界、prompt与验证证据。结论：0 Critical、0 Important、0 Minor，ship as-is（技术审查通过）。reviewer未重新调用付费API、改数据库或跑浏览器；不把复核日志当作独立复验。

审查时未判定项及裁定：2026-10-15每日cron首次自动触发未到时，保留运行观察边界；固定prompt探针不能证明穷尽绕过，保留非硬安全边界。人工审核已由用户于2026-10-17确认；本次未新增cron运行观察，不将日期推进当作执行成功证据。

## 实施取舍及代价

| 取舍 | 理由与代价 |
| --- | --- |
| 分票先legacy未知、后真实usage | 各票可运行；P4-01不能独立宣称精确计量完成 |
| P4-02旧SSE、P4-03新v2并存 | 已打开旧页面可用；维护两个轻量输出adapter |
| 新增quota/ledger，不改旧表 | 可回退应用；启用新策略从新窗口开始 |
| 准入检查已结算量，未知为null | 不伪造用量；不是硬账单上限 |
| Admit可传请求signal，settle独立5秒 | 请求20秒内可取消、取消后仍结算；测试double需保持契约 |
| 迁移API自动版本与本地文件匹配 | 避免重复迁移；历史name保留已有记录 |
| 使用当前tickets/progress而非自动task脚本 | 用户逐票审核且不自动提交；需显式维护ledger |
| 单一SDK流读raw usage，不读结果promise | 结果promise会drain；取消/断流可能仍未知 |
| 启动直接等待自有有界运行器 | 保留GenerationStartError用量；依赖运行器遵守signal（已有真实取消测试） |
| 保留DeepSeek适配器空reasoning_content | 官方字段，非用户穿透；测试需区分SDK字段与客户额外字段 |
| 已解析UI事件检查EOF、SSR空实例 | 避免断流计成功/访客数据进SSR；保留少量适配代码 |
| SDK writer.merge传播取消、legacy直接owned stream | 无额外后台生成；v2取消异步传播，after保留独立结算 |
| 旧quota有保留ledger时一起保留 | 保证晚结算/幂等；部分旧quota更晚删除 |
| 本地Postgres18 + 真实Supabase17隔离复验 | 避免镜像下载阻塞；本地18不能单独替代真实17证据 |
| 保留GMT时区、04:17与随机schema事务测试 | 不改共享时区/不为验收全局删访客数据；未观察每日首次触发 |
| 每轮只给一条中/英文拒答模板 | 真实备用曾选错语言；混合语言含汉字时用中文，仍有模型绕过/token成本 |

无延期Minor findings。用户人工审核已于2026-10-17通过；没有提交/推送/部署授权。

参考：调度安装与命名作业语义核对[Supabase Cron](https://supabase.com/docs/guides/cron)、[pg_cron官方说明](https://github.com/citusdata/pg_cron)。实际项目配置/执行结果以本报告列出的数据库证据为准。

## 关闭记录（2026-10-17）

用户明确“通过”，P4-04及Phase 4整体验收完成，P4-AC01–10闭合（已知边界保留）。本次仅更新审核状态与文档，不重新运行产品检查、不修改数据库、不提交/推送/部署。

## 发布前复检（2026-10-17）

用户“开始下一个”后核对发现原计划已无后续ticket。当前只做可逆的发布前准备，尚待用户明确是否进入提交/推送/发布流程，不把“下一个”直接当作生产部署授权。

- 当前工作区重新运行pnpm test：368/368，typecheck/lint/content:check及VERCEL_ENV=production pnpm build通过，git diff --check通过。本次未重复跑已通过的114项浏览器用例；没有产品代码改动。
- 只读实际cron运行记录：portfolio-chat-quota-cleanup仍唯一、active=true、17 4 * * *、GMT。2026-10-16和2026-10-17均于04:17UTC自动执行succeeded（北京时间12:17），补齐之前未观察首次计划执行的记录；没有修改云端配置或手动调用全局cleanup。
- 证据：/tmp/portfolio-phase4-evidence/release-preflight-{unit,typecheck,lint,content,build}.log及release-preflight-cron.json。
- 当前未提交、推送或部署。建议下一步为提交Phase4，推送功能分支生成Preview并验证，再进行Production构建发布；Production须使用生产构建的索引配置，不能直接把noindex Preview产物当最终生产站。
