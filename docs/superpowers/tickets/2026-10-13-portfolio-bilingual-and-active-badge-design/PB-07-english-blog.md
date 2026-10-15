# PB-07：英文 MDX 博客与唯一正式地址

状态：核心文章/路由及紧凑语言入口回修用户审核通过（2026-10-15）。阶段：Phase 3。依赖：PB-04、PB-06。替代原 Task 14。规格：第 3、5、9 节；AC-05、AC-06。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

迁移 9 篇英文文章到 MDX，保留标题/摘要/正文/标签/代码，不生成中文文章。中文列表明确英文标记；已知中文文章地址 308，未知 slug 404。

## Files

- Create：`content/posts/*.mdx`（对应现有 9 个 slug）、`content/blog-slugs.json`、`scripts/migrate-posts.ts`。
- Modify：`lib/content/posts.ts`、`next.config.ts`、`src/components/blog/BlogCard.tsx`、`BlogList.tsx`、`BlogPreview.tsx`、`LanguageSwitcher.tsx`。
- Create：`app/[lang]/blog/[slug]/page.tsx`、`src/components/blog/BlogPostBody.tsx`、`tests/unit/blog-content.test.ts`、`tests/e2e/blog-routing.spec.ts`。
- Modify：`package.json`、`pnpm-lock.yaml`（沿用原计划 gray-matter、next-mdx-remote、rehype-pretty-code、shiki 方案，执行时确认兼容版本）。
- Read：`src/data/blog-posts.ts`、`src/data/posts/*.ts`。原源在校验通过前保留，PB-10 确认无 caller 后删除。

## Interfaces

- 保持 PB-02 四个英文博客 getter 签名，不增加 locale 参数；同步文件读取仅服务端，客户端收到 metadata，不带全文。
- `content/blog-slugs.json` 为确定的 slug 字符串数组，构建校验与 getPosts 集合一致；next.config 仅导入 manifest，不导入带 server-only 标记的模块。
- `BlogPostBody({ source }: { source: string })` 为 async 服务端组件，用 compileMDX + rehype-pretty-code 渲染 git 内可信内容；不执行访客提供的 MDX。
- 静态参数采用 bottom-up 枚举：根 layout 保留共享定义和 `dynamicParams=false`，home/lab/blog 叶子各返回 en/zh，文章 page 仅返回完整 `{ lang: "en", slug }[]`，不生成中文正文。原定“zh 父分支返回空数组”在 Next16.4 实测会阻止全部文章生成，已按下方 Ruling 替代；没有在 zh 父分支覆盖 lang。现有中文 slug 的 308 在 config 明确生成，优先于 page 匹配。

## 实现步骤

- [x] 写转换校验测试：frontmatter 的 metadata 与原对象深相等，正文与原 TypeScript 模板字符串的实际运行时值一致；测试原始反引号、斜杠、ASCII 图。执行时先 red，再转换。
- [x] 安装原计划 MDX 依赖，用 tsx 导入原 `blogPosts` 得到实际字符串，再用 gray-matter.stringify 写文件；不能直接对源码全局替换转义。写 manifest，禁止重复 slug、日期非法和缺标题。第一次转换前记录原对象摘要，脚本禁止无提示覆盖已编辑的 MDX。
- [x] 实现服务端 getPosts/getPost 等，文件名白名单匹配 slug，不把任意请求 slug 拼到 fs 路径；非法/不存在返回 undefined。BlogPostBody 渲染所有 9 篇，代码与 ASCII 不折行；MDX 语法转义修正必须保持显示内容，不翻译或重写事实。

```tsx
import { compileMDX } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
export default async function BlogPostBody({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    options: { mdxOptions: { rehypePlugins: [rehypePrettyCode] } },
  });
  return <article className="blog-prose">{content}</article>;
}
```

- [x] next.config 根据 manifest 生成精确中文文章跳转：

```ts
import slugs from './content/blog-slugs.json';
const chineseArticleRedirects = slugs.map(slug => ({
  source: `/zh/blog/${slug}`,
  destination: `/en/blog/${slug}`,
  permanent: true,
}));
```

