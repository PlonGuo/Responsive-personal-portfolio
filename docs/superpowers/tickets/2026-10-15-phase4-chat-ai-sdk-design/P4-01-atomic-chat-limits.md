# P4-01：原子 IP 限流与去重结算基础

状态：实现、技术验收及用户审核全部通过（含中文姓名回修，2026-10-15）。用户已通过“对照目录开始实现”授权本票；不提交/推送/部署。规格：§6、P4-AC03，P4-AC04 的数据库基础。

配套：[spec](../../specs/2026-10-15-phase4-chat-ai-sdk-design.md)、[全局约束](README.md)、[progress](progress.md)。

## 可交付结果和边界

当前 `/api/chat` 和浏览器交互继续工作，准入改为 30 次/IP/小时，换 session 不重置额度。结算具备原请求/原窗口和幂等保护。保留 OpenAI 客户端和旧 SSE；不安装 AI SDK，不创建 v2，不改前端会话，不配置 cron。

中间状态：旧客户端还没有供应商 usage，已尝试调用模型的请求记录 provider=legacy、usage 未知，不再把输出 chunk 数当 token。真实用量门槛在此票仅能验证数据库注入的已知计量，P4-02 才接入真实值；必须在交付中明确。

## Files 与先读 caller

- Read：`app/api/chat/route.ts`、`lib/api/chat-services.ts`、`lib/api/chat-route.ts`、`lib/api/chat-rate-limit.ts`、`lib/supabase/admin.ts`、`src/api/security.ts`、`lib/api/http.ts`。
- Create：`lib/chat/contracts.ts`（共享准入/用量契约）、`supabase/migrations/20261015085504_chat_ip_limits.sql`（只增新对象）。
- Modify：`lib/api/chat-rate-limit.ts`、`lib/api/chat-route.ts`、`lib/api/chat-services.ts`、`tests/unit/chat-rate-limit.test.ts`、`tests/unit/api-routes.test.ts`、`tests/unit/chat-services.test.ts`。
- Create：`tests/integration/chat-quota.sql`（事务内正反例）、`scripts/verify-chat-quota.ts`（显式运行的外部数据库验证）、`tests/unit/chat-quota-contract.test.ts`。
- Update：本票、progress；README 只记新限流与未知用量中间状态。

先运行：

```bash
rg -n 'ChatServices|ChatLimit|createChatLimiter|\.limit\(|\.account\(' app lib src tests
git status --short --branch
```

## Interfaces

创建 `lib/chat/contracts.ts`，P4-02/03 使用以下名字，不自行改成不同结构：

```ts
export interface ChatPermit { requestId: string; ipKey: string; windowId: string }
export type Admission = { status: 'allowed'; permit: ChatPermit }
  | { status: 'limited' | 'unavailable' };
export interface AttemptUsage {
  provider: 'legacy' | 'deepseek' | 'openai';
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}
export interface UsageReport {
  attempts: AttemptUsage[];
  termination: 'complete' | 'aborted' | 'error';
}
export interface ChatQuota {
  admit(ipKey: string, requestId: string, signal?: AbortSignal): Promise<Admission>;
  settle(permit: ChatPermit, report: UsageReport): Promise<void>;
}
```

ChatServices 改为继承 ChatQuota，保留 verify 和本票原有 stream 签名，删除 limit/account。requestId 由服务器 crypto.randomUUID 创建，sessionId 不用于额度。settle 一次性提交整个 report，数据库由 requestId 去重，不按 chunk/回调调用次数累计。

数据对象固定为：

- `chat_ip_quotas`：ip_key 主键、window_id uuid、window_start、request_count、token_count bigint、unknown_usage_count、last_request。
- `chat_usage_requests`：request_id uuid 主键、ip_key、window_id、created_at、settled_at、report jsonb。report 未结算为 SQL NULL；未拿到 usage 的各数字为 JSON null。
- RPC `admit_chat_request(p_ip_key text, p_request_id uuid)` 返回 status 和 window_id。
- RPC `settle_chat_usage(p_request_id uuid, p_report jsonb)`，返回 settled/already_settled；不存在请求、非法或冲突 report 抛错。客户端 permit 仅作关联校验，实际 ip/window 从数据库请求行读取。

数值须为非负安全整数或 null，attempts 最多两项，legacy 仅能单独出现。已知 total 优先用提供值；没有 total 但 input/output 均有效时用两者之和；否则该 attempt 的已知 total 为未知，不用缺失值补零。input/output之和与全部attempts之和也必须在安全整数范围内。unknown_usage_count 按含未知 total 的请求加一次；已知 attempts 的 total 仍累计。

## 实施与验证步骤

- [x] **1. 建分支并确认现状。** 仅首次执行创建 `phase4-chat-ai-sdk`，保留当前未提交文档。只读核对真实数据库的表、约束、RLS、grants、同名函数与扩展；不输出现有计数行/IP 或凭证。记录新对象无冲突；若同名对象不兼容，先报告再调整迁移，不覆盖。

```bash
git switch -c phase4-chat-ai-sdk
pnpm exec vitest run tests/unit/chat-rate-limit.test.ts tests/unit/api-routes.test.ts
```

