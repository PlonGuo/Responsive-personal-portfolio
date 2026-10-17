# Jason Guo’s Personal Portfolio

Bilingual portfolio built with Next.js 16.4 App Router, React 19, TypeScript, Tailwind CSS 4 and Framer Motion. English articles use repository-owned MDX; the interface and portfolio content are available in English and Simplified Chinese.

Production domain: [www.plonguo.com](https://www.plonguo.com). Vercel builds the `main` branch for Production; migration branches receive Preview deployments. The apex domain permanently redirects to the existing `www` primary domain.

## Local development

Use Node.js 22+ and pnpm 10. Install dependencies with `pnpm install --frozen-lockfile`, configure the server environment below, then run `pnpm dev`. Open **http://localhost:3000/en** or **http://localhost:3000/zh**. If a Next dev server already owns this checkout, reuse it or stop that specific process before starting another.

```bash
pnpm dev                 # Next development server
pnpm content:check       # Dictionaries, portfolio, MDX and font glyph/hash checks
pnpm lint                # ESLint
pnpm typecheck           # Next source plus server, scripts and TypeScript tests
pnpm exec tsc --noEmit    # Root Next TypeScript configuration
pnpm test                # Vitest unit/contract tests
VERCEL_ENV=production pnpm build
pnpm start               # Serve the production artifact
PORTFOLIO_TEST_PORT=3105 VERCEL_ENV=production pnpm test:e2e
BASE_URL=http://localhost:3105 pnpm fonts:check
```

Playwright starts a production Next server and an isolated HTTP streaming fixture on port 3219. Its port must be free; run suites serially. `PORTFOLIO_TEST_USE_EXISTING=1` explicitly reuses a running server, and `PORTFOLIO_TEST_BASE_URL` overrides the test origin. Install Chromium with `pnpm exec playwright install chromium` if needed. `preview` and `*:next` script aliases use the same Next commands. Vitest retains Vite internally as a test dependency; the product has no Vite entry, bundler plugin or React Router.

## Environment

Enter values in the ignored `.env.local` yourself; never commit that file or paste secrets into chat. These are server variables, not `NEXT_PUBLIC_*` variables.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_PROJECT_URL` | Database project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only rate limiting, token accounting and commit cache |
| `RESEND_API_KEY` | Contact email delivery |
| `TURNSTILE_SITE_KEY` | Public widget key, passed to the browser from the server |
| `TURNSTILE_SECRET_KEY` | Server-only verification |
| `DEEPSEEK_API_KEY` | Direct DeepSeek chatbot requests |
| `DEEPSEEK_MODEL` | Optional model override; current code default is `deepseek-flash` |
| `OPENAI_API_KEY` | Optional direct OpenAI fallback when DeepSeek cannot start a reply |
| `OPENAI_MODEL` | Optional fallback model override; default is `gpt-4.1-mini` |
| `GITHUB_TOKEN` | Optional authenticated public commit fetching |
| `VERCEL_ENV` | Build-time indexing policy, described below |

AI SDK 7 uses the direct DeepSeek and OpenAI provider packages: DeepSeek first, then OpenAI if DeepSeek fails before any reply content, returns an empty stream, or takes longer than 8 seconds to produce content. Each provider is attempted once; SDK retries are disabled. Once content starts, interruptions remain errors instead of splicing two answers. Cancellation and the route’s overall 20-second deadline stop both attempts. If DeepSeek’s key is absent, a configured OpenAI key can answer directly; if OpenAI’s key is absent, only DeepSeek is used. The OpenAI fallback uses Chat Completions (`max_completion_tokens`) and does not receive DeepSeek’s `thinking` parameter; model overrides must support these parameters. See the [OpenAI model documentation](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

Restart the local server after changing runtime keys. Configure the same server variables in Vercel for deployments; local `.env.local` is not uploaded. The Turnstile widget must allow the actual development hostname. Browser UI/API testing uses `pnpm dev`: production API CORS keeps its explicit production allowlist and deliberately rejects localhost. Do not weaken that policy for local QA.

The application requires the Supabase tables/RPC. `supabase/migrations/` includes contact limits and the additive Phase 4 chat IP quota/usage ledger and cleanup migrations; legacy chat and GitHub cache tables are existing infrastructure, so this is not a complete fresh-database bootstrap. Unit tests isolate database/provider failures; they do not provision a database or send mail. Contact mail is currently addressed to the portfolio owner, `jason.ghzr@gmail.com`.

Chat uses atomic database admission: 30 requests per IP per hour, shared across browser sessions and people using the same outgoing IP. The token gate checks 100000 already-settled tokens. P4-02 records the providers' raw input/output/total usage for all attempted providers, including a failed primary when known. Missing fields remain null, not chunk counts or invented zeroes; a total can be derived when both input and output are known. In-flight and unknown usage mean this is not a hard billing cap. Settlement is idempotent per server request ID and stays associated with its original window, including after cancellation. Database failures reject admission; settlement failures prevent a normal success event. Legacy tables remain intact, and enabling the new IP policy starts a new quota window.

The model runtime owns one SDK stream reader and takes usage from finish events; it does not request SDK result promises that would auto-consume the stream. Explicit stop aborts the transport instead of continuing generation for usage. Chat text reaches the model without HTML escaping; contact email HTML escaping remains required. The shared system prompt explicitly identifies the owner as 过汇智融 (surname 过, given name 汇智融), also known as Huizhirong/Jason Guo.

Explicit external verification: `node --env-file=.env.local --import tsx scripts/verify-chat-quota.ts`. This makes real database requests, tests 40 concurrent admissions plus usage settlement, and deletes only its own synthetic keys. `tests/integration/chat-quota.sql` checks SQL behavior and role permissions inside a rolled-back transaction; run it with psql and stop on errors. Neither check calls a model or sends mail.

The `portfolio-chat-quota-cleanup` database job runs daily at **04:17 UTC** (`17 4 * * *`; cron GMT is equivalent to UTC). It deletes settled ledgers only after both creation and settlement are over 24 hours old. Unsettled ledgers need 48 hours and an inactive IP; quotas need both window start and last request over 24 hours old and no retained ledgers. Busy IPs are skipped until the next cleanup. The function uses the same quota-before-ledger lock order as admission/settlement. RLS remains enabled; only `service_role` (plus the database owner for scheduling) can execute cleanup. Existing legacy tables and cleanup functions are preserved.

Explicit cleanup verification: `node --env-file=.env.local --import tsx scripts/verify-chat-quota.ts --cleanup`. This needs a Supabase Management API credential in `SUPABASE_ACCESS_TOKEN`, or the existing Supabase CLI macOS Keychain credential. It reads the target job and permissions, runs the installed function against private empty table copies inside a rolled-back transaction, and never invokes global cleanup on visitor data. The isolated SQL test is `tests/integration/chat-quota-cleanup.sql`; its test-only guard must be enabled only in an isolated database.

## Routes and content

| Page | English | Simplified Chinese |
| --- | --- | --- |
| Home | `/en` | `/zh` |
| Lab | `/en/lab` | `/zh/lab` |
| Blog index | `/en/blog` | `/zh/blog` |
| Article | `/en/blog/[slug]` | No translated article |

Legacy `/`, `/lab`, `/blog` and `/blog/[slug]` use permanent redirects. Known Chinese article URLs redirect to the English article; unknown slugs and languages return 404. Query strings and the old home contact anchor remain supported. Language changes keep the current chapter, drafts, theme and chat session through client navigation.

- Shared project facts, skills, links and `showActiveBadge`: `content/portfolio/shared.ts`.
- Portfolio copy: `content/portfolio/en.ts` and `zh.ts`, matched by stable IDs.
- Interface text and SEO copy: `lib/i18n/messages/en.json` and `zh.json`.
- Content getters and validation: `lib/content/`; components remain in `src/components/`.
- English articles: `content/posts/*.mdx`, listed in `content/blog-slugs.json`.
- API routes: `app/api/{chat,send-email,github-commits}/route.ts` and `app/api/chat/v2/route.ts`; shared chat lifecycle/normalization in `lib/api/`, origin/IP security in `src/api/`.
- Persistent in-page sessions, drafts and request lifetime: `lib/client/`. SDK Chat owns messages/status/errors; the session store owns drafts, visibility, verification, completed-response counts, theme and contact state. React unmounts unsubscribe without stopping the browser-owned Chat. Server rendering uses an isolated empty snapshot; no visitor transcript is stored in a server singleton.
- Fonts: `lib/fonts.ts`, `public/fonts/`, server-only OG font in `lib/assets/`.

To add a project, add its shared metadata and the corresponding stable ID in both language copy files. `showActiveBadge` is required and all current projects set it to `false`; it controls only the badge. `demoUrl` and `githubUrl` independently control buttons. Do not infer service availability from a working URL or enable the badge without checking the service.

To add an article, create validated English MDX and update the slug manifest. Existing article metadata/body preservation is checked against `tests/fixtures/blog-baseline.json`, captured before the old TypeScript source was retired. Do not regenerate this baseline from current MDX to silence a regression; intentional editorial changes require an explicit baseline review. The old one-time migration command has been retired.

Resume files stay at `/Huizhirong Guo.pdf` and `/过汇智融-中文简历.pdf`; neither gets a language prefix. Both languages offer their own resume and a clearly labeled alternate download.

Downloads serve the files in `public/`. If you update an original PDF in `src/assets/`, copy it to the matching `public/` filename; the build does not sync these directories. The dev server serves the replacement immediately. Updating production requires a new deployment containing the replacement PDF; building locally alone does not publish it.

## Fonts, images and design

Headings, body and controls use locally hosted Noto Sans SC 400/700; code uses monospace. Each cold-cache homepage has a **500 KiB** font response budget. Subset provenance, license and rebuild instructions are in [public/fonts/README.md](public/fonts/README.md). New static glyphs must pass `content:check`; unknown chat glyphs can use system fallback.

Photos and project images use `next/image` with fixed containers and responsive sizes. Lab’s first project image loads eagerly; lower-page content images remain lazy. Five large PNG sources have WebP replacements. Image compression and visual review evidence is in [PB-09A](docs/superpowers/tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/PB-09A-image-optimization.md).

Keep primary `#3B82F6`, secondary `#8B5CF6`, accent `#06B6D4`, rounded cards, the class-based theme and reduced-motion support. Follow the existing keyboard/focus conventions. Accessibility and performance checks are recorded per scenario; no unmeasured Lighthouse score or blanket compliance claim is made.

## SEO and deployment handoff

Canonical, language links, Open Graph URLs, robots and sitemap use **https://www.plonguo.com**, including local and Preview builds. The six bilingual pages have reciprocal `en`, `zh-CN` and `x-default` links. Articles have only English metadata and their own 1200×630 share image.

Indexing is enabled only when **`VERCEL_ENV=production` at build time**. Preview, Development and an unset value produce `noindex, nofollow` and `Disallow: /`. Keep Vercel’s system environment variables available to the build. Changing runtime variables after building does not rewrite static metadata. Verify Preview separately with `VERCEL_ENV=preview pnpm build` and `PORTFOLIO_EXPECT_INDEXING=preview` in the SEO tests, then restore a production build.

When deployment is explicitly authorized, select the **Next.js framework preset**, repository root `.`, build `pnpm build`, and the platform’s default output handling. Remove any old `dist` output override; this is a server-backed Next application, not a static export. Configure secrets for the intended environment before a new deployment. Upgrading an old Vercel CLI with `pnpm add -g vercel@latest` is recommended before deployment. This migration has not changed dashboard settings, pushed code or deployed.

The production Cloudflare configuration is outside the local regression evidence. Historical infrastructure notes remain in [CLOUDFLARE_DEPLOYMENT_KNOWLEDGE.md](CLOUDFLARE_DEPLOYMENT_KNOWLEDGE.md); verify live settings before relying on them.

## Verification and next work

The Chinese [verification report](docs/superpowers/reports/portfolio-bilingual-verification.md) maps AC-01–13 to commands, evidence, user review and unverified boundaries. The [approved spec](docs/superpowers/specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md), [plan](docs/superpowers/plans/2026-10-13-portfolio-bilingual-and-active-badge.md) and [execution ledger](docs/superpowers/tickets/2026-10-13-portfolio-bilingual-and-active-badge-design/progress.md) are the implementation record.

Phase 4 follows its [spec](docs/superpowers/specs/2026-10-15-phase4-chat-ai-sdk-design.md) and [matching tickets](docs/superpowers/tickets/2026-10-15-phase4-chat-ai-sdk-design/README.md). P4-01 added quota/settlement plumbing; P4-02 migrates the server model runtime and real usage. P4-03 moves the browser to a shared `@ai-sdk/react` Chat/useChat instance and the SDK UI message stream at `/api/chat/v2`. The legacy `/api/chat` `{content}` / `[DONE]` endpoint remains available for already-open pages. Both adapters share input normalization, origin/verification checks, IP admission, model runtime and settlement. V2 accepts only text parts and user/assistant roles, strips client metadata, and emits a normal finish only after settlement. A truncated stream keeps partial text and reports failure; only a completed finish increments the browser verification counter. Explicit Stop cancels the request; closing, Escape, language changes and route unmounts do not. Session lifetime and server-only keys remain intact. Complete one ticket and wait for the owner's review before starting the next.

No commit, push or deployment is authorized by running the verification commands. Stage only intentional task files when the owner later requests a commit.


The shared system prompt limits answers to Jason/过汇智融, documented background, experience, skills, projects, career fit, listed interests and this website. Generic coding, homework, translations, calculations and unrelated creative requests are declined; mixed requests only get the relevant part answered. A technology name in the skills list does not make the assistant a general tutor. Refusal wording is selected for the current message (Chinese text → Chinese, otherwise English). This is a model instruction, not a server-side guarantee against all prompt injection; refusals still consume a model request and tokens. Existing IP admission and output limits remain the cost controls.

Paid opt-in scope probes: `node --env-file=.env.local --conditions=react-server --import tsx scripts/verify-chat-scope.ts` (real DeepSeek) and the same command with `--fallback` (controlled primary HTTP failure followed by real OpenAI). These use fixed public synthetic questions, do not run in the unit suite, and do not send mail. No new-conversation button is provided; a full page refresh resets the browser transcript.

Phase 4 cleanup removes the unused direct `openai` dependency, not the `@ai-sdk/openai` fallback. See the [Phase 4 verification report](docs/superpowers/reports/phase4-chat-verification.md) for actual service evidence, test results and the final owner approval recorded on 2026-10-17. No commit, push or deployment is implied by passing checks.