合并 PB-03 固定旧地址规则，不加 `/zh/blog/:slug` 通配跳转。文章 route 先查 locale/slug，非法 `notFound()`，正式英文 page 用原标题+正文。所有列表文章链接固定英文，中文加“英文文章”，文章语言入口名称为“中文目录 / Chinese index”，href `/zh/blog`，不保留文章 hash。

- [x] 编写/执行生产路由测试；不跟随跳转检查第一跳状态，未知地址不变成 200 错误页。

```ts
import { test, expect } from '@playwright/test';
test('中文文章只有已知 slug 永久跳转', async ({ request }) => {
  const known = await request.get('/zh/blog/why-i-chose-cs', { maxRedirects: 0 });
  expect(known.status()).toBe(308);
  expect(known.headers().location).toBe('/en/blog/why-i-chose-cs');
  expect((await request.get('/zh/blog/no-such-post', { maxRedirects: 0 })).status()).toBe(404);
  expect((await request.get('/en/blog/no-such-post')).status()).toBe(404);
});
```

- [x] `pnpm exec vitest run tests/unit/blog-content.test.ts`、`pnpm run build`、`pnpm exec playwright test tests/e2e/blog-routing.spec.ts`；逐篇检查代码、链接、图片、表格、嵌套列表和 ASCII。对旧 `/#contact` 用真实浏览器验证 308 后 hash 保留；只用 curl 看不到 fragment。

## 验收与交付

9 篇有完整保真对照；详情 initial HTML 英文 lang=en，中文列表文章标题/摘要原样，正负地址状态准确。未知 slug 404 在生产模式验收，不能用 Next 流式错误内容的 200 代替。满足 AC-05/06；文章 SEO 由 PB-09 完成。


## 实际交付与验证（2026-10-15）