- [x] **2. 先写准入 RED。** 用 Supabase SDK 自定义 fetch transport 返回新 RPC 行；断言只发一次 admit RPC，数据库拒绝或非法行不调用模型。测试不是 `expect(30).toBe(30)`：必须调用真实 limiter/route。

```ts
const gate = await limiter.admit('127.0.0.1', requestId);
expect(gate).toEqual({ status: 'allowed', permit: {
  requestId, ipKey: '127.0.0.1', windowId,
} });
expect(transport).toHaveBeenCalledTimes(1);
expect(String(transport.mock.calls[0][0])).toContain('/rpc/admit_chat_request');
```

新增：缺配置、RPC 超时/HTTP 错误、空/多行/非法 status、非法 UUID/window、limited、token_count=100000 均失败关闭。运行目标测试，看到新接口缺失或断言失败并保存 RED，不把未安装依赖失败当业务 RED。

- [x] **3. 写事务迁移。** 准入先创建/锁住 IP 行，按数据库 clock_timestamp 在锁内判断一小时是否到期并生成新 window_id。拒绝时不插入 request ledger、不增加 admitted request_count；放行时同事务计数+ledger，任何失败整体回滚。关键语句形状：

```sql
create table public.chat_ip_quotas (
  ip_key text primary key check (length(ip_key) between 1 and 200),
  window_id uuid not null default gen_random_uuid(),
  window_start timestamptz not null default clock_timestamp(),
  request_count integer not null default 0 check (request_count between 0 and 30),
  token_count bigint not null default 0 check (token_count >= 0),
  unknown_usage_count integer not null default 0 check (unknown_usage_count >= 0),
  last_request timestamptz not null default clock_timestamp()
);
create table public.chat_usage_requests (
  request_id uuid primary key,
  ip_key text not null,
  window_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  settled_at timestamptz,
  report jsonb,
  check ((settled_at is null) = (report is null))
);
create index chat_usage_requests_created_at on public.chat_usage_requests (created_at);
create index chat_usage_requests_ip_window on public.chat_usage_requests (ip_key, window_id);
```

ledger 不对当前quota行建立外键，以便跨窗口审计和两类记录按各自期限清理。RPC同一requestId重入时，若IP相同返回原permit且不再占名额，IP不同则报错；已结算requestId不能启动新生成。应用层requestId仍必须每次生成，不能从客户端接收。

```sql
insert into public.chat_ip_quotas (ip_key) values (p_ip_key)
on conflict (ip_key) do nothing;
select * into v_quota from public.chat_ip_quotas
where ip_key = p_ip_key for update;
-- 在锁内完成过期重置、30/100000门槛判断和放行计数。
-- ledger插入失败必须回滚同一事务里的额度更新。
```

准入和结算统一按“先IP quota行、后ledger行”的锁顺序；结算可先不加锁读取ledger获得IP，再锁quota并锁ledger重新确认，避免准入重入与结算形成锁循环。按report相等性做幂等；跨窗仍写ledger，但仅匹配原window_id才给当前quota加用量。数据库死锁/超时仍失败关闭，禁止客户端盲目重试付费模型。

```sql
update public.chat_ip_quotas
set token_count = token_count + v_known_tokens,
    unknown_usage_count = unknown_usage_count + v_unknown_request
where ip_key = v_request.ip_key and window_id = v_request.window_id;
```

SQL 对 p_ip_key 长度/空值、report shape 和整数类型也校验，不只信 TypeScript。使用 schema 限定名与 `set search_path = ''`；RLS、角色撤权/授权与 contact migration 一致。旧 `chat_rate_limits`、cleanup 函数及 contact 表均不改。

- [x] **4. 实现 RPC adapter 与 route 接线。** 两个 RPC 均独立 5 秒上限；admit 受请求剩余截止时间约束。route 在模型前取得 permit，接收用户原 sessionId 供原模型请求使用。只要模型启动过，complete/abort/error 均以 legacy 未知报告结算；模型未启动且已准入用 `attempts: []`，不伪造一次供应商消费。

```ts
const admission = await services.admit(ip, crypto.randomUUID());
if (admission.status === 'unavailable') return fail(503, 'SERVER_ERROR', 'Service temporarily unavailable');
if (admission.status === 'limited') return fail(429, 'RATE_LIMIT', 'Rate limit exceeded. Please try again later.');
// 允许后用 admission.permit 关联最终 settle，任何路径最多生效一次。
```

统一 finally 完成结算并保留 after 生命周期；模型启动前失败也不能漏掉已准入 ledger。结算失败日志只含事件名/requestId/阶段，不含 IP、用户正文、原始数据库错误。不能在 settle 之前发送正常 DONE；取消不为等待用量而继续上游。

- [x] **5. 写去重/跨窗 RED→GREEN。** 单元 transport 断言 settle 只传 permit.requestId 和规范化 report，不再 GET token_count 后 PATCH；非法数字、SQL 错误、conflict 均抛出，不能被当成功。集成 SQL 事务里写专用测试 IP/UUID、执行 RPC、RAISE EXCEPTION 断言结果后 ROLLBACK。

