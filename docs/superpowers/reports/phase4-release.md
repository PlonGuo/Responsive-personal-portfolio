# Phase 4 发布记录

日期：2026-10-17。状态：Phase 4已提交、推送并发布Production，线上验收通过。本文及进度入口在后续仅文档提交中归档；该提交不改变已验收的应用代码。

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

- 应用提交：`f089bb937cadac4c22494688eeb75af65de620a4`（`feat(chat): migrate to AI SDK with shared sessions and IP quotas`）。功能分支`phase4-chat-ai-sdk`先推送生成Preview，检查通过后main快进到同一提交并推送；无强制推送、无冲突合并，保留功能分支。
- Preview：[部署地址](https://jason-portfolio-qzttbjbsi-huizhirong-guos-projects.vercel.app)，`dpl_2QMRE65pSzYM3Vvm3U5AymvWZfex`，READY；Git元数据匹配上述应用提交。24项远端冒烟、17项SEO检查通过，页面脚本异常0。Preview保留noindex/nofollow。
- Production应用部署：[部署地址](https://jason-portfolio-qgco19i8c-huizhirong-guos-projects.vercel.app)，`dpl_6YciXe5diCRJeq9d1LBaHa1SN1VQ`，READY，构建46秒；Git元数据为main/上述应用提交。独立生产构建已绑定[www.plonguo.com](https://www.plonguo.com)，不是直接晋升Preview产物。
- 合并后再次运行368个unit全部通过；线上25项远端冒烟、17项SEO检查通过，网络重试0，页面脚本异常0。双语首页/Lab/博客及9篇英文文章的canonical、alternate、OG与15条sitemap地址均使用www主域；Production为index/follow。`https://plonguo.com/zh`仍308到`https://www.plonguo.com/zh`。
- 深色主题en→zh保留同一document标记、联系表单草稿和主题；375px聊天对话框可打开且页面无横向溢出。图片、字体、OG图片正常，两份线上PDF的SHA256均与本地public文件相同，包含更新后的英文简历。
- 真实旧`/api/chat`收到正确姓名并完整DONE；真实`/api/chat/v2`经SDK解析得到正确姓名与finish，无关算术问题得到中文拒答；生产网页自身Origin下的SDK聊天完成、输入恢复可用且无错误提示。两个入口的恶意Origin均403，无效验证码邮件请求403，GitHub提交接口200且第二次命中缓存。
- Vercel该部署近15分钟请求日志可见真实访问，单独过滤`httpStatus >= 500`返回0条；运行时日志查询返回0条。此为本次短时间发布观察，不代表长期无故障。

## 验证边界与外部配置

- Preview域名不在现有Turnstile允许列表中，观察到110200（[Cloudflare官方错误码说明](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/)）；因此Preview API探针显式使用允许的生产Origin，不能当作Preview网页原生聊天验收。原生网页聊天已在生产www域名补验通过，未扩大CORS或验证码域名列表。
- 生产浏览器控制台有12条来自Cloudflare验证码iframe的消息，包括适配器、WOFF2、CSP及GPU提示；网站页面脚本异常为0。保留第三方边界，不把它们写成站点零控制台消息。
- 本轮未发送真实联系邮件，也未在生产强制制造DeepSeek故障来触发OpenAI；此前人工收件与真实OpenAI备用探针证据见[总验收报告](phase4-chat-verification.md)。数据库迁移不重跑，原配额并发与幂等验收不重复扰动生产访客数据。
- Vercel项目、环境变量名称/目标已只读核对，无密钥修改或输出；未改DNS、生产CORS、Turnstile域名、www主域约定或本机环境文件。全局CLI仍51.7.0，建议另行`pnpm add -g vercel@latest`；本次使用64.5.0临时运行。
- 发布证据保留在本机`/tmp/portfolio-phase4-evidence/`：部署元数据、远端冒烟/SEO结果、桌面/移动截图、运行时及请求日志。临时证据不提交。用户localhost:3000开发服务保留。
