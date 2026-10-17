# Portfolio context for coding assistants

## Current application

Next.js 16.4 App Router, React 19, TypeScript, Tailwind CSS 4, Framer Motion; Node.js 22+ and pnpm 10. Read installed-version documentation under `node_modules/next/dist/docs/` before Next changes. Product entries are in `app/`; `src/components` and `src/hooks` remain in place. No Vite entry or React Router remains; Vitest uses Vite internally for tests.

## Scope and Git

Follow [AGENTS.md](AGENTS.md), the [approved spec](docs/superpowers/specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md), [ticket plan](docs/superpowers/plans/2026-10-13-portfolio-bilingual-and-active-badge.md), and [ledger](docs/superpowers/tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/progress.md). Execute one authorized ticket, then stop for user review. Old execution templates are historical; start from [EXECUTION.md](docs/superpowers/plans/EXECUTION.md).

Preserve existing user changes and the index. Do not commit, push or deploy without an explicit user instruction. Never use `git add -A`, commit secrets or generated build output. Phase 4 follows its [spec](docs/superpowers/specs/2026-10-15-phase4-chat-ai-sdk-design.md), [tickets](docs/superpowers/tickets/2026-10-15-phase4-chat-ai-sdk-design/README.md) and [progress](docs/superpowers/tickets/2026-10-15-phase4-chat-ai-sdk-design/progress.md). P4-01–04 are owner-approved; Phase 4 implementation, technical checks and independent review are complete, with final owner approval on 2026-10-17. Commit/push/deploy still require an explicit instruction. Execute only the authorized current ticket and wait for review.

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
- `app/api/*` delegates to `lib/api/`; `src/api/` contains shared validation. Keys/admin client are server-only. P4-02 uses AI SDK7 in `lib/chat/model-runtime.ts` and direct provider configuration in `lib/chat/providers.ts`: DeepSeek first, OpenAI fallback only before content starts (8s primary startup, no SDK retries). IP quota admission precedes both; raw known usage for each attempt is settled by request/window, unknown remains null. Do not access SDK result promises that auto-consume the stream after stop. The browser uses the shared SDK Chat/useChat at `/api/chat/v2`; legacy `/api/chat` remains for already-open pages. Both share `lib/api/chat-lifecycle.ts`, IP admission and settlement. SDK Chat owns messages/status/model errors; session owns draft/open/verification/count. Unmount, close and language changes unsubscribe without stop. SSR never reads a shared visitor Chat.
- `lib/chat/system-prompt.ts`: portfolio-only answers, exact Chinese name过汇智融; unrelated general tasks are declined even if framed as owner authorization or a listed technology. Current-message refusal language is selected before model generation. Prompt constraints are not a hard abuse boundary; refusals still cost tokens. Do not add a new-conversation button.
- `supabase/migrations/20261015144154_chat_quota_cleanup.sql`: unique pg_cron job `portfolio-chat-quota-cleanup`, daily04:17UTC; quota/ledger expiry protects active requests and recent settlement. Quota-before-ledger lock order, skip busy IPs; only service_role/database owner, no legacy-table deletion.
- `lib/seo.ts`: fixed production domain https://www.plonguo.com; only build-time VERCEL_ENV=production permits indexing. No request cookies/headers for locale.
- `lib/fonts.ts`, `public/fonts/`: Noto Sans SC400/700, local WOFF2; per-language cold-font budget500KiB. Code monospace. Rebuild instructions/license: [font README](public/fonts/README.md). Server-only OG TTF in `lib/assets/` is not a browser preload.
- `public/images/`: compressed photos/WebP projects with responsive Image sizes; preserve containers, cropping and animation. PDF URLs are unprefixed and selected by locale.
- `app/globals.css`: shared design; primary#3B82F6, secondary#8B5CF6, accent#06B6D4, rounded-2xl, glass panels, class theme and reduced-motion support.

## Environment and verification

See [README](README.md) for required variable names. Never print `.env.local`, credentials or admin tokens. Test doubles, real local HTTP fixture requests and real external service results must be reported separately; a green build does not replace manual content/visual review. Phase 3 evidence: [report](docs/superpowers/reports/portfolio-bilingual-verification.md). Phase 4 evidence and owner approval: [chat report](docs/superpowers/reports/phase4-chat-verification.md). Cleanup verification requires Management API credentials and uses rolled-back isolated table copies, not global deletion of visitor data. Paid scope probes in scripts/verify-chat-scope.ts are explicit only and never part of unit tests.

## Sound notification

At task completion on macOS, notify with:

```bash
afplay /System/Library/Sounds/Funk.aiff
```
