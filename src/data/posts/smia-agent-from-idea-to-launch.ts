import type { BlogPost } from '../../types/blog';

const post: BlogPost = {
  slug: 'smia-agent-from-idea-to-launch',
  title: 'SmIA Agent: From Blog Post to Live Product in 2 Days',
  excerpt:
    'The follow-up to my "next step" post — how I shipped a dual-interface AI intelligence platform with PydanticAI, FastAPI, and React, and what I\'m planning next.',
  date: '2026-02-15',
  tags: ['AI', 'PydanticAI', 'FastAPI', 'React', 'Supabase', 'Langfuse'],
  readTime: 9,
  content: `
# SmIA Agent: From Blog Post to Live Product in 2 Days

Four days ago I wrote about [my next step](/blog/next-step-local-news-agent) — building an AI agent that crawls social media and delivers intelligence reports. That post was aspirational. This one is a progress report.

**SmIA is live**: [smia-agent.vercel.app](https://smia-agent.vercel.app)

It crawls Reddit, YouTube, and Amazon in parallel, cleans out the noise, runs everything through GPT-4o, and produces structured trend reports with sentiment analysis, key insights, and interactive charts. It has a web app, a Telegram bot, and full LLM observability through Langfuse.

Here's how I built it and what I learned.

---

## What Changed from the Original Plan

My original blog post outlined a news summarization agent. The actual product evolved into something broader — a **social media intelligence platform**. Instead of just summarizing news articles, SmIA answers natural language queries by aggregating and analyzing content across multiple platforms.

Ask *"What's the sentiment on Plaud Note?"* and SmIA will:

1. **Crawl** Reddit posts, YouTube comments, and Amazon reviews in parallel
2. **Clean** the data — stripping ads, spam, and off-topic noise
3. **Analyze** everything with GPT-4o, producing a structured intelligence report
4. **Visualize** the results with interactive charts, sentiment scores, and source breakdowns

The core idea — an AI agent that fetches, reasons, and delivers — stayed the same. The scope just got more ambitious.

## The Architecture

\`\`\`
                    Users
           ┌─────────┴─────────┐
      Web Browser         Telegram App
           │                    │
           ▼                    ▼
    ┌──────────────────────────────────┐
    │      Vercel (Edge + Serverless)  │
    │  ┌────────────┐ ┌─────────────┐ │
    │  │React SPA   │ │FastAPI +    │ │
    │  │Chakra UI v3│ │Mangum       │ │
    │  │Recharts    │ │PydanticAI   │ │
    │  └────────────┘ └──────┬──────┘ │
    └────────────────────────┼────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
    ┌──────────┐     ┌─────────────┐     ┌────────────┐
    │Supabase  │     │OpenAI       │     │Langfuse    │
    │PostgreSQL│     │GPT-4o       │     │Observability│
    │+ Auth    │     │             │     │            │
    └──────────┘     └─────────────┘     └────────────┘
\`\`\`

The backend is **FastAPI** running as Vercel serverless functions via Mangum. The agent itself is built with **PydanticAI** — the same framework I praised in my last post. The frontend is **React 19** with **Chakra UI v3** and **Recharts** for data visualization. Everything is tied together with **Supabase** for auth and PostgreSQL storage.

## PydanticAI in Practice

In my last post, I was excited about PydanticAI's structured outputs. After building an entire agent with it, I'm even more convinced it's the right choice.

The SmIA agent has 4 tools: \`fetch_reddit\`, \`fetch_youtube\`, \`fetch_amazon\`, and \`clean_noise\`. Every analysis produces a validated \`TrendReport\` Pydantic model containing sentiment scores, key insights, top discussions, keywords, and chart data.

The beauty is that the agent **decides** which sources to query and how to synthesize the results. It's not a rigid pipeline — it's an agent that reasons about the best approach for each query.

What I said about PydanticAI vs LangChain still holds: for a project where you know exactly what the agent should produce, PydanticAI's type-safe structured outputs are a killer feature.

## Data Sources and Crawling

| Source | Method | What's Collected |
|--------|--------|-----------------|
| **Reddit** | YARS library (no API key) | Posts, comments, upvotes, subreddit context |
| **YouTube** | YouTube Data API v3 | Video metadata, comment threads, like counts |
| **Amazon** | Firecrawl web scraping | Product reviews, ratings, review text |

Each source has a 45-second timeout. If one source fails, SmIA gracefully degrades and continues with the others. This resilience was something I learned the hard way — early versions would crash entirely if a single API call timed out.

## Dual Interface: Web + Telegram

The web app is the primary experience — natural language query input, real-time progress tracking, interactive results with charts, and a historical dashboard with search and pagination.

But I also built a **Telegram bot** as a companion interface. You can run \`/analyze <topic>\` from your phone and get a text summary, then review the full charts on desktop later. Both interfaces share the same backend and database through a binding code system.

This cross-platform sync was one of the more satisfying features to build. A single \`user_id\` from Supabase Auth links web sessions and Telegram accounts seamlessly.

## Langfuse: Observability That Actually Matters

In my last post, I mentioned Langfuse as something I was excited about. After using it in production, I can say it's **essential** for any AI application.

Every LLM interaction in SmIA is traced:

- Full call chain visibility — from user query to final report
- Per-tool tracing (fetch, clean, analyze)
- Token usage and cost tracking per query
- User and session attribution

When a report quality is off, I can trace back to exactly which step went wrong — was it bad source data? A noisy crawl? A poor summarization prompt? Langfuse makes debugging AI systems feel almost as straightforward as debugging traditional code.

## Security: Not an Afterthought

Building a multi-user platform forced me to take security seriously from day one:

- **Row Level Security** on all Supabase tables — users can only access their own data
- **JWT authentication** on all API endpoints
- **Input validation** via Pydantic models
- **Rate limiting** — 100 requests/hour (web), 10 analyses/hour (Telegram)

RLS in particular was a game-changer. Instead of writing authorization checks in every query, the database itself enforces access control.

## What I Learned

### 1. Serverless Has Constraints

Running FastAPI on Vercel serverless via Mangum works, but there are cold start penalties and execution time limits. For long-running analyses, I had to carefully optimize the crawling pipeline to stay within Vercel's function timeout.

### 2. Graceful Degradation is Essential

When you depend on external APIs (Reddit, YouTube, Amazon), things will fail. The key is designing for partial success — if two out of three sources return data, that's still a useful report.

### 3. Structured Outputs Change Everything

PydanticAI's structured outputs meant I never had to parse free-text LLM responses. The agent returns a validated \`TrendReport\` model or it fails — there's no ambiguous middle ground.

### 4. Ship Fast, Iterate Faster

Going from blog post to live product in 2 days was only possible because I made aggressive trade-offs. I didn't build every feature I wanted — I built the minimum viable intelligence platform and shipped it.

---

## What's Next

SmIA is live and functional, but there's a clear roadmap for improvement:

### Improving Data Fetching Success Rate and Precision

The current crawling pipeline works, but it's not perfect. Some Reddit queries return irrelevant threads, YouTube comments can be noisy, and Amazon scraping is fragile. I plan to:

- Fine-tune the search queries sent to each platform so they return more targeted results
- Add better content relevance scoring before passing data to the LLM
- Implement retry logic with query reformulation when initial fetches return low-quality data

The goal is higher signal-to-noise ratio — less junk in, better insights out.

### Scaling Beyond Vercel

Right now SmIA runs on Vercel's serverless infrastructure, which is great for quick deployment but has limitations. As user numbers grow, I'm planning to migrate the backend to **AWS** — likely a combination of Lambda for the API layer and ECS or EC2 for longer-running analysis tasks. This would remove the execution time constraints and give me more control over compute resources, caching, and background job processing.

### Better LLM Summarization and Key Point Extraction

The current GPT-4o integration produces solid reports, but there's room to improve how the LLM summarizes and extracts key points from fetched data. I'm planning to:

- Refine the system prompts and analysis instructions to produce more concise, actionable insights
- Experiment with chain-of-thought reasoning for complex multi-source analyses
- Add a post-processing step that ranks and filters insights by relevance and novelty
- Leverage Langfuse's prompt analytics to A/B test different summarization strategies

The ultimate goal is reports that feel like they were written by a domain expert, not just a language model.

---

## From Idea to Product

Four days ago, SmIA was a blog post. Today it's a live platform with real users, dual interfaces, and full observability. The stack I outlined in my last post — PydanticAI, FastAPI, Langfuse — delivered exactly what I hoped.

If you're thinking about building an AI agent, my advice is simple: **start with a clear problem, pick tools that enforce structure, and ship before you're ready**. You'll learn more from a week of real users than a month of planning.

Try it out: [smia-agent.vercel.app](https://smia-agent.vercel.app)

---

*This is a follow-up to my previous post, [My Next Step: Building a Local AI Agent](/blog/next-step-local-news-agent). If you're interested in the technical details, the source code is on [GitHub](https://github.com/PlonGuo/smia-agent).*
  `.trim(),
};

export default post;
