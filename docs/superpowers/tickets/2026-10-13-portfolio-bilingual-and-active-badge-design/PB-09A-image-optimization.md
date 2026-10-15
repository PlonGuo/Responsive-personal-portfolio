# PB-09A：补齐原 Task 16 图片优化

状态：实现、技术验收及用户审核通过（2026-10-15）。阶段：Phase 3。依赖：PB-09。PB-10 的前置工作。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)、[实施计划](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)、[原 Task 16](../../plans/2026-10-09-portfolio-content-and-nextjs-migration.md)。

## 范围

用户审核通过PB-09并要求继续。原Task16图片部分仍未实施，将其整理为独立票据补齐；本轮不启动PB-10总清理或Phase4，不提交、推送、部署。主题首帧及切换已由PB-05/06验收，不重复实现，只跑回归。

## 实现与验收

- [x] 记录图片原始尺寸和字节数，备份待修改原图到仓库外。
- [x] 将9.07MB个人照片缩至最长边1200px、JPEG质量82，保留构图及路径；压缩导航头像及超过300KB的当前项目图片。大PNG转WebP，更新共享项目路径，查完caller再删除对应旧PNG。
- [x] About、项目轮播、Lab、导航头像、可选博客封面改为`next/image`，给出准确尺寸或固定容器与sizes，保留alt、动画、裁切与布局。非首屏图片保持lazy，不照抄旧priority示例；技能SVG保持原方式。
- [x] 先写图片资源预算及生产浏览器用例，确认旧实现失败，再实现并验证真实图片解码、响应体积、375/768/1440px布局与两语深浅主题。可选博客封面用测试数据单独验证，不改现有英文文章。
- [x] 内容、unit、typecheck、lint、Production构建与完整浏览器回归通过；重测主题首帧，记录public与.next/static体积、逐图字节数及截图，停止等待审核。

## 文件

`public/images/*`的已引用大图、`content/portfolio/shared.ts`、`src/components/{About,Header,Portfolio,LabView}.tsx`、`src/components/blog/BlogCard.tsx`、`tests/e2e/images.spec.ts`、`tests/unit/blog-card-image.test.tsx`及关联执行文档。当前未配置的文章详情封面不改，保留自然比例；只在BlogCard既有aspect-video容器接入Image。

旧`src/data`中图片路径由PB-10统一退役；它们没有运行时调用者，不把过时内容恢复到新内容层。不清理未引用图片或改变博客正文、API与字体。

## 图片结果（字节）

| 图片 | 原文件 | 优化后源文件 |
| --- | ---: | ---: |
| self-pic.jpg | 9,065,407 | 69,540 |
| jason-clipart.jpg | 428,074 | 9,710 |
| e-commerce.jpg | 340,930 | 60,991 |
| coach_dashboard.png → .webp | 575,192 | 52,038 |
| mom-test-interviewer.png → .webp | 775,849 | 18,026 |
| flowboard-demo.png → .webp | 380,593 | 60,906 |
| smia-agent.png → .webp | 526,966 | 83,372 |
| travel-agent-booking-system.png → .webp | 382,840 | 84,376 |

`public/`实际文件合计14,559,212 → 2,522,320bytes；`.next/static/`约1.2MiB。个人照片保持2:3源图比例和原有居中裁切，五张WebP保持原尺寸；JPEG缩放及有损压缩的视觉效果需用户审核。原图备份在仓库外`/tmp/portfolio-bilingual-evidence/pb09a-original-images/`。

Production真实浏览器、全新上下文测得个人照片响应为WebP：375px/DPR1为6,022bytes、375px/DPR2为23,656bytes、1440px/DPR1为11,244bytes、1440px/DPR2为23,656bytes。DPR为屏幕像素密度倍率，2表示横纵方向各按两倍像素绘制；这些是具体视口/密度的测量，不泛化为所有设备。源文件69,540bytes与浏览器按尺寸实际收到的图片分别记录。

## 人工审核入口

1. 打开`http://localhost:3000/zh#about`和`/en#about`，检查个人照片、顶部头像是否清晰、裁切是否合适。
2. 滚到项目轮播，依次切换六个项目，检查图片、动画和Demo/GitHub按钮。
3. 打开`http://localhost:3000/zh/lab`，检查十个项目图；在375/768/1440px及深浅主题下查看。

现有文章未配置封面，BlogCard的可选封面由真实Image组件静态渲染测试覆盖，不宣称已有封面浏览器解码验收。文章详情的自然比例封面分支保持原状。只有Lab首张项目图即时加载，其余内容图片lazy；不新增图片预加载，也不调整主题实现。

## 验证结论

205/205 unit、102/102 Production浏览器回归、开发图片专项7/7及704px专项1/1通过；Production构建（含内容/字形校验）、Next/Node typecheck、全站lint、git diff --check通过。无跳过或重试。独立只读审查无Critical/Important，两项Minor已处理：撤回超范围的文章详情封面替换，修正Lab在640–767px的尺寸提示（704px用例先失败再通过）。主题首帧/跨语言、草稿、聊天、路由与SEO由全套回归复验；真实第三方API未重测，不据本票扩大旧验收记录。

证据位于`/tmp/portfolio-bilingual-evidence/pb09a-*`及`PB-09A-*.png`。完整过程见[progress.md](progress.md)。只完成本票，保留用户localhost:3000开发服务；临时测试服务已退出。未提交、未推送、未部署；PB-10等待本票审核通过后另行启动。
