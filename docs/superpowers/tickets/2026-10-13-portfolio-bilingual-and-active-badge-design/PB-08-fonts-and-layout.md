# PB-08：统一 Noto Sans SC 与中文排版

状态：核心字体/排版及warning回修用户审核通过（2026-10-15）。阶段：Phase 3。依赖：PB-07。原 Task 16 图片优化可在本票后串行完成。规格：第 7、8 节；AC-09、AC-10、AC-11。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

中英文标题/正文统一字体、本站托管、每种语言冷缓存首页字体响应体不超过 500 KiB。排版适配两语，代码保留等宽；本票不改颜色/玻璃效果等设计令牌。

## Files

- Create：`lib/fonts.ts`、`scripts/check-font-budget.mjs`、`tests/e2e/typography.spec.ts`。
- Modify：`app/[lang]/layout.tsx`、`app/globals.css`；按实测修 `src/components/Hero.tsx`、`Header.tsx`、`Qualifications.tsx`、`Portfolio.tsx`、`Contact.tsx`、`LanguageSwitcher.tsx`、`src/components/blog/BlogPostBody.tsx`。
- Create（采用本地子集时）：`public/fonts/noto-sans-sc-400.woff2`、`noto-sans-sc-700.woff2`、`public/fonts/OFL.txt`、`scripts/font-characters.ts`。先用 next/font 托管；不无故生成整套字体。
- Modify：`package.json`（`fonts:check` → `node scripts/check-font-budget.mjs`）。

## Interfaces

```ts
// lib/fonts.ts：首选自动本站托管，执行时核对 installed Next 支持的选项
import { Noto_Sans_SC } from 'next/font/google';
export const sans = Noto_Sans_SC({
  weight: ['400', '700'], subsets: ['latin'], display: 'swap',
  variable: '--font-sans', preload: true,
});
```

根布局应用 sans.variable；CSS heading/body 均使用 `var(--font-sans), 'PingFang SC', 'Microsoft YaHei', sans-serif`。客户端不请求 Google；构建下载不代表访客依赖 Google。只预加载必要子集，其他字符范围按需请求。

`fonts:check` 以 `BASE_URL`（默认 `http://localhost:3000`）访问 `/en`、`/zh`，各启用新浏览器 context、无缓存、service workers blocked、CDP cache disabled。等待 document.fonts.ready 后按 PerformanceResourceTiming 的 encodedBodySize 合计字体响应体；返回每语言 URL/字节/host 明细 JSON。零大小/无字体响应不算自动通过，要确认无缓存、字体确实使用。

## 实现步骤

- [x] 建预算脚本与失败断言，当前 Google 运行时字体或外部 host 使检查失败。额外用预算参数注入 1 byte 的负例，确认脚本 exit nonzero；正式预算固定 `500 * 1024`，不能为通过改大。
- [x] 添加字体工具并替换全局 heading/body，移除从原 index.css 带来的 fonts.googleapis.com @import；代码字体不变。保留固定主题色和圆角。
- [x] 实现字体请求监控，字体 URL host 必须与 BASE_URL 一致，不能有 fonts.googleapis.com/fonts.gstatic.com 访问；sum(encodedBodySize) 不超过预算。脚本采用浏览器渲染，不用下载整个目录大小代替首屏传输。

```js
const metrics = await page.evaluate(async () => {
  await document.fonts.ready;
  return performance.getEntriesByType('resource')
    .filter(entry => /\.(woff2?|otf|ttf)(\?|$)/i.test(new URL(entry.name).pathname))
    .map(entry => ({ url: entry.name, bytes: entry.encodedBodySize }));
});
const total = metrics.reduce((sum, entry) => sum + entry.bytes, 0);
if (total > 500 * 1024) throw new Error(`Font budget exceeded: ${total}`);
```

- [x] 若超限，先减少 preload/字重和按 unicode-range 拆分；仍超限则用本地 WOFF2 子集。字符集由两套静态内容/字典/英文博客收集，保留 supplied 字体许可证；动态聊天未知字符走系统 fallback。不能删除静态文案字符来凑预算。
- [x] 在 375/768/1440px、两语言、浅/深主题截图：Header、Hero、经历、项目、表单、悬浮入口、博客代码。中文去掉不合适的大字距，段落行高至少 1.6，长 token 使用 overflow-wrap，代码 pre 自身横向滚动而不是撑宽页面。
- [x] 浏览器阻断全部字体请求，断言主体可见、可点击、无横向页面溢出；少见中文姓名/技术缩写/标点人工确认无缺字方框。减少动态偏好下 Hero 静态、不播放非必要动画。
- [x] `pnpm run build`、生产服务器 `pnpm run fonts:check`、`pnpm exec playwright test tests/e2e/typography.spec.ts`；记录两语冷缓存传输 JSON 和各尺寸截图，font failure 的反例证据单列。

## 验收与交付

AC-09/10/11 通过；超预算必须优化或回到用户审核，不能关票。截图之外还要有实际字体来源和传输数据；测试 fallback 通过不能代替静态字形完整性审阅。


## 实际交付与验收记录（2026-10-15）

