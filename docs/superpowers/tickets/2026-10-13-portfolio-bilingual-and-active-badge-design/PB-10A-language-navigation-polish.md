# PB-10A：语言切换等待、深色闪屏与英文简历同步

状态：本地实现、技术验收及用户审核通过；用户授权本地提交，未推送或部署。日期：2026-10-15。

配套：[spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[进度](progress.md)。这是发布后用户反馈的修正，不启动 Phase 4。

## 问题与边界

- 生产切换即使路由已预取，点击仍额外等待一次 HEAD 可用性检查。首次未缓存的页面仍可能需要网络等待，不承诺所有切换零延迟。
- 开发环境深色切换时，服务器根布局的 light class 可能短暂覆盖当前主题。帧采样记录到短暂 light；没有在该采样中重现整页白屏。
- 用户更新了 `src/assets/Huizhirong Guo.pdf`，下载实际使用 `public/Huizhirong Guo.pdf`，构建不会自动同步。

## 实现与验收

- [x] 页面挂载、路由/查询变化及入口 hover/focus 时预取另一语言，并提前进行 HEAD 检查。成功结果复用 5 分钟，检查最长 5 秒；失败不保留，点击可重试。准备完成后点击不再发重复 HEAD。
- [x] 保留目标校验、请求代次/来源保护、点击超时、Flight 错误保护、原页面恢复及会话/草稿保留。冷加载和失败路径仍按原规则检查。
- [x] locale 改变时在 layout effect 中使用内存主题恢复 DOM，在浏览器绘制前修正根 class；不重新读取可能过时的 localStorage。
- [x] 新英文 PDF 原样同步到 public，未修改内容。两份 SHA-256 均为 `c08e978e1dfdba0f9ee49aa830d86920d862ba0fefffe8184a46cb6e39b20c29`；开发 HTTP 下载 200 且字节一致。
- [x] README 说明下载目录及部署要求。保留用户源文件改动。

## 验证证据

- 回归先 RED：新增 5 项失败；实现后导航/主题专项 10 项通过。全量 unit 236 项通过。
- Production 构建、typecheck、lint、diff 检查通过。
- 浏览器专项 21 项、全量 Production 模式 110 项通过，无跳过。覆盖冷缓存失败、断流、草稿、滚动、历史与移动焦点；新增预热后无重复 HEAD 和深色连续切换逐帧断言。
- 开发帧采样：修复后连续切换只出现 dark 根 class，同一文档保留。独立只读审查无 Critical/Important/Minor 问题。
- 日志：`/tmp/portfolio-bilingual-evidence/language-polish-{red,green,unit,build,typecheck,lint,browser-focused,production-e2e}.log`；开发对照 `language-dev-before.log`、`language-dev-after.log`。

## 人工审核与发布限制

用户在本地复核后确认“本地没问题了，提交吧”，审核通过并授权本地提交。首次冷加载可有等待；线上尚未应用当前优化或新版 PDF，生产体验须发布后复验。本轮不推送、不部署。
