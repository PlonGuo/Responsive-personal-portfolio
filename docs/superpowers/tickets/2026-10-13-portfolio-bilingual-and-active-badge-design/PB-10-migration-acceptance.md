# PB-10：迁移总验收、清理与交接

状态：已完成，用户审核通过（2026-10-15）；TUN恢复后AC-13真实接口复验通过。阶段：Phase 3。依赖：PB-01–09、原 Task 13、PB-09A（原 Task 16 图片优化）审核通过。规格：全部；AC-01 至 AC-13。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

闭合所有验收条件，删除失效 Vite/旧内容入口，交付有证据的回归报告。此票不部署、不推送，不提前启动需 DeepSeek key 的 Phase 4。

## Files

- Modify：`package.json`、`pnpm-lock.yaml`、`tsconfig.json`、`eslint.config.js`、`README-portfolio.md`、`CLAUDE.md`、`docs/superpowers/plans/EXECUTION.md`。
- Retire：`index.html`、`vite.config.ts`、`tsconfig.app.json`、`tsconfig.node.json`、`src/vite-env.d.ts`（若实际存在）、`src/data/portfolio.ts`、`src/data/blog-posts.ts`、`src/data/posts/*.ts`；删除前查 caller。
- 原 `api/` 和 `vercel.json` 的退役按已完成原 Task 13 的实际产出核对，不重复删除、不删除 app/api。
- Create：`tests/e2e/migration-regression.spec.ts`、`docs/superpowers/reports/portfolio-bilingual-verification.md`。

## Interfaces

最终脚本：dev/build/start 使用 Next，build 先 content:check；lint 使用 eslint .；test 使用现有 Vitest；test:e2e 使用 Playwright；fonts:check 使用 PB-08 脚本。legacy `*:next` alias 可保留或指向同一命令，不能仍指 Vite。

报告每个 AC 写：实现 ticket、实际命令/环境、结果、证据路径、人工检查结论、未验证事项。阶段状态只有全部 required AC 通过且人工检查完成才标完成；桩测试与真实 API 验证分栏。

## 实现步骤

- [x] 对照 spec 第 3–9 节逐项读取实际 diff，确认两语内容完整、所有当前项目 false、博客没翻译、PDF 对应、iframe/外链/Demo 保留。保护用户更改，不从旧文件恢复过时事实。
- [x] 搜索 retire 文件 caller 后移除无引用内容及 Vite 依赖。`src/components` 不整体搬家；Vite 静态资源在 PB-04 已迁移。更新本地上下文文档中的框架、字体、语言、路径和脚本，旧执行模板链接转到本计划及票据。

```bash
rg -n 'react-router-dom|data/portfolio|data/blog-posts|vite/client|import.meta.env' src app lib content
rg -n 'vite|next lint|Space Grotesk|DM Sans|英文读者' package.json README-portfolio.md CLAUDE.md
```

Expected：产品源码无失效依赖；历史文章中讨论 Vite 的代码示例不改、不算运行时引用。移除 package 依赖使用 `pnpm remove vite @vitejs/plugin-react @tailwindcss/vite react-router-dom` 前核对实际安装，保留 Phase 2 测试所需独立工具。

- [x] 新浏览器 context 跑全部 AC 路径；重新检查 308/404、无 JS 中文、文档未 reload、主题/聊天/表单保留、失败重试、减少动画、字体预算、sitemap，收集 console/pageerror 和截图。
- [x] 验证真实 `/api/chat`、`/api/send-email`、`/api/github-commits` 的迁移后契约与 Phase 2 的负例。安全负例/数据库不可用路径不在生产故意破坏；使用隔离测试环境。邮件测试发给其他人须有明确用户授权，否则报告未验证并保持 AC-13 未完成，不用 UI 桩掩盖。
- [x] 运行最终命令并记录退出码。pnpm build 是生产构建；测试服务器使用生产 start，不能只在 dev 下看效果。

```bash
pnpm run content:check
pnpm run lint
pnpm exec tsc --noEmit
pnpm run test
pnpm run build
pnpm run test:e2e
```

字体计量使用独立启动的生产服务器后 `pnpm run fonts:check`，两语新冷缓存。若已有 test:e2e webServer 占用 3000，先结束自己的测试服务器再启动，不终止用户其他进程。

- [x] 人工核对中文事实、PDF 内容对应和 375/768/1440px 两语深浅主题；将 AC-01–13 逐项填进报告。未执行项写未验证并说明实际原因；失败不能打勾或关票。

## 验收与交付