- 交付统一Noto Sans SC标题/正文/控件、本站400/700子集、许可证及可复现生成脚本；移除app/globals.css的Google import。代码继续等宽，Lab静态UI去除等宽与宽字距，中文p/li行高1.75、长技术名安全换行。截图发现四位年份圆点内折行，修正为单行小字号数字。
- 接口裁定：首选next/font/google已实际尝试，构建因无法下载Google字体失败；按本票预留本地子集兜底使用next/font/local，不放大500KiB预算。新增未覆盖静态字符会在content:check明确失败，需要按public/fonts/README重建，不能删改文案。依赖工具Python/uv仅用于字体更新，正常构建只需Node/pnpm。
- 源码：lib/fonts.ts、app/[lang]/layout.tsx、app/globals.css、LabView.tsx、Qualifications.tsx；脚本check-font-budget.mjs与d.mts、font-characters.ts、subset-font.py；public/fonts/{两份woff2,OFL,manifest,README}；package.json/README；unit/font-budget、font-coverage及e2e/typography。未为清单重复改动其他已合格组件；src/index.css是无调用的旧Vite文件，清理留PB-10。
- 字体来源固定Google/fonts提交a85815a42757630ce188fdad368c2dfc444d4773，原TTF hash与许可见字体README。两份实际cmap各705字，全部静态汉字/拉丁/数字/标点覆盖；▸、👋为系统符号/emoji回退。独立复核核实字重400/700及真实cmap等于manifest，并从源TTF逐字节重建一致。

| 冷缓存页面 | 常规字重 | 粗体 | 合计 encodedBodySize | 预算 | 字体来源 |
|---|---:|---:|---:|---:|---|
| /en | 89572 B | 91452 B | 181024 B（176.8 KiB） | 512000 B | 本站 /_next/static/media/ |
| /zh | 89572 B | 91452 B | 181024 B（176.8 KiB） | 512000 B | 本站 /_next/static/media/ |

- 预算脚本各语言全新context、禁HTTP缓存/service worker、document.fonts.ready及CDP实际Noto渲染验证；FONT_BUDGET_BYTES=1两语均exit1；零字体、零大小、失败字重、外域均失败。独立复核指出无扩展字体漏计：按验收工具契约补外域负例先RED，再以实际font请求URL集合计量；真实HTTP /face?weight=400 fixture实测89572B，无待修minor。
- 验证：`pnpm test`180/180；`pnpm build`含content/字形校验通过；`pnpm typecheck`、`pnpm lint`及diff检查通过。完整生产Playwright83/83（1.2分钟），18项新增排版/字体失败用例；最终dev localhost运行同18项+原主题2项20/20（28.3秒），无跳过/重试。
- 初始中文行高负例与年份截图回归均先失败后修正。首次typecheck缺mjs声明已补；初次生产82/83的ENOENT来自两套Playwright共享输出目录，已改串行独立目录后完整重跑通过；127地址dev被Next来源保护阻断，localhost/生产交互正常，以localhost完成dev验收，不扩大allowedDevOrigins。具体失败与裁定均见progress.md，不把静态可见当作交互已验证。
- 截图覆盖375/768/1440、两语言、两主题，以及6组字体阻断回退，证据在/tmp/portfolio-bilingual-evidence/PB-08-*.png；12组Hero及代表性经历/项目/表单/Lab/代码/回退已查看，姓名/缩写/标点无缺字方框，ASCII代码不折行。外部图标/验证码在测试中屏蔽，其联网可用性不属本票验证。
- 继续停在PB-08等人工审核；不提交/推送/部署，不自动执行PB-09或原Task16图片优化。中文内容事实最终审阅、真实第三方API和性能综合验收仍保持原边界。

- 最终截图额外发现dev Lab“1 Issue”：原Lab两个容器的reduced偏好分支让SSR/client最终style不同。实际console读取与新增矩阵错误断言先RED后修复，initial=false容器保持一致最终样式，reduce仍禁非必要动画/延迟；此后重新完整验证，未将原有警告作为成功略过。


## 用户warning反馈回修（2026-10-15）

- 用户批准核心后反馈4类日志。移动语言菜单aria-hidden焦点及/favicon.ico 404是本站缺陷，已复现RED后修复：Header先同步转移menu内焦点到toggle，再隐藏；所有关闭路径统一。恢复既有JG图标为根app/favicon.ico（32px，996B），Next自动关联，无新设计/SEO实现。
- 新鲜浏览器字体实测Noto regular/bold加载、指定h1/p节点实际Noto使用，zh→en→zh后等待Chrome6.5秒未见unused-preload；用户强刷后日志亦未包含该提示。字体配置保持不动，不关闭preload或过滤警告；旧开发HMR残留仍只是未证实解释。
- OTS解析和No available adapters精确复现于challenges.cloudflare.com的challenge iframe，非本站字体资源控制台位置。保留第三方警告边界，本次不自动完成人工验证码、不访问secret/改widget、不新增真实邮件/重放结论。[Cloudflare错误回调文档](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/)用于区分组件失败与内部console日志，不据此宣称两个warning必定无害。
- 独立复核无确定P1/P2：同步focus顺序、稳定refs闭包、关闭路径及ICO header/CRC均核实。新回归开启CDP Accessibility并读实际Chrome警告，避免只检查导航后的最终focus。复核方未独立重跑整套browser/build。
- 最终180unit、build/typecheck/lint/diff校验通过；production86/86（1.3分钟），dev warning+主题5/5（11.1秒），无跳过或重试；字体预算两语181024B与1B反例复验。日志pb08-warnings-*在/tmp/portfolio-bilingual-evidence。停止等待本次回修复验，不提交/推送/部署，不进入PB-09。
