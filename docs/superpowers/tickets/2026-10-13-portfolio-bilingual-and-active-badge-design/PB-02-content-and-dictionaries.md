# PB-02：双语内容、字典与一致性校验

状态：代码、自动校验及最终中文内容人工审核通过（2026-10-15用户确认）。阶段：Phase 3。依赖：PB-01、原 Phase 1/2 验证完成。规格：第 3、6 节；AC-03。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

两套完整展示文字、一套共享实体元数据、类型化 UI 字典，现有 Vite 仍可构建。此票不搬组件、不转换博客、不改变事实。

## Files

- Create：`lib/i18n/locales.ts`、`lib/i18n/types.ts`、`lib/i18n/dictionaries.ts`、`lib/i18n/messages/en.json`、`lib/i18n/messages/zh.json`。
- Create：`content/portfolio/shared.ts`、`content/portfolio/en.ts`、`content/portfolio/zh.ts`、`content/portfolio/copy-inventory.md`。
- Create：`lib/content/types.ts`、`lib/content/profile.ts`、`lib/content/projects.ts`、`lib/content/posts.ts`。
- Create：`scripts/validate-content.ts`、`tests/unit/content.test.ts`、`tests/unit/dictionaries.test.ts`。
- Modify：`package.json`、`pnpm-lock.yaml`（`content:check`，复用 Phase 2 Vitest，增加开发工具 tsx）、`vitest.config.ts`（包含新 unit 目录）。
- Read：`src/data/portfolio.ts`、`src/data/blog-posts.ts`、`src/data/posts/*.ts`、`src/types/index.ts`、全部展示 caller、现有中文简历。

## Interfaces

```ts
// lib/i18n/locales.ts
export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];
export function isLocale(value: string): value is Locale {
  return value === 'en' || value === 'zh';
}
export const htmlLang = { en: 'en', zh: 'zh-CN' } as const;
export type PageKind = 'home' | 'lab' | 'blog';
export type SectionId = 'home' | 'about' | 'skills' | 'qualifications' | 'portfolio' | 'contact';
```

`Dictionary` 在 `lib/i18n/types.ts` 定义为嵌套字符串对象：`nav`、`actions`、`sections`、`forms`、`chat`、`updates`、`blog`、`a11y`、`errors`、`skillCategories`、`seo`。各组 literal key 来自实际 UI 文案清单；不得使用 `Record<string, string>` 绕过缺项检查。`seo` 为 `Record<PageKind, { title: string; description: string }>`；`nav` 含六个 SectionId 加 `blog`、`lab`；`actions` 必含 `activeBadge`、`demo`、`source`、`downloadResume`；`errors` 必含 `generic`、`rateLimit`、`verification`、`validation`、`navigation`。

```ts
// lib/content/types.ts
import type { Project, Education, Experience } from '../../src/types';
export type ProjectText = Pick<Project, 'title' | 'tagline' | 'description' | 'highlights'>;
export type ProjectMeta = Omit<Project, keyof ProjectText> & { id: string };
export type LocalizedProject = Project & { id: string };
export type EducationText = Omit<Education, 'year'>;
export type EducationMeta = Pick<Education, 'year'> & { id: string };
export type ExperienceText = Omit<Experience, 'year'>;
export type ExperienceMeta = Pick<Experience, 'year'> & { id: string };
```

共享数据保存 ID、年份、图片、技术栈、链接、featured/徽章、技能技术名称、联系方式、socialLinks、stats。语言文件以 ID 为键保存 ProjectText/EducationText/ExperienceText；profile 文本含 `name`、`shortName`、`title`、`bio`、`aboutDescription`、`focus`，另有 `heroLines: string[]`。`PortfolioProfile` 明确定义这些文本字段加共享 stats，与当前 personalInfo 形状一致。

公共签名（locale 参数均为 Locale，实体类型沿用 `src/types`）：

