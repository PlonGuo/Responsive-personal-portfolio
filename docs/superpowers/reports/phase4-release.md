# Phase 4 发布记录

日期：2026-10-17。状态：用户已明确授权提交、推送功能分支生成Preview，验证后发布Production；正在执行。

## 范围与前置证据

- 本地分支phase4-chat-ai-sdk，开发基线c541a75；发布包含尚未推送的c541a75（语言切换/英文PDF）及已审核的P4-01–04。生产原为8a7ebfb。
- P4-01–04人工审核与独立review均通过，代码/数据库/边界见[验收报告](phase4-chat-verification.md)。实际数据库迁移已应用，不重复迁移。
- 本轮发布前重新验证368unit、typecheck、lint、content:check、Production build及diff检查通过；原114Production浏览器用例证据保留。清理作业2026-10-16/17均04:17UTC自动运行succeeded。
- 使用临时Vercel CLI64.5.0（本机全局仍51.7.0），不改项目依赖或本地密钥。项目jason-portfolio、仓库根目录、Next.js、Node22、pnpm build配置已核对。

## 发布顺序

1. 仅暂存并提交本次明确的Phase4文件，排除环境文件、.claude、.vercel、构建产物及临时证据。
2. 推送phase4-chat-ai-sdk，等待Git集成Preview Ready并检查构建对应commit。
3. 验证Preview双语页面/切语言/主题/资源及PDF、新旧聊天协议与拒答、Origin/邮件无效token负例。保留Preview noindex，域名canonical仍为www.plonguo.com。
4. Preview通过后main快进到同一已验证提交，推送并等待Production单独构建；生产index/follow不能由Preview的noindex产物直接替代。
5. 检查www生产页面、语言切换、PDF、新旧聊天及错误日志；不改apex→www已有永久跳转，不发送真实联系邮件，不泄露密钥。

## 当前结果

提交/Preview/Production及线上验证结果将在完成后追加。未把排队/构建中当作发布成功。
