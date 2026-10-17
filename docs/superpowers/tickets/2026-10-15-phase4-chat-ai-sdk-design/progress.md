# Phase 4 执行进度

规格：[2026-10-15-phase4-chat-ai-sdk-design.md](../../specs/2026-10-15-phase4-chat-ai-sdk-design.md)。实施入口：[README](README.md)。

## 当前状态（2026-10-17）

用户已通过“对照目录开始实现”批准计划并授权P4-01。用户已确认“审核全部通过”，P4-01及中文姓名回修均审核通过；本地分支phase4-chat-ai-sdk，保留现有文档改动，不提交/推送/部署。P4-02/03均已获用户确认通过；用户“通过，下一个”授权P4-04，已实现并完成技术验收及整分支独立review；2026-10-17用户明确“通过”，P4-04及Phase 4整体关闭。真实Supabase新增迁移已应用，原线上表/函数保留，应用尚未发布。

工作基线：本地main=c541a75（PB-10A已获用户审核并本地提交）；origin/main与线上=8a7ebfb。本地语言切换与新版PDF尚未推送。现有Phase4文档为本轮相关未提交修改，实施时保留。

## 执行规则

- 主agent串行，一张实现/验证完成后等用户审核再开下一张。
- 不重复索要或输出现有密钥，不创建新供应商集成，不安装Gateway。
- 每张开工先读spec/README/本票/本进度并搜索caller；记录实际接口变更，不凭旧计划猜路径/API。
- 数据库/真实供应商验证与模拟测试分列；无真实证据不得关对应AC。
- 未经明确授权不提交、不推送、不部署。只在首张实施时创建phase4-chat-ai-sdk本地分支。

## Tickets

| Ticket | 状态 | 当前证据/审核 |
| --- | --- | --- |
| [P4-01](P4-01-atomic-chat-limits.md) | 用户审核通过（含姓名回修） | 最新275unit、110browser、构建/类型/lint及真实数据库/聊天；usage仍未知 |
| [P4-02](P4-02-ai-sdk-provider-runtime.md) | 用户审核通过 | 287unit/34browser、构建/类型/lint；真实DeepSeek/OpenAI及用量入库一致 |
| [P4-03](P4-03-shared-chat-ui-protocol.md) | 用户审核通过 | 366unit、49项唯一Production浏览器、构建/typecheck/lint；真实SDK→Next→DeepSeek及1610tokens入库核对通过 |
| [P4-04](P4-04-cleanup-and-acceptance.md) | 用户审核通过（2026-10-17） | 368unit/114browser、构建/content/type/lint；真实清理/准入/新旧聊天/主备范围探针及独立review通过 |

## 设计衔接与裁定

- Ruling：P4-01先把现有链路接入新原子准入/去重结算，旧模型的usage记legacy未知；P4-02才改真实计量。原因：每票保持可运行，不让chunk统计继续冒充真实token。代价：中间票的真实token限额不完整，不能独立发布为“精确计费已完成”。
- Ruling：P4-02保持旧SSE，P4-03再加v2和迁前端。原因：模型/前端可以分别验收，旧标签页不因新部署失效。代价：旧协议输出adapter继续维护，本阶段不退役。
- Ruling：数据库仅新增chat_ip_quotas/chat_usage_requests和专用RPC/cleanup job。原因：旧线上表和cleanup不受影响，可回退应用。代价：旧数据不迁入新IP桶，新策略初次启用从新窗口开始；发布前要明确这是一次额度窗口重置，不宣称沿用旧session配额。
- Ruling：token门槛按已结算量准入，未知用量和并发可能超额，不添加预扣账本。原因：遵循已审spec的范围与实际provider取消限制；不能承诺严格账单上限。

## 文档自检

已对照spec检查P4-AC01–10归属、P4-01/02/03的契约名称、中间状态、真实数据库验证门、旧协议兼容及五项Review Focus。自检补齐首正文前失败的GenerationStartError用量报告、统一quota→ledger锁顺序、跨窗口结算及旧标签页兼容测试。

文档检查通过：8份当前spec/实施入口/票据/进度文档的本地链接、代码围栏、占位扫描，10项AC覆盖及4票接口/checkbox检查；git diff --check通过。本轮仅改文档，未运行产品测试或外部服务验证，不把文档检查当实现通过。


## P4-01 记录

- 基线30项通过；新准入/结算、路由以及SQL先RED后GREEN。最终全套unit273/273、浏览器Production110/110、构建/内容/typecheck/lint通过；未跳过。实际命令和失败纠正记录见P4-01文末。
- 实际数据库版本20261015085504，新增chat_ip_quotas/chat_usage_requests及两RPC；40并发30放行10拒绝、重复结算、跨窗、未知、门槛、权限均有真实证据。所有synthetic数据清理完成。
- 本机dev真实聊天200非空DONE；ledger显式legacy未知，并已清理该测试自己的记录。不把真实聊天成功等同于真实token计量。
- Ruling：ChatQuota.admit增加可选AbortSignal，旧两参数调用兼容；原因是准入必须服从请求剩余20秒而不是额外等满5秒。代价：后续测试double需保留该第三参数，settle仍用独立5秒截止。
- Ruling：Supabase Management API自动生成迁移版本20261015085504，本地迁移文件改为同版本名，避免后续CLI把已应用迁移重复执行；迁移历史name仍保留初始提交名202610150001_chat_ip_limits。没有修改其他历史记录。
- Ruling：执行脚本按Task N解析的格式不适合当前逐票目录；以本progress与票据作为唯一ledger，不运行自动提交/连做脚本。按用户规则本票后停止，整个Phase结束再独立review。
- 网络诊断与代理仅限本轮外部验证进程；未更改.env.local、系统代理、Vercel或模型供应商配置。临时数据库和测试端口在交付前清理，用户localhost:3000保留。

