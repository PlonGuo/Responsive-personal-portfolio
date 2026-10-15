# Portfolio context for coding assistants

## Current application

Next.js 16.4 App Router, React 19, TypeScript, Tailwind CSS 4, Framer Motion; Node.js 22+ and pnpm 10. Read installed-version documentation under `node_modules/next/dist/docs/` before Next changes. Product entries are in `app/`; `src/components` and `src/hooks` remain in place. No Vite entry or React Router remains; Vitest uses Vite internally for tests.

## Scope and Git

Follow [AGENTS.md](AGENTS.md), the [approved spec](docs/superpowers/specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md), [ticket plan](docs/superpowers/plans/2026-10-13-portfolio-bilingual-and-active-badge.md), and [ledger](docs/superpowers/tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/progress.md). Execute one authorized ticket, then stop for user review. Old execution templates are historical; start from [EXECUTION.md](docs/superpowers/plans/EXECUTION.md).

Preserve existing user changes and the index. Do not commit, push or deploy without an explicit user instruction. Never use `git add -A`, commit secrets or generated build output. Do not begin Phase 4 automatically.

## Commands

```bash
pnpm dev
pnpm content:check
pnpm lint
pnpm typecheck
pnpm exec tsc --noEmit
pnpm test
VERCEL_ENV=production pnpm build
pnpm start
PORTFOLIO_TEST_PORT=3105 VERCEL_ENV=production pnpm test:e2e
BASE_URL=http://localhost:3105 pnpm fonts:check
```

Development uses http://localhost:3000. Reuse the owner’s existing dev process. Playwright’s streaming fixture owns port3219, so run suites serially and stop only your own temporary servers. Production API CORS intentionally rejects localhost; use dev for interactive local API checks, not a weakened production allowlist.

## Files and invariants

- `app/[lang]/layout.tsx`: shared root, server dictionary/content and persistent widgets. Supported languages are en/zh, HTML lang en/zh-CN.
- Each leaf enumerates its static params bottom-up; the parent root must not enumerate both languages and accidentally suppress English article generation on this Next version.
- `content/portfolio/shared.ts`: stable IDs/facts/links/skills; `en.ts` and `zh.ts`: localized copy. All current `showActiveBadge` flags are false; Demo links are independent.
- `lib/i18n/messages/*.json`: full UI and SEO copy. Do not silently fall back to another language or invent resume facts.
- `content/posts/*.mdx` plus `content/blog-slugs.json`: one English article source. Known Chinese article URLs redirect; unknown slugs/languages404. `tests/fixtures/blog-baseline.json` records original metadata/body hashes; intentional editorial changes require review.
- `lib/client/`: memory session, stream lifetime, contact draft and guarded language navigation. Do not key a whole page by locale or abort live chat on navigation.
- `app/api/*` delegates to `lib/api/`; `src/api/` contains shared validation. Keys/admin client are server-only. The `openai` client calls DeepSeek first, with direct OpenAI fallback only before content starts (8s DeepSeek startup limit, no SDK retries). Supabase rate limiting still runs before either provider. Phase4 is a separate refactor.
- `lib/seo.ts`: fixed production domain https://plonguo.com; only build-time VERCEL_ENV=production permits indexing. No request cookies/headers for locale.
- `lib/fonts.ts`, `public/fonts/`: Noto Sans SC400/700, local WOFF2; per-language cold-font budget500KiB. Code monospace. Rebuild instructions/license: [font README](public/fonts/README.md). Server-only OG TTF in `lib/assets/` is not a browser preload.
- `public/images/`: compressed photos/WebP projects with responsive Image sizes; preserve containers, cropping and animation. PDF URLs are unprefixed and selected by locale.
- `app/globals.css`: shared design; primary#3B82F6, secondary#8B5CF6, accent#06B6D4, rounded-2xl, glass panels, class theme and reduced-motion support.

## Environment and verification

See [README](README.md) for required variable names. Never print `.env.local`, credentials or admin tokens. Test doubles, real local HTTP fixture requests and real external service results must be reported separately; a green build does not replace manual content/visual review. Final acceptance evidence: [report](docs/superpowers/reports/portfolio-bilingual-verification.md).

## Sound notification

At task completion on macOS, notify with:

```bash
afplay /System/Library/Sounds/Funk.aiff
```