- 九篇英文源完整迁到 content/posts/*.mdx，确定的slug清单写入content/blog-slugs.json。标题、摘要、日期、标签、readTime与正文均深比较原运行时对象通过；旧TS源保留PB-10清理。本票不翻译文章。
- pnpm run content:migrate-posts 可重复运行；读取原对象的实际字符串，不替换源码转义。目标文件全部预检，已有内容不同就拒绝写入。首次转换前的原对象与逐篇SHA256分别记录在/tmp/portfolio-bilingual-evidence/pb07-original-posts.json、pb07-migration.log。转换函数测试实际验证反引号、反斜杠、ASCII、日期/重复slug/空标题和不覆盖用户编辑。
- 四个getter签名保持不带locale，新增server-only与slug白名单；客户端仍仅收到metadata。content:check现在校验清单/文件集合、slug、日期与必填字段；命令加react-server condition以在CLI正确读取server-only模块。gray-matter的缓存元数据返回前做深复制，保留原getter的返回值隔离。
- 原BlogCard/BlogPreview/BlogList已有英文地址和中文“英文文章”标记，本票复用并在真实浏览器验证，没有为Files清单重复改写。文章页面仅en并输出原文标题一次；桌面和手机菜单提供明确“中文目录 / Chinese index”链接，普通点击复用共享导航保护，修饰键仍可开新标签。保留query、清理文章hash。
- BlogPostBody以服务端compileMDX、GFM和Pretty Code/Shiki渲染；代码/ASCII仅块内横滚，表格独立容器，链接href保真、外链noopener，图片保留src/alt。九篇无真实图片，图片与嵌套列表用额外格式fixture验证；未把fixture冒充原文图片验收。深浅代码/表格和375px ASCII截图已查看。
- 高亮器grid=false，避免默认给空代码行补空格。九篇实际渲染DOM逐篇与原Markdown渲染比较段落/列表/标题/表格、代码文本和链接，全部通过；没有为了通过而忽略代码空白差异。

### 实现调整与维护代价

- Ruling：采用Next官方bottom-up静态参数模式。原票据的top-down空zh分支在安装Next16.4会保留不完整父参数，导致hadAllParamsGenerated=false，九篇en也全部不生成；已真实复现“build成功但en404”。移除根layout的参数枚举，分别由三个双语叶子页枚举语言，文章叶子只枚举完整en+slug；根布局未拆分，对外规则不变。代价是未来新增叶子页须明确声明静态语言集合。构建产物确认恰好九篇/en/blog/*，没有/zh/blog/*正文。
- Ruling：按计划使用next-mdx-remote6.0.0，保留blockJS/blockDangerousJS=true，只编译git内可信文章。上游已于2026-04归档，存在后续维护成本；这不是可直接接收访客MDX的内容系统。来源：[上游6.0发布记录及归档状态](https://github.com/hashicorp/next-mdx-remote/releases/tag/v6.0.0)。配套gray-matter4.0.3、rehype-pretty-code0.14.5、Shiki4.5.0实际在Node22/React19/Next16.4验证通过。

### 验收证据

- 171/171 unit（新增29项）、content:check、构建、Next/Node typecheck、全站lint、git diff --check通过。全量production Playwright 63/63（1.8分钟，含新增7项），无跳过/重试；另真实用户dev3000运行文章入口/手机菜单/两种动画偏好主题切换4/4通过。
- 逐一检查九篇en200、十八个旧地址/中文地址308第一跳及query保留，未知slug、未知语言、错误后缀/额外路径均真实404。九篇禁用JavaScript仍有完整标题和可读正文。旧/#contact真实浏览器308后保持hash并滚到联系章节。
- 中文列表→英文文章→中文目录只有首次1次document请求；375px菜单可用Enter，关闭后焦点恢复；纯ASCII实际scrollWidth478/clientWidth341，scrollLeft可达100、页面宽375。截图：PB-07-mobile-article.png、PB-07-mobile-ascii.png、PB-07-desktop-dark-{code,table}.png。
- 真实延迟HTTP SSE fixture：发送后进入文章、再打开中文目录，完整回复保留、只有1次POST、sessionId非空且连接未取消；返回首页联系草稿仍在。本轮未发送真实DeepSeek/邮件，不改变PB-05人工证据或PB-04A保留项。
- 独立只读复核未发现确定P1/P2或需阻挡交付的minor；独立复跑29 unit并检查prerender集合。复核未独立重跑浏览器/build/typecheck/lint，不把作者结果写成独立验证。外链文本/href保真，未逐站联网验证目的地址；字体预算与SEO留PB-08/09，旧浏览器语言兼容边界沿用PB-06。
- 原127/localhost开发服务保留，Playwright临时3105/3219服务已退出。日志位于/tmp/portfolio-bilingual-evidence/pb07-{unit,build,e2e,dev-e2e}.log等。PB-07当前等待用户人工审核，不开始PB-08，不commit/push/部署。


## PB-07 紧凑语言入口回修验证（2026-10-15）

- 按用户审核意见，桌面入口改为44×44单个目标语言按钮：英文页“中”、中文页“EN”；文章页为真实中文目录链接，完整名称仅在无障碍名称及悬停/键盘聚焦提示中呈现，Escape关闭提示。手机菜单保留原两项。规格第2/7节已同步用户的新决定。
- 入口与导航恢复共用稳定language-desktop-toggle焦点ID；切换中button disabled、文章Link inert，导航单例在异步开始前加锁。保留原历史、滚动、错误恢复及聊天/草稿契约。隐藏Next开发角标以消除实际点击遮挡，编译/运行错误仍可显示。
- 最新验证：171/171 unit、content:check及生产构建通过；最终typecheck/lint通过。完整production浏览器65/65（1.9分钟）、真实dev专项6/6（8.1秒）通过，无跳过/重试。两个compact用例先RED后GREEN；独立只读复核未发现确定P1/P2，并另跑22项语言unit通过，未独立跑浏览器或build。
- 已查看浅/深色PB-07-compact-{light,dark}.png，入口实测44×44、左距24px，不再常驻显示宽标签。证据：/tmp/portfolio-bilingual-evidence/pb07-toggle-{unit,build,e2e,dev,typecheck,lint}.log。
- 用户随后说明仅每秒快速点击三四次时偶见闪烁，正常点击没有；按其反馈不追加动效或架构修复。检查确认现有切换期间锁，并重新运行language-navigation单测5/5通过（包括重复选择只发一次HEAD/一次push）。这不等于复现或修复连点视觉闪烁；该现象作为非阻塞观察保留。正常切换的document请求数=1由浏览器用例验证，不是整页刷新。
- 核心文章/路由审核已通过；本次入口回修完成，停止等待用户复验。不开始PB-08，不commit/push/部署、不改线上配置；不发真实聊天或邮件请求，保留用户开发服务与全部已有改动。