## P4-01 审核回修：中文姓名

用户反馈模型将中文姓名猜成其他汉字，并明确中文全名是“过汇智融”。已核对网页数据正确，系统提示词此前仅含Jason Guo/Huizhirong Guo，缺少中文姓名事实。按用户指令在lib/chat/system-prompt.ts明确全名过汇智融、姓过/名汇智融、英文名对应关系，以及不得按拼音猜字或重复历史错误；主用/备用共用。此为当前票审核回修，不启动P4-02。

实际供应商transport两项回归先RED后GREEN，全量unit275/275、typecheck/lint通过。两次真实模型调用（新对话、带错误姓名的assistant历史）均只返回“过汇智融”；调用直接使用现有chatServices模型链路，不经过数据库准入，不冒充完整HTTP端到端验证。证据name-prompt-{red,unit,typecheck,lint}.log和name-prompt-real.json。未提交、推送、部署，继续等待用户审核。


## 最新审核结论

2026-10-15 用户“审核全部通过”：P4-01与姓名回修均通过。下一张P4-02，待用户启动后实施；不将审核通过视为提交/推送/部署指令。


## P4-02 记录

- 用户“启动”授权本票，P4-01已审核。实际实现、版本、失败修正和所有命令/证据见P4-02文末。287unit、34Production浏览器、构建/内容/typecheck/lint通过；两个真实loopback HTTP用例证明取消TCP和结算失败路径。
- 真实DeepSeek1635 tokens、模拟主用503后真实OpenAI1608 tokens，数据库report/quota完全匹配；独立真实Next HTTP调用也成功并记录1630 tokens。测试数据已精确清理，不修改生产模型参数/密钥。
- Ruling：使用SDK流中的原始usage，而不读取会自动consumeStream的结果promise；两provider源码会将缺失字段默认0、SDK总数会相加，因此从raw读取并保留未知与供应商total。代价：仅在供应商确实返回usage时才能精确统计；取消/断流仍可能未知。
- Ruling：route启动阶段直接等待自有、随信号有界结束的StartGeneration；再对它竞速abort会抢先丢掉GenerationStartError中的用量报告。整体20秒由route信号控制，真实SDK取消/超时测试证明终止；结算继续独立5秒。
- Ruling：SDK为DeepSeek V4 assistant历史自动加空reasoning_content，此为SDK生成字段，不是客户端额外字段穿透；保留官方适配器行为，测试对client name/tool_calls作负例。
- 证据维护：复用旧开发HTTP脚本曾覆盖临时p4-01-dev-chat.json，当前运行已独立保存p4-02-dev-chat.json；P4-01的已审核结论及原ledger记录保留，不能将新HTTP记录当P4-01原始采样。
- 等待用户本地正常问答、Markdown、停止审核。未进入P4-03，未提交/推送/部署；本票不修改数据库schema。


2026-10-15用户确认P4-02“通过”，本票关闭；下一张P4-03待用户启动。保持逐票审核，不自动提交、推送或部署。


## P4-03 记录

- 用户“哦，开始吧”授权启动；已完成共享SDK Chat/useChat、v2 UI message stream和旧SSE兼容。两个接口共用chat-lifecycle的验证、原子配额、模型及结算，浏览器session不再可写消息/loading/model error。实际细节、命令、失败修正和人工门见[P4-03](P4-03-shared-chat-ui-protocol.md)文末。
- 全量366unit通过；7份受影响浏览器spec共49项唯一用例通过（首次48/49，alert定位器修正后专项2/2）；构建/typecheck/lint通过。未跳过：真实延迟HTTP跨en→zh→Lab→blog、同document/session且单次请求；显式取消、375px焦点/IME/Markdown、草稿/主题；旧页面与新UI混合30次配额、第31次拒绝且不调用模型。
- 真实共享SDK实例→Next v2→DeepSeek正常，回复“过汇智融”；数据库输入1606/输出4/总1610与quota完全匹配，synthetic记录已清理。未改schema、env、Vercel或供应商规则，未重新调用真实OpenAI（P4-02证据保留）。
- Ruling：浏览器由SDK解析流，只对已解析UI事件检查缺失finish的EOF；避免SDK把断流当成功。SSR使用隔离空SDK实例，水合后才读浏览器唯一Chat。代价是保留少量协议终止检查和水合适配，消息/模型状态仍只有SDK一个来源。
- Ruling：使用SDK writer.merge承接shared lifecycle，取消能传播到owned reader及模型；不在异步execute循环自行继续写。旧adapter直接编码owned stream，保留cancel等待结算的旧契约；v2 after保留有界结算，真实TCP取消和单次结算均有测试。
- 当前待用户本地审核。完成本票后已停下，不进入P4-04，不提交/推送/部署；localhost:3000保留。