- `getDictionary(locale): Dictionary`；`validateDictionaries(en: unknown, zh: unknown): void`，比较非空字符串叶子的完整路径集合，错误包含缺失路径。
- `validatePortfolioContent(): void`，检测重复 ID、缺失实体/字段、亮点数量不一致、当前开关非 false；指标/日期的准确翻译仍人工审核。
- `getProfile(locale): PortfolioProfile`、`getSkills(): Skill[]`、`getSocialLinks(): SocialLink[]`、`getContactInfo(): ContactInfo`。
- `getEducation(locale): Array<Education & { id: string }>`、`getExperience(locale): Array<Experience & { id: string }>`，年份降序稳定排序。
- `getHeroLines(locale): string[]`、`getResumeHref(locale): string`，按语言指向现有文件的编码 URL。
- `getProjects(locale): LocalizedProject[]`、`getProject(locale, id: string): LocalizedProject | undefined`、`getFeaturedProjects(locale, limit = 6): LocalizedProject[]`、`getProjectsByYear(locale): Array<[number, LocalizedProject[]]>`，featured 优先、年份降序、同年稳定。
- `getPosts(): BlogPost[]`、`getPost(slug: string): BlogPost | undefined`、`getLatestPosts(count = 3): BlogPost[]`、`getAllTags(): string[]`；BlogPost 沿用 `src/types/blog.ts`，先包装现有源，返回副本，不修改源数组。

## 实现步骤

- [x] 逐组件读 UI 字符串，copy-inventory 写文件/字段/字典键/是否保留英文。中文简历按 PDF 技能读取核实，不改 PDF；品牌、文章、提交消息、聊天历史明确列为内容例外。
- [x] 原 Task 6 只包含 src/api 测试目录：先扩展 include 并安装开发工具 `pnpm add -D tsx`。写缺键/空串/重复 ID/缺实体/开关泄漏的正反例；执行 `pnpm exec vitest run tests/unit/content.test.ts tests/unit/dictionaries.test.ts`，确认失败来自待实现接口，不能把“No test files found”当 red 信号。

```ts
// vitest.config.ts：保留原配置的其他字段，只扩展 test.include
include: ['src/**/*.test.ts', 'api/**/*.test.ts', 'tests/unit/**/*.test.{ts,tsx}'],
```

```ts
import { expect, test } from 'vitest';
import { getProjects } from '../../lib/content/projects';
import { validateDictionaries, getDictionary } from '../../lib/i18n/dictionaries';
test('两种语言共用项目事实', () => {
  const facts = (lang: 'en' | 'zh') => getProjects(lang).map(p => ({
    id: p.id, year: p.year, demoUrl: p.demoUrl,
    technologies: p.technologies, showActiveBadge: p.showActiveBadge,
  }));
  expect(facts('zh')).toEqual(facts('en'));
  expect(getProjects('zh').every(p => !p.showActiveBadge)).toBe(true);
});
test('缺少中文导航报错', () => {
  const zh = structuredClone(getDictionary('zh'));
  expect(() => validateDictionaries(getDictionary('en'), {
    ...zh, nav: { ...zh.nav, home: undefined },
  })).toThrow(/nav.home/);
});
```

- [x] 稳定 ID 用固定 slug；Bosch 两条经历用内容+时间区分，禁止用翻译标题/数组索引临时生成。提取共享事实，录入完整两语文本，不在 JSX fallback 英文。
- [x] 实现校验/getter，新增 `content:check` → `tsx scripts/validate-content.ts`；语言文件含元数据副本时校验失败。字典 key 对应 TS 类型，两 JSON 结构一致。
- [ ] 跑 unit、`pnpm run content:check`、现有 `pnpm run build`；人工核对年份、数值、学校/公司名称、职位和两份简历链接，回填中文审核结果。

## 验收与交付

缺一中文键/实体的反例必须失败；AC-03 正例通过。不得以“下一票修 import”接受失败构建。博客全文未改变，字典清单与人工内容审核均有记录。

自动校验及字段/简历事实核对已完成；末项中的最终中文页面审阅等待用户。证据见 [progress.md](progress.md#pb-02)。
