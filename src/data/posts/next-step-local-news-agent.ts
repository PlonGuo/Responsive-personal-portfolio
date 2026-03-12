import type { BlogPost } from '../../types/blog';

const post: BlogPost = {
  slug: 'next-step-local-news-agent',
  title:
    'My Next Step: Building a Local AI Agent That Fetches and Summarizes Daily News',
  excerpt:
    'Exploring PydanticAI, Crawl4AI, and FastAPI to build a personal news agent for my friends — and why this stack excites me.',
  date: '2026-02-11',
  tags: ['AI', 'PydanticAI', 'FastAPI', 'Crawl4AI', 'Python'],
  readTime: 7,
  content: `
# My Next Step: Building a Local AI Agent That Fetches and Summarizes Daily News

I've been building web apps, desktop apps, and dashboards. But recently, something new caught my attention — **AI agents that actually do useful things on their own**. Not chatbots. Not wrappers around GPT. Real agents that crawl, reason, and deliver value without you lifting a finger.

This is my next project: a local AI agent that fetches news from various sources and delivers clean, summarized daily briefings to my friends.

## Why This Project?

A few of my friends mentioned the same frustration: they want to stay informed but don't have time to scroll through multiple news sites every morning. They want a simple daily digest — just the important stuff, summarized, delivered.

I realized this is the perfect use case for an AI agent:

- **Automated**: Runs on a schedule, no manual trigger needed
- **Intelligent**: Understands context, filters noise, summarizes concisely
- **Personal**: Can be tuned to each person's interests
- **Local-first**: Runs on your own machine, no expensive cloud bills

## The Tech Stack I'm Going With

After researching the landscape, here's the stack I've chosen:

### PydanticAI — The Agent Framework

I chose **PydanticAI** over LangChain for a few reasons:

- **Type safety with Pydantic v2**: Structured outputs that are validated at runtime. No more hoping the LLM returns the right shape
- **Cleaner abstractions**: PydanticAI feels more Pythonic and less "framework-heavy" than LangChain
- **Built for production**: Dependency injection, structured results, and proper error handling out of the box

\`\`\`python
from pydantic_ai import Agent
from pydantic import BaseModel

class NewsSummary(BaseModel):
    headline: str
    source: str
    summary: str
    relevance_score: float

agent = Agent(
    'openai:gpt-4o-mini',
    result_type=list[NewsSummary],
    system_prompt="You are a news analyst. Summarize articles concisely."
)
\`\`\`

The fact that I can define my output schema as a Pydantic model and have the agent **guarantee** that shape is incredibly powerful.

### Crawl4AI — The Web Crawler

For actually fetching news content, I'm using **Crawl4AI**:

- **LLM-friendly output**: Returns clean markdown instead of raw HTML
- **JavaScript rendering**: Handles modern SPAs and dynamic content
- **Built-in extraction**: Can extract structured data using LLM or CSS strategies
- **Free and open source**: No API costs for crawling

\`\`\`python
from crawl4ai import AsyncWebCrawler

async def fetch_article(url: str) -> str:
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url)
        return result.markdown
\`\`\`

### Firecrawl — The Backup Plan

Some websites are tricky. They have aggressive anti-bot measures, complex JavaScript rendering, or paywalls. For those cases, **Firecrawl** is my fallback:

- **Cloud-based crawling**: Handles sites that block headless browsers
- **Clean markdown output**: Same LLM-friendly format as Crawl4AI
- **Reliable**: Enterprise-grade infrastructure

The strategy is simple: try Crawl4AI first (it's free and fast), fall back to Firecrawl if the content comes back empty or malformed.

\`\`\`python
async def fetch_with_fallback(url: str) -> str:
    content = await fetch_with_crawl4ai(url)
    if not content or len(content.strip()) < 100:
        content = await fetch_with_firecrawl(url)
    return content
\`\`\`

### FastAPI — The API Layer

Everything ties together through a **FastAPI** backend:

- **Async-first**: Perfect for I/O-heavy crawling operations
- **Auto-generated docs**: Swagger UI out of the box
- **Easy scheduling**: Background tasks for daily news runs
- **Clean API**: Friends can query their briefings via simple HTTP calls

### Redis — Caching and Task Queue

**Redis** handles two critical functions:

1. **Caching crawled content**: Avoid re-crawling the same article within 24 hours
2. **Rate limiting**: Respect source websites and avoid getting blocked

### Langfuse — Observability

This is one I'm particularly excited about. **Langfuse** gives me:

- **LLM call tracing**: See exactly what the agent is doing, what prompts are being sent, and what comes back
- **Cost tracking**: Monitor token usage and API costs
- **Quality evaluation**: Track summary quality over time
- **Debugging**: When a summary is bad, trace back to exactly which step went wrong

In production AI applications, observability isn't optional — it's essential.

## The Architecture

Here's how everything fits together:

1. **Scheduler** triggers the daily news fetch (cron via FastAPI background tasks)
2. **Source Manager** maintains a list of news sources per user
3. **Crawl4AI** fetches each source (with Firecrawl fallback)
4. **Redis** caches raw content to avoid redundant crawls
5. **PydanticAI Agent** processes raw content into structured summaries
6. **Langfuse** traces every LLM call for observability
7. **FastAPI** serves the summarized briefings via API endpoints

## Why PydanticAI Over LangChain?

I spent time evaluating both, and here's my honest take:

**LangChain** is powerful but feels over-abstracted for what I need. The chain/agent/tool paradigm adds complexity that doesn't pay off for a focused use case like this. Debugging LangChain pipelines can be painful because there are so many layers of abstraction.

**PydanticAI** is more focused:

- You define your agent, give it tools, specify the output type, and run it
- Pydantic v2 validation means you catch schema issues immediately
- The code reads like normal Python, not a DSL
- Dependency injection makes testing straightforward

For a project where I know exactly what I want the agent to do, PydanticAI is the cleaner choice.

## What I'm Looking Forward To

### 1. Real Agent Behavior
This isn't a chatbot. It's an agent that autonomously decides which articles matter, how to summarize them, and how to organize the output. That autonomy is what makes agents exciting.

### 2. Learning the Crawling Game
Web crawling in 2026 is not what it was five years ago. Sites are more dynamic, more protected, and more complex. Learning to navigate this landscape with tools like Crawl4AI and Firecrawl is a valuable skill.

### 3. Production AI Patterns
Caching, fallbacks, observability, structured outputs — these are the patterns that separate toy projects from real applications. This project forces me to learn all of them.

### 4. Helping My Friends
At the end of the day, I'm building this for real people. Just like the desktop app I built for my mom, this is software with a clear purpose and real users.

## Current Status

I'm in the research and design phase right now. I've prototyped the crawling pipeline, tested PydanticAI's structured output capabilities, and set up a basic FastAPI scaffold. Next steps:

1. Build the full crawling pipeline with fallback logic
2. Design the agent's summarization prompts
3. Set up Redis caching layer
4. Integrate Langfuse for tracing
5. Build a simple frontend for friends to customize their sources

## Final Thoughts

The AI agent space is moving incredibly fast. Every week there's a new framework, a new model, a new approach. But the fundamentals remain: **build something useful, use the right tools, and ship it**.

This project is my way of leveling up from building AI-powered features inside apps to building AI-native applications from the ground up. I'll share what I learn along the way.

---

*Stay tuned for a follow-up post once I have the first working prototype. If you're interested in the news agent or want to be an early tester, reach out!*
  `.trim(),
};

export default post;
