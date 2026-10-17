# P4-04：安全清理、定时任务与最终验收

状态：实现、技术验收、分支独立review及用户最终审核通过（2026-10-17），本票关闭。依赖：P4-03用户已审核通过，用户“通过，下一个”授权本票。规格：§8/9，P4-AC08/09/10与全部AC闭合。

配套：[spec](../../specs/2026-10-15-phase4-chat-ai-sdk-design.md)、[全局约束](README.md)、[progress](progress.md)。

## 可交付结果和边界

清除无引用代码/依赖，安全调度配额与结算记录清理，交付逐项验收报告。保留旧SSE输出adapter及`/api/chat`，不自动部署、不顺带重构其他API、不删除旧数据库表或其他cron。

## Files 与 caller

- Read/Modify：`lib/client/chat-runtime.ts`、`lib/api/chat-services.ts`、`lib/api/chat-route.ts`、`src/types/chat.ts`；只删除搜索证实无引用的符号和实现。
- Modify：`package.json`、`pnpm-lock.yaml`、`README.md`、`CLAUDE.md`、`docs/superpowers/plans/EXECUTION.md`。
- Create：`supabase/migrations/20261015144154_chat_quota_cleanup.sql`、`tests/integration/chat-quota-cleanup.sql`、`tests/unit/chat-migration-acceptance.test.ts`、`docs/superpowers/reports/phase4-chat-verification.md`。
- Modify：`scripts/verify-chat-quota.ts` 增加清理/权限的显式验证模式；本票、progress和实施入口状态。

```bash
rg -n 'sanitizeMessage|from .openai.|createChatRuntime|ChatRequest|TextDecoder|\[DONE\]' app lib src tests scripts
rg -n 'escapeHtml|cleanup_old_rate_limits|chat_rate_limits|cron' lib src supabase docs
```

`[DONE]`在旧输出adapter与供应商/协议fixture中合法，TextDecoder在通用JSON读取中合法；不得用全局文本为零当验收。

## Interfaces

新增数据库函数 `public.cleanup_chat_quotas()`，只清理本阶段新增 `chat_ip_quotas` / `chat_usage_requests`。

- 只删除 window_start 及 last_request 都早于24小时前的 quota；不触碰活跃窗口。
- 结算去重记录仅在 created_at 早于24小时且已结算超过24小时后删除。未结算记录创建超过48小时后才允许清理，必须同时确认其关联quota非活跃；避免新活跃窗口的记录被清理。
- 不因旧窗口晚结算更新当前quota.last_request，不让旧报告污染新窗口；报表保留到上述期限。
- cron唯一作业名 `portfolio-chat-quota-cleanup`，`17 4 * * *`，UTC。迁移重放只更新本作业，不添加同名重复记录。

## 实施与验证步骤

- [x] **1. 引用清单与清理RED。** 检查当前openai包是否仍被产品代码/测试引用。若已无caller再 `pnpm remove openai`；若有合法caller，先说明并保留，不能为了计划强删。旧前端SSE parser应已由P4-03替换，若仍有产品caller先修调用链再删除。删除测试内旧sanitization期望，改为实际provider body原样输入断言，保留邮件HTML转义测试。

```ts
// migration acceptance用真实模块/请求，而不是扫描package文本代替功能。
expect(providerBody.messages.at(-1).content).toBe("What's React/Vue？<中文>");
expect(emailHtml).toContain('&lt;');
expect(emailHtml).not.toContain('<script>');
```

providerBody和emailHtml分别由真实模型transport及contact handler测试获得；不直接给常量再断言常量。新回归若已有测试覆盖，复用而不写重复实现测试。

- [x] **2. 只读检查外部调度条件。** 查询真实 pg_extension、cron.job、cron.timezone、本项目函数/权限。只读输出目标作业名/时间/权限，不读密钥或无关作业command。没有pg_cron时按Supabase支持方式启用；如果不可用或权限不足，报告阻塞，不能改Vercel cron凑数或标AC08通过。

- [x] **3. 清理SQL事务测试先失败。** `chat-quota-cleanup.sql` 创建专用记录：48小时前静默quota、1小时前活跃quota、旧窗口但新last_request、旧已结算ledger、最近结算ledger、过期未结算ledger、当前窗口ledger。调用尚不存在的新cleanup，先取得真实数据库的函数缺失/行为RED。测试在事务中ROLLBACK，且清理函数测试条件只涉及fixture，避免调用函数时清理到用户数据；使用隔离测试schema/测试数据库验证全函数，再在真实项目用测试记录和定向条件验证，不为测试全局删除真实过期行。

```sql
do $$ begin
  if not exists (select 1 from public.chat_ip_quotas where ip_key = 'p4-cleanup-active') then
    raise exception 'active quota must survive cleanup';
  end if;
end $$;
```

若无隔离数据库，不先运行全局cleanup测试；记录此验证缺口并保持票未关闭。创建fixture及清理条件用可控测试数据库时钟/固定时间，不改生产now()或系统时间。