```sql
-- 测试中用固定非真实IP键和独立UUID；以下断言前由fixture建立请求并结算37 tokens。
do $$ begin
  if (select token_count from public.chat_ip_quotas where ip_key = 'p4-test-idempotency') <> 37 then
    raise exception 'usage must be counted exactly once';
  end if;
end $$;
```

必须覆盖：相同报告重复、不同报告冲突、未知+已知混合、负数/小数、窗口刚过期/旧窗口晚到、缺 ledger、结算失败导致旧 SSE error 而非正常 DONE。

- [x] **6. 真实数据库验证并读回权限。** 在批准实施本票的范围内应用新增迁移；验证 40 个并发独立连接 admit，同一测试 IP、不同 session，恰好30放行/10拒绝。另测边界重置、100000门槛、重复/跨窗结算；匿名及 authenticated 调用返回权限拒绝，service_role 成功。脚本只能删除自己记录的 requestId/IP，数据库断言失败必须非零退出。不要只用 mock 证明原子性。SQL失败按原执行约束报告并暂停，不静默绕过。

- [x] **7. 回归并交付。**

```bash
pnpm exec vitest run tests/unit/chat-rate-limit.test.ts tests/unit/chat-quota-contract.test.ts tests/unit/api-routes.test.ts tests/unit/chat-services.test.ts
pnpm typecheck
pnpm lint
```

本机手动正常聊天，证明旧界面/协议仍可用；补跑 `tests/e2e/api-routes.spec.ts` 与 `session-lifetime.spec.ts` 的受影响用例。记录 schema/权限/并发证据及“真实 usage 尚未接入”。更新 progress 后停，等待用户审核；不提交、不进入 P4-02。


## 实际交付（2026-10-15）

- 代码位于本地phase4-chat-ai-sdk分支，未提交/推送/部署，P4-02未开始。共享caller已核对；ChatServices继承ChatQuota，现有模型客户端和旧SSE保留。
- RPC准入和结算实现完成；真实Supabase项目personal website / leotovftixgkszdwylzu已应用新增迁移，远端版本20261015085504，本地文件名与之对齐。新表RLS=true、policies=0、公开角色表授权/函数执行权限均为0；原chat_rate_limits/contact表与cleanup函数保留。
- TDD证据：准入专项21项先RED（缺admit/settle）；路由/供应商专项11项先RED；SQL事务测试先因函数不存在失败，迁移后通过。未知/已知用量规范化及取消回归合并后全量273项unit通过。
- 真实数据库：40个并发HTTP/RPC恰好30放行/10拒绝，10个并发相同结算只加37一次，冲突报告拒绝；跨窗、混合已知/未知、100000门槛及service_role/anon/authenticated正反例通过。事务SQL在隔离Postgres18及真实Supabase Postgres17均通过；测试synthetic记录已清理。
- 真实本地dev聊天HTTP200、非空SSE、DONE（约4.0秒）；读回ledger为legacy/null用量、complete，quota request_count=1/unknown_usage_count=1，不再把分片数计为token。仅清除此测试的精确requestId/测试IP记录；没有删除用户记录。
- Production构建（含content:check）、最终typecheck/lint通过。浏览器CLI本想筛选两文件，但当前命令中的`--`未按预期筛选，实际运行全量110项且全部通过；后续命令改为直接pnpm exec playwright test传文件。
- 过程失败已纠正并保留日志：Node直连管理API网络失败后先只读确认未迁移，再通过现有本机代理完成迁移；没有重配系统网络或密钥。fake timers不控制原生AbortSignal.timeout，测试时钟适配后通过；类型检查先发现联合类型收窄、后发现测试mock字面量推断，均已修正并重新通过。首次网络失败的外部验证清理失败发生在新表尚未创建时；迁移后完整重跑并清理成功。
- 本票自行复核，无独立reviewer；整个Phase4结束时再按执行技能进行整分支独立审查。未安装AI SDK，不声称真实token计量已经完成。等待用户审核正常聊天、主动停止与切语言保持体验。

证据目录：/tmp/portfolio-phase4-evidence/。主要文件：p4-01-{baseline,admit-red,contract-red,route-red,limiter-green,route-green,unit-final,typecheck-final,lint-final,build,e2e}.log；p4-01-real-quota.log、p4-01-sql-{red,green}.log、p4-01-sql-remote.json、p4-01-permissions.json、p4-01-dev-chat.json、p4-01-real-chat-ledger.json。

### 审核回修：明确中文全名

用户明确要求AI准确使用“过汇智融”。已在共享system prompt补中文全名、姓/名拆分、英文对应，以及纠正历史错误写法的规则；网页姓名原本正确，不改页面。两项主用/备用transport回归先失败后通过，最新全量unit275项、typecheck/lint通过；真实新对话及带错误姓名历史均回复“过汇智融”。本轮未重复无关浏览器/构建检查，未开始P4-02，未提交或部署。


2026-10-15 用户确认“审核全部通过”，本票及中文姓名回修正式通过。P4-02尚未开始；无提交、推送或部署授权。
