import type { PortfolioText } from '../../lib/content/types';

export const zh: PortfolioText = {
  profile: {
    name: '过汇智融（Jason）',
    shortName: 'Jason / 过汇智融',
    title: 'AI Agent 与大模型应用工程师',
    bio: '我开发 AI Agent 和大模型应用，具备全栈工程与生产环境后端经验。我习惯通过量化评测做技术选型，让数据而非直觉决定方案。',
    aboutDescription: '专注于 AI Agent 与大模型应用开发，具备全栈工程和生产环境后端经验。选择架构与模型时，我优先用量化评测验证方案。拥有中美两地实习经历，可以使用中英文工作。',
    focus: ['Agent 架构与工具循环', '检索增强生成（RAG）流水线', '大模型评测与成本优化', '生产环境后端（Go / Python / TypeScript）'],
  },
  heroLines: ['过汇智融', 'AI Agent 工程师', '大模型应用开发者', '全栈工程师'],
  education: {
    'northeastern-ms-2024': {
      degree: '计算机科学理学硕士', school: '东北大学', college: '库里计算机科学学院',
      period: '2024 年 9 月 – 2027 年 5 月（预计毕业）',
    },
    'santa-clara-bs-2020': {
      degree: '计算机科学理学学士', school: '圣塔克拉拉大学', college: '文理学院',
      location: '美国加州硅谷', period: '2020 年 9 月 – 2024 年 6 月',
    },
  },
  experience: {
    'saisuode-agent-2026': {
      title: 'Agent 算法实习生', company: '赛索德智能', companyNote: '具身智能',
      location: '中国，上海', period: '2026 年 9 月 – 2026 年 12 月',
      summary: '机器人端 Agent 架构与核心算法',
      highlights: ['负责机器人端 Agent 架构搭建，以及核心算法的设计与实现。', '与运控、视觉团队协作，负责 Agent 与运动控制、视觉感知模块的联调。'],
    },
    'bosch-email-2026': {
      title: 'Agent 开发实习生', company: '博世中国', location: '中国，无锡',
      period: '2026 年 5 月 – 2026 年 8 月', summary: '邮件助手 — 主导 Dify 后端工作流（日活 100+）',
      highlights: [
        '主导邮件助手后端工作流设计与落地，支持未读邮件批量摘要与多轮回复草稿；设计多工厂租户路由与成本隔离、轻量模型前置分流及异常自动降级，在控制模型调用成本的同时支撑多工厂稳定使用。',
        '基于 30 条真实邮件样本建立架构与模型对比评测，以端到端延迟与输出质量驱动技术选型；从 Agent 转为 Workflow，使 P95 从 52s 降至 18s；进一步实施模型分层路由，使 70% 样本耗时再降 50%+，质量无下降。',
        '在平台由他方统管、无数据库权限的约束下，通过并行分支埋点并复用平台去重能力，将用量监控从应用级细化至用户级，支持用户维度的调用量与成本追踪。',
      ],
    },
    'bosch-scheduling-2026': {
      title: 'Agent 开发实习生', company: '博世中国', location: '中国，无锡',
      period: '2026 年 5 月 – 2026 年 8 月', summary: '智能排班系统概念验证（POC）',
      highlights: ['将物料、运力、人车时段等约束建模为 5 张 MySQL 表，将取数能力封装为 MCP 服务并编写排班 Skill，使 deepagents Agent 可基于实时约束生成排班方案并通过多轮对话动态调整，将固定规则排班转化为自然语言驱动的交互式决策 POC。'],
    },
    'next-play-2025': {
      title: '软件开发实习生', company: 'Next Play Games', location: '美国加州圣何塞',
      period: '2025 年 9 月 – 2025 年 12 月', summary: 'B2B SaaS 教练平台',
      highlights: [
        '主导 B2B SaaS 教练平台全栈开发；建立版本化数据库迁移流程，在 PR 和合并后分别经 CI 校验，再同步至开发与生产环境，并配套回滚策略，解决多人并行开发下的数据库结构漂移风险。',
        '重构数据链路：采用 Supabase 前端直连与 RLS 隔离，将业务逻辑下沉为 Postgres RPC，端到端 P95 从约 420ms 降至约 170ms；将移动端 1 秒轮询改为 Realtime WebSocket 订阅，单端日均请求从约 29,000 次降至少量请求。',
        '主导团队 AI 辅助开发：通过 AGENT.md 统一 10+ 人团队的 Coding Agent 开发规范，3 名新成员据此完成入职接入；通过 GitHub Actions 接入 AI PR review，让大体量 AI 生成代码可审阅，CI 失败时自动创建 issue 跟踪。',
        '基于 OpenAI API 开发 AI 教练功能，搭建自动化微调流水线：累计 200+ 条样本，完成 5 轮全自动迭代，零人工介入。',
      ],
    },
    'geshang-fuxin-2025': {
      title: '后端开发实习生', company: '北京格上富信', location: '中国，北京',
      period: '2025 年 6 月 – 2025 年 8 月',
      highlights: [
        '在 7 年历史的 Flask/MongoDB 代码库中维护与新增 5 个核心 RESTful API，向后兼容扩展，生产零中断、无回归。',
        '优化列表接口的数据返回策略，引入分页替代全量查询，接口响应时间从 300–500ms 降至 200ms。',
      ],
    },
  },
  projects: {
    knowhive: {
      title: 'KnowHive', tagline: '本地优先的 RAG + Agent 知识库桌面应用',
      description: '本地优先的知识库桌面应用，包含混合检索、Agent 工具层、长期记忆和注入防御；每次检索改动都先通过 RAGAS A/B 验证，再设为默认方案。',
      highlights: [
        '检索链路：设计统一文档中间层，按文档类型选择分块策略，采用父子块结构；向量与 FTS5 关键词双路召回，经 RRF 融合、交叉编码器精排后展开父块补全上下文。经 RAGAS A/B 验证，context_precision 从 0.788 提升至 0.862 后才设为默认；另修复 FTS5 不切分中文导致关键词检索静默失效的问题（recall +0.054）。',
        'Agent 工具层：在 AI SDK 工具循环上自建 7 个知识库与会话历史工具，加入调用上限与重复检索拦截，保证产出文本回答；写操作默认拒绝（fail-closed），需人工审批（HITL）。',
        '长期记忆：将历史对话提炼为语义、偏好、情景三类记忆，分别走向量召回或直接注入；答案仅存在于历史对话中的问题，正确率从 0% 提升至 100%。',
        '拒答与注入防御：基于精排分数设置拒答阈值，无解问题正确拒答率从 32% 提升至 91%（误拒 4%）；通过 spotlighting 隔离外部内容，使注入攻击成功率从 0.40 降至 0.27。后续一次重构使成功率回升至 0.47，在合并前被自建红队测试发现。',
      ],
    },
    'mom-test-validation': {
      title: 'AI 驱动的 Mom Test 创业验证访谈',
      description: '实时语音 AI 访谈助手，使用 Mom Test 框架开展减少诱导偏差的创业验证访谈，并分析访谈记录，提取经过验证的痛点与洞察报告。',
    },
    'smia-agent': {
      title: 'SmIA — 社交媒体智能分析 Agent',
      description: 'AI 驱动的内容分析平台，聚合并分析 Reddit、YouTube 和 Amazon 的内容，通过情感分析与交互式可视化生成结构化趋势报告。',
    },
    'go-chatroom': {
      title: 'GoChatroom',
      description: '使用 Go 构建的实时聊天后端，支持私聊、群聊和 P2P 视频通话；React 前端部署在 Vercel，服务端部署在 Fly.io。',
      highlights: [
        '采用每连接一个 goroutine、读写协程分离和有缓冲 channel，实现非阻塞消息传递；对聊天和信令采用差异化背压。性能分析定位出 Hub 事件循环内同步持久化导致的吞吐瓶颈，并提出异步化与分片方案。',
        '实现无状态 JWT 鉴权（业务接口零数据库查询）与 Redis 会话管理；自建 WebRTC 信令服务，支持 ICE 候选排队，以及信令、媒体两级断线恢复。',
      ],
    },
    'travel-agent-booking': {
      title: '旅行代理预订管理系统',
      description: '面向旅行代理的预订管理系统，统一跟踪机票、酒店和保险付款，并管理客户支付记录。',
    },
    flowboard: {
      title: 'Flowboard',
      description: '实时协作看板，集成 AI 助手和交互式白板，使用 .NET 8 与 Angular 17 构建。',
    },
    sportlingo: {
      title: 'Sportlingo 教练工作台',
      description: '面向企业客户的教练工作台，提供团队管理与数据分析，支持将用户加入团队、查看个人进展和追踪表现指标。',
    },
    makeform: {
      title: 'Makeform.ai',
      description: 'AI 驱动的在线表单平台，帮助用户设计与部署动态表单，提高工作效率与用户参与度。',
    },
    'github-finder': {
      title: 'GitHub Finder',
      description: 'GitHub 账号搜索应用，支持搜索任意 GitHub 账号并浏览其资料。',
    },
    'food-ecommerce': {
      title: '食品电商平台', description: '用于浏览与购买食品的在线商店。',
    },
  },
};