- [x] **4. 编写函数和幂等作业迁移。** 函数固定空search_path、schema限定表名，表/函数权限仅service_role。作业如已存在且属于本项目则更新；同名异义作业先停下报告，不覆盖。使用pg_cron支持的命名schedule更新语义，实施前核对所装扩展签名；以重复执行后jobname仅一行证明，不凭记忆保证。

```sql
select cron.schedule(
  'portfolio-chat-quota-cleanup',
  '17 4 * * *',
  'select public.cleanup_chat_quotas();'
);
```

不得覆盖原cleanup_old_rate_limits，也不触碰contact/GitHub表。本函数不删除原chat_rate_limits；旧表退役需独立授权。日志中记录迁移名/目标schema/结果，不输出service_role key。

- [x] **5. 真实读回与权限负例。** 应用迁移后读回目标job active、schedule、command函数名与数据库cron时区。重复应用保持一行，anon/authenticated无法执行cleanup，服务端角色执行权限符合要求。仅清除本次测试创建且记录在脚本中的键；不可在验收脚本里无条件执行全表DELETE。

- [x] **6. 全套自动验证。**

```bash
pnpm content:check
pnpm lint
pnpm typecheck
pnpm test
VERCEL_ENV=production pnpm build
PORTFOLIO_TEST_PORT=3105 VERCEL_ENV=production pnpm test:e2e
```

运行时错误与console收集按来源分类。第三方Cloudflare既有warning可记录边界，新站内hydration/脚本/焦点错误必须修；无跳过用例冒充通过。仅停止自己的测试服务，保留用户dev。

- [x] **7. 分列真实服务和模拟验收。** 保留P4-01实际数据库并发/权限、P4-02真实两家供应商和真实usage证据；当前实现如有变化应复验受影响路径。新v2真实DeepSeek200非空、旧入口仍可成功、停止确实abort上游、真实数据库不可用的负例在隔离依赖测试，不能破坏生产。生产环境CORS不放宽；不重复发送联系邮件给第三方。

- [x] **8. 真人验收与文档交接。** 请用户在dev两语界面验证：正常问答和具体项目内容、Markdown、主动停止、切语言/跨页不断流、375px输入。确认后在报告逐项写P4-AC01–10的ticket/命令/环境/证据/人工结果。没有真实数据库或真人结论时保持未完成，不只以build绿关票。

README/CLAUDE更新：SDK及直连供应商、两个协议、单例会话、IP配额共享/未知usage/非硬账单上限、仅服务端权限、UTC清理时间、已知限制。EXECUTION最新入口指向本计划；旧计划和旧状态标历史，不能误导下一次重复迁移。

- [x] **9. 停在审核门。** 交付实际diff、测试结果、风险/未验证项。即使总验收通过，也只代表可提交/发布；用户未明确授权时不commit/push/deploy。本票完成后不自动启动新的Phase。


## 用户追加范围（本票一并交付）

用户明确不增加“新对话”按钮，并要求prompt拒绝与本人无关的问题，防止通用API滥用。修改共享system prompt：只回答本人背景、经历、技能、项目、求职/联系、兴趣及本站相关问题；技术解释须直接服务于已知经历/项目，不能因技能表包含Python等名字就接受通用写代码、作业、翻译或创作。无关请求用用户语言简短拒答；混合请求仅答相关部分；相关追问延续当前话题，不能编造人物事实。不增加分类模型或第二次收费调用，不将prompt约束宣称为不可绕过的安全边界。补真实主用与受控主用失败后的真实备用正反例验证。


## 实际交付（2026-10-15）

- 引用扫描确认直接openai包、ChatRequest/ChatError没有caller，已移除；SDK OpenAI备用、合法runtime facade、旧SSE输出和邮件escapeHtml保留。迁移验收用真实模型transport与contact handler同时证明聊天原文保留、邮件HTML仍转义；新用例复用现成模块，没有为清理额外加产品功能。
- 用户追加prompt范围限制：原prompt真实算术题回答579，先RED；加入只答本人规则后，主用/备用的无关算术、翻译、通用代码、冒称本人授权均拒答，姓名/项目/追问正常，混合只答相关部分。备用拒答语言不稳定被真实探针抓到，最终按当前消息是否含汉字直接选择唯一拒答模板（buildSystemPrompt(input.message)），两家各8项真实探针通过。无新对话按钮、无新分类模型、无额外每轮API调用。
- 独立Postgres18测试全cleanup函数，真实Supabase17用安装函数与空表副本在独立schema事务中复验。测试数据/DDL全部回滚，实际公共函数anon/authenticated执行被拒绝；service_role在同权限副本执行正常。并发锁探针137ms内跳过busy IP，锁释放后的下一轮删除过期记录。
- Supabase初始pg_cron已预加载但未启用，先只读核对available1.6.4/timezoneGMT，再按官方方式启用。实际迁移20261015144154，本地文件改为匹配版本；job唯一、active=true、17 4 * * *、命令只调用本函数。重复应用仍一行，最终schema/test quota/test ledger残留均0；原cleanup_old_rate_limits hash前后不变。

## 验证结果