交付真实构建/测试结果、每 AC 的证据、必要人工结论、已清理路径和 Phase 4 接缝。此轮代码实现完成也不等于授权部署；不 git push，不把生产 SEO/字体预算结论从开发服务器推断。

## 当前交付与阻塞

[总验收报告](../../reports/portfolio-bilingual-verification.md)已按AC-01–13逐项记录命令、证据及人工结果。209项unit、108项Production浏览器、构建/typecheck/lint/内容/字体检查通过；中文事实与PDF对应关系本轮用户确认。

真实GitHub fresh200但缓存写入失败；聊天503、邮件含无效token时限流前置503；数据库Node/curl请求均连接重置，密钥仅检查已配置且未输出值。AC-13保持未通过，不能据自动化或历史成功关票。用户开发服务保留；无提交、推送、部署或Phase4启动。

独立最终审查发现中文输入法确认Enter会误发送，已补isComposing/229保护及Shift+Enter单行保留，2项先RED后GREEN；回修后全套Production108/108通过。总验收报告保留AC-13网络失败，未关票。


## 用户追加：DeepSeek 主用、OpenAI 备用（2026-10-15）

已实现，等待用户审核；此为本票聊天可用性追加，不启动 Phase 4。

- 默认直连 DeepSeek；首段内容前 HTTP/连接/流错误、空流或 8 秒无内容时，仅转 OpenAI 一次。已开始输出不拼接供应商回答；用户取消及整体 20 秒截止时间不触发重试。两家 SDK 重试关闭，Supabase 限流仍先执行。
- 服务端 `OPENAI_API_KEY` 作为备用，`OPENAI_MODEL` 默认 `gpt-4.1-mini`；DeepSeek 默认不变。固定两家端点、隔离参数和凭证；未输出或修改 `.env.local`，未修改 Vercel 配置。
- 25 项 provider/route 专项（含备用输出后取消与计费）、全量 231 项 unit、21 项生产浏览器回归、Production 构建、lint/typecheck/root tsc 通过。初次 RED 10 项失败，再实现通过；首轮类型检查发现 generator.return 参数缺失，修正后通过。证据 `fallback-{red,green,unit,e2e,build,lint,typecheck,root-tsc}.log`。
- 独立只读审查 Critical/Important 0；Minor 建议备用输出后取消的联合测试，已补并通过。
- 真实 DeepSeek 直连 200 且有回复；模拟主用失败后，真实 OpenAI 连接 ECONNRESET；完整开发聊天仍因 Supabase 返回 503。不能把模拟成功写成真实备用成功。
- 网络对照已定位：URL 形状正常、DNS 成功、无 fake-IP；macOS 系统代理开启但终端无代理环境配置，Node 和 curl 直连连接重置。仅在诊断 curl 中显式使用现有系统代理后，Supabase REST 和 OpenAI 都返回预期的无凭证 401，证明该代理路径可达。未更改系统代理/网络设置；数据库鉴权/表权限及真实备用生成尚待经过可达路径复验。证据 `fallback-live-{model,openai,route}.json`、`fallback-supabase-network.json`。

AC-13 保持未通过，等待终端网络修复后的真实接口复验；不提交、不推送、不部署。


## 最终关闭与发布授权（2026-10-15）

用户已确认所有验证通过并授权发布。网络恢复后重新验证：真实开发聊天200、非空SSE及DONE；邮件无效token403/VERIFICATION_FAILED；GitHub首次fresh200、随后cached:true；受控模拟DeepSeek503后，真实OpenAI200且非空。用户对真实邮件成功收件的既有确认保留，未额外向第三方发信。证据 `release-real-api.json`、`release-real-openai.json`。AC-13通过，PB-10关闭，Phase3完成；Phase4独立后做。此前失败和未授权状态均为历史记录。

发布仅限当前迁移：明确路径提交、推送nextjs-migration并验证Preview，再使用Production环境重建发布；保留生产前一部署作为回退目标。Vercel项目jason-portfolio旧Other/dist改为Next.js/默认输出，build使用pnpm build；保留Node22和已有设置；仅补缺失的运行时变量，不打印秘密。

2026-10-15 发布追加：f53ffec已推送迁移分支并通过Preview21项线上检查，随后main生产重建Ready。线上发现原有apex→www永久跳转与计划中的canonical不一致，用户明确选择保留www.plonguo.com主域，授权统一SEO；SITE_URL、初始HTML/分享地址、sitemap/robots测试与spec同步，域名跳转规则不改。此SEO补发仍属本次发布，不启动Phase4。发布中出现用户新修改src/assets/Huizhirong Guo.pdf，保留未提交，public简历仍为已审核版本。