P4-03文档检查补记：spec/tickets/执行入口本地链接通过；README原有CLOUDFLARE_WAF_SETUP.md断链在HEAD已存在，未在本票改动，留P4-04文档清理核对。

2026-10-15 用户“通过，下一个”：P4-03审核通过，P4-04启动；追加prompt仅回答本人相关问题，不加新对话按钮。


## P4-04 记录

用户授权本票并追加prompt只回答本人相关问题、不加新对话。实际交付、命令、外部修改、失败修正与裁定见[P4-04](P4-04-cleanup-and-acceptance.md)文末；逐项AC见[总验收报告](../../reports/phase4-chat-verification.md)。

- 368unit/114Production浏览器、content/type/lint/build通过，无跳过。独立review覆盖整个未提交Phase4分支：0 Critical/Important/Minor，技术ship as-is；未冒充独立重跑。
- 实际迁移20261015144154，启用已预加载pg_cron1.6.4；唯一portfolio-chat-quota-cleanup每日04:17GMT=UTC，active；重放仍一行，原cleanup_old_rate_limits未改。真实项目随机私有schema副本测试后全回滚，公开函数匿名/认证执行负例通过。最终私有schema与synthetic quota/ledger残留均0；没有手动全局清理访客数据。
- Ruling：保留仍有ledger的旧quota以保证晚结算/幂等可执行；busy IP跳过，24h已结算/48h未结算保留条件有实际SQL正反例与137ms锁探针。代价是保守多留旧计数，而非过早删掉审计关联。
- Ruling：拒答模板每轮按当前消息含汉字选择中/英，直接给模型唯一句子，避免实际OpenAI探针发现的语言选错。代价：混合语言含汉字时选中文，prompt仍非不可绕过的安全边界，拒答有token成本。
- 真实DeepSeek8/8、受控主用故障后真实OpenAI8/8范围探针；新SDK→Next→DeepSeek1912tokens、旧Next→DeepSeek1939tokens均200非空，ledger/quota匹配，测试记录已精确清理。真实准入40并发、幂等/跨窗/未知/门槛再次通过。
- Final: Ruling：独立review未判定首次每日cron触发、用户最终体验或所有prompt绕过；分别明确“未到时/待人工/非硬保证”，不借技术检查冒充这些结论。
- 当前仅等待本票正常相关问答/无关拒答及整体交付审核。P4-03已通过的界面验收保留，不加新对话，不进入新Phase，不提交/推送/部署。

交付前收尾：仅本轮独立portfolio-p4-04-pg容器及其临时卷已停止并删除；Playwright的3105/3219服务已结束；用户localhost:3000保留。当前11份文档61个相对链接有效，diff检查通过。

## 最终人工审核（2026-10-17）

用户明确“通过”，确认P4-04及追加的本人相关问答/无关拒答要求，P4-AC10关闭，Phase 4全部tickets审核完成。保留2026-10-15技术验收与独立review证据，不把本次审核录入当成重新运行测试或读取cron运行日志。当前未提交、推送或部署；下一步如需提交/发布，等待明确授权，不自动开始新Phase。

## 后续工作定位（2026-10-17）

用户“开始下一个”：原计划已无下一张实现票，已发出是否进入提交/推送/Preview→Production发布的范围确认。确认前只完成发布前复检：368unit、type/lint/content及生产构建通过；真实cron10月16/17日自动运行均succeeded，补齐首次定时运行观察。详情见总验收报告“发布前复检”。没有产品代码改动，未提交/推送/部署，未自行创建Phase5。

## 发布授权（2026-10-17）

用户明确选择“开始提交、推送和发布”，授权提交Phase4并推送功能分支生成Preview，验证后再发布Production。此前“不自动提交/发布”的限制仍适用于未经新指令的其他工作；本次发布已明确获授权。后续结果见[发布记录](../../reports/phase4-release.md)。

## 发布完成（2026-10-17）

- 应用提交`f089bb9`已推送`phase4-chat-ai-sdk`，Preview READY且24项冒烟/17项SEO通过；main快进至同一提交后已推送，Production独立构建READY并绑定www主域。
- www线上25项冒烟、17项SEO通过，页面脚本异常0：原生SDK聊天/正确中文姓名/无关拒答、深色主题同document切语言、375px对话框、两份PDF与本地哈希一致；新旧API正常，恶意Origin与无效验证码均403，GitHub缓存正常。apex→www仍308。合并后368unit再验通过。
- Preview验证码域名限制与生产Cloudflare iframe提示保留为第三方边界；未重复发送真实邮件或在生产强制触发备用模型，未重跑数据库迁移、修改密钥或安全配置。发布结果在仅文档跟进提交中归档，详细部署ID/证据见[发布记录](../../reports/phase4-release.md)。Phase 4无剩余票据，不自动开始新Phase。