完整AC与边界见[验收报告](../../reports/phase4-chat-verification.md)。临时证据统一在/tmp/portfolio-phase4-evidence/。

| 检查 | 结果 |
| --- | --- |
| cleanup真实SQL RED→GREEN | 函数不存在失败后通过全函数保留/清理、幂等、权限；p4-04-cleanup-{red,green}.log |
| 实际Supabase隔离复验 | p4-04-real-cleanup.log通过，rollback完成，不全局清理访客记录 |
| 并发锁 | p4-04-cleanup-lock.log：137ms跳过占用IP，随后过期行移除 |
| 真实准入/计量 | p4-04-real-quota.log：40并发30/10，重复结算一次、冲突拒绝、旧窗隔离、已知37+未知1、100000门槛；synthetic精确清理 |
| pnpm test | 368/368，p4-04-unit.log |
| content:check / lint / typecheck | 全部通过，p4-04-{content,lint,typecheck}.log |
| production build | 通过，p4-04-build.log |
| 完整Playwright | 114/114，无跳过，p4-04-browser.log；只运行一条CLI |
| 真实主/备范围探针 | DeepSeek8/8；受控主用503后真实OpenAI8/8；p4-04-scope-{deepseek,openai}-final.log |
| 新SDK→真实Next v2 | 一次请求、v1协议、ready无error，姓名正确；输入1908/输出4/总1912，ledger/quota匹配，synthetic清理完成 |
| 旧Next真实HTTP | 200非空content/DONE、正常GoChatroom回答；输入1909/输出30/总1939，ledger/quota匹配，synthetic清理完成 |
| 整分支独立review | 0 Critical / 0 Important / 0 Minor，技术审查ship as-is；只读复核已有证据，未另跑外部服务/浏览器 |

## 实施修正与裁定

- Ruling：测试数据库使用本机已缓存Postgres18，而非强等postgres17镜像下载。原因：镜像拉取停滞，已停止本轮自己的拉取；同一SQL额外在真实Supabase17的隔离副本验证，覆盖版本差异。代价：本地SQL引擎版本不同，不能单独代替真实17证据。
- Ruling：cleanup保留仍有关联ledger的旧quota，即使该quota已超过24小时。原因：settle RPC必须先找到quota，不能保留ledger却破坏其晚结算/幂等路径。代价：最近结算/年轻pending可让旧quota多留一天，符合“至少保留”的spec。
- Ruling：cron时区GMT等价UTC，读取真实配置而不改共享数据库设置。作业使用04:17，不影响其他数据库功能。代价：未观察首次定时触发，配置和SQL行为已验证，运行日志需到时再看。
- Ruling：真实验证只在随机私有schema克隆安装函数及空表，不执行全局cleanup。原因：不为验收删除访客过期数据；anon/authenticated原函数执行负例仍真实运行并拒绝。代价：本轮不宣称对生产数据做过全局手动清理。
- 首次读cron.job因扩展未启用失败，后改为先读pg_extension/available/preload，再启用迁移；没有跳过AC08。迁移API自动版本20261015144154，未重复建立另一份迁移历史。
- 验证脚本初版缺pg_get_functiondef末尾分号，以及副本未授予FOR UPDATE所需UPDATE，真实隔离验证均先失败；修正脚本后通过，生产权限原本正确。失败事务回滚，最终私有schema残留0。
- pnpm remove不接受prefer-offline等安装选项，首次命令退出未改变产品；改用pnpm remove openai成功。README原有CLOUDFLARE_WAF_SETUP.md断链已在本票文档清理移除，保留现存基础设施说明。
- Final: Ruling：review未判定每日cron首次自动触发 — 本票验证配置/权限/SQL并明确还未到时；代价是首次实际运行仍需观察job_run_details。
- Final: Ruling：review未代替P4-04人工审核 — P4-01–03人工通过记录保留，当前只追加范围prompt审核；代价是用户确认前本票仍不关闭。
- Final: Ruling：review不承诺prompt穷尽绕过防御 — 按用户范围仅改共享prompt、保留限额，拒答仍消耗tokens；代价是不能保证对抗性输入永远不会得到无关答案。

## 已通过审核门（2026-10-17）

- [x] 产品代码、数据库调度、完整自动检查、真实服务及独立review完成。
- [x] 用户核对正常项目问答仍可回答、无关问题拒答，并确认本票结果（2026-10-17明确“通过”）。P4-01–03已通过的Markdown/停止/切语言/375px不重复要求人工重验。

不提交、推送、部署，不启动其他Phase；保留用户localhost:3000。临时测试数据库/测试服务交付前移除。

文档复核：11份当前入口/规格/票据/报告/README/CLAUDE文档共61个相对链接均有效；git diff --check通过。

## 最终审核结论（2026-10-17）

用户明确“通过”：本票与Phase 4整体审核完成，P4-AC10关闭。上文“待人工/首次定时未到”的描述保留为2026-10-15验收过程记录；本次仅录入用户审核，不新增测试或cron自动运行观察证据。未提交、推送或部署，后续提交/发布须另获明确授权。
