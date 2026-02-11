import type { BlogPost } from '../types/blog';

export const blogPosts: BlogPost[] = [
  {
    slug: 'next-step-local-news-agent',
    title: 'My Next Step: Building a Local AI Agent That Fetches and Summarizes Daily News',
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
  },
  {
    slug: 'vibe-coding-news-app-5-hours',
    title: 'Vibe Coding: I Built a Mobile News App in 5 Hours with Just a PRD',
    excerpt:
      'How I used vibe coding with AI to go from a product requirements document to a fully functional news-fetching mobile app in a single sitting.',
    date: '2026-02-10',
    tags: ['Vibe Coding', 'AI', 'Mobile', 'React Native', 'Productivity'],
    readTime: 8,
    content: `
# Vibe Coding: I Built a Mobile News App in 5 Hours with Just a PRD

Five hours. That's all it took to go from a product requirements document to a working mobile news app — complete with API integration, category filtering, bookmarks, and a polished UI. No boilerplate templates. No copy-pasting from Stack Overflow. Just me, an AI coding assistant, and a clear PRD.

Welcome to **vibe coding**.

## What is Vibe Coding?

Vibe coding is a development approach where you collaborate with AI to build software at an accelerated pace. Instead of writing every line yourself, you:

1. **Define what you want** — clearly, specifically, in natural language
2. **Let AI generate the code** — complete implementations, not just snippets
3. **Guide and refine** — review, adjust, iterate
4. **Stay in the flow** — maintain momentum instead of getting stuck on syntax

It's not about replacing developers. It's about **amplifying** them. A clear vision combined with AI execution means you can move at a pace that was previously impossible.

## The PRD: What I Wanted to Build

Before writing a single line of code, I spent 30 minutes writing a detailed PRD. This is the most important step in vibe coding — **the quality of your input determines the quality of your output**.

Here's what my PRD outlined:

### Core Features
- **News Feed**: Fetch latest news from NewsAPI with infinite scroll
- **Categories**: Technology, Business, Sports, Entertainment, Health, Science
- **Search**: Full-text search across headlines and descriptions
- **Bookmarks**: Save articles locally for offline reading
- **Share**: Share articles via native share sheet
- **Dark Mode**: System-adaptive with manual toggle

### Technical Requirements
- React Native with Expo for cross-platform deployment
- TypeScript for type safety
- AsyncStorage for local bookmarks
- Pull-to-refresh and infinite scroll
- Skeleton loading states
- Error handling with retry mechanisms

### UI/UX Specifications
- Clean, card-based layout
- Category chips with horizontal scroll
- Bottom tab navigation (Feed, Search, Bookmarks, Settings)
- Smooth animations for transitions
- Haptic feedback on interactions

## The 5-Hour Build Timeline

### Hour 1: Project Setup and Navigation (0:00 - 1:00)

I started by describing the entire project structure to my AI assistant. Within minutes, I had:

\`\`\`
news-app/
├── src/
│   ├── screens/
│   │   ├── FeedScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── BookmarksScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── NewsCard.tsx
│   │   ├── CategoryChips.tsx
│   │   ├── SkeletonLoader.tsx
│   │   └── ErrorState.tsx
│   ├── hooks/
│   │   ├── useNews.ts
│   │   ├── useBookmarks.ts
│   │   └── useTheme.ts
│   ├── services/
│   │   └── newsApi.ts
│   └── types/
│       └── index.ts
\`\`\`

The bottom tab navigator was set up with icons, the theme system was in place, and all screens had their basic layouts.

**Key insight**: Giving the AI a complete file structure upfront means it generates code that references other files correctly from the start.

### Hour 2: News API Integration and Feed (1:00 - 2:00)

This was where the magic really showed. I described the data fetching requirements:

\`\`\`typescript
// The AI generated a complete custom hook
function useNews(category: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async (pageNum: number, refresh = false) => {
    // Full implementation with error handling,
    // pagination, and state management
  };

  const loadMore = () => setPage(prev => prev + 1);
  const refresh = () => fetchNews(1, true);

  return { articles, loading, refreshing, loadMore, refresh };
}
\`\`\`

The feed screen came together with:
- FlatList with infinite scroll via \`onEndReached\`
- Pull-to-refresh with \`RefreshControl\`
- Category chips that filter by topic
- Skeleton loading placeholders

What would normally take me half a day took 45 minutes. And the code was clean, well-typed, and followed React Native best practices.

### Hour 3: News Cards and Article View (2:00 - 3:00)

The NewsCard component was the visual heart of the app:

- Article thumbnail with fallback image
- Source name and publication time
- Headline with 2-line clamp
- Description preview
- Bookmark toggle button with haptic feedback
- Tap to open full article in an in-app browser

I described the card design once, and the AI produced a component that looked professional on the first render. Minor spacing tweaks were all it needed.

The article detail view used \`react-native-webview\` to display full articles with a custom header for navigation and sharing.

### Hour 4: Search, Bookmarks, and Offline (3:00 - 4:00)

**Search** was surprisingly smooth:
- Debounced text input to avoid API spam
- Real-time results as you type
- Recent search history stored in AsyncStorage
- Empty state with search suggestions

**Bookmarks** required careful thought about persistence:

\`\`\`typescript
// AsyncStorage-based bookmark system
const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Article[]>([]);

  const toggleBookmark = async (article: Article) => {
    const exists = bookmarks.some(b => b.url === article.url);
    const updated = exists
      ? bookmarks.filter(b => b.url !== article.url)
      : [...bookmarks, { ...article, bookmarkedAt: Date.now() }];

    setBookmarks(updated);
    await AsyncStorage.setItem('bookmarks', JSON.stringify(updated));
  };

  return { bookmarks, toggleBookmark, isBookmarked };
};
\`\`\`

### Hour 5: Polish, Settings, and Dark Mode (4:00 - 5:00)

The final hour was all about polish:

- **Dark mode**: Complete theme system with system detection and manual override
- **Settings screen**: Theme toggle, default category, clear bookmarks, app version info
- **Animations**: Fade-in for cards, scale animation on bookmark tap
- **Error states**: Network error screen with retry button, empty state illustrations
- **Performance**: Image caching, list optimization with \`getItemLayout\`

By the end of hour 5, I had a fully functional news app running on both iOS and Android simulators.

## Why Vibe Coding Works

### 1. The PRD is Your Superpower

Most developers jump straight into code. With vibe coding, the PRD is the code. The more specific and detailed your requirements, the better the AI output. I spent 30 minutes on the PRD and saved hours of implementation time.

### 2. AI Handles the Boilerplate

Let's be honest — 70% of app development is boilerplate. Navigation setup, API integration patterns, state management wiring, theme systems. AI handles all of this instantly, letting you focus on the unique parts of your app.

### 3. Iteration is Lightning Fast

Don't like how the cards look? Describe the change and get a new version in seconds. Want to add haptic feedback? One sentence and it's done. The feedback loop is so fast that you stay in a creative flow state.

### 4. You Still Need to Know What You're Doing

Here's the important caveat: **vibe coding amplifies skill, it doesn't replace it**. I could build this app in 5 hours because I understand:

- React Native architecture and its constraints
- Mobile UX patterns and platform conventions
- API integration best practices
- State management trade-offs
- Performance optimization techniques

The AI generated the code, but I directed every decision. I knew when to push back on a suggestion, when to refactor, and when the output was good enough to keep.

### 5. The PRD Forces Clarity of Thought

Writing the PRD before coding forced me to think through the entire app upfront. What screens do I need? How does data flow? What are the edge cases? This clarity meant fewer wrong turns during implementation.

## The Numbers

Let's put this in perspective:

- **Traditional development**: 3-5 days for an MVP of this scope
- **With vibe coding**: 5 hours for a polished, functional app
- **Lines of code generated**: ~2,500
- **Components created**: 12
- **Custom hooks**: 4
- **API integrations**: 1 (NewsAPI)
- **Bugs encountered**: 3 minor issues, all fixed in under 5 minutes each

That's roughly a **10x speedup** compared to traditional development.

## Common Objections (and My Responses)

### "But the code quality must be terrible"

Actually, no. The AI generates clean, typed, well-structured code. Are there occasional issues? Yes. But they're the same kind of issues any developer produces — and they're easy to spot and fix.

### "You're just copy-pasting, not really coding"

I'm architecting, reviewing, directing, and refining. The creative and technical decisions are all mine. The AI handles the mechanical translation from intent to implementation.

### "This won't work for complex applications"

You're right that a 5-hour build won't produce a production-ready enterprise app. But for MVPs, prototypes, personal projects, and proof-of-concepts? Vibe coding is a game-changer.

### "Aren't you worried about job security?"

No. Developers who can clearly articulate what they want and critically evaluate AI output are **more** valuable, not less. The skill ceiling goes up, not down.

## Tips for Your First Vibe Coding Session

1. **Write the PRD first** — Spend at least 20-30 minutes defining exactly what you want
2. **Be specific about architecture** — File structure, naming conventions, patterns
3. **Describe the UI precisely** — Colors, spacing, layout, interactions
4. **Handle one feature at a time** — Don't try to describe the entire app in one prompt
5. **Review every output** — Trust but verify. Read the generated code
6. **Iterate quickly** — If something's off, describe the fix immediately
7. **Know your tools** — Understanding the framework helps you guide the AI better

## What's Next

I'm planning to expand this app with:

- Push notifications for breaking news
- AI-powered article summarization
- Personalized feed based on reading history
- Widget support for quick news glances

And yes, I'll vibe code all of it.

## Conclusion

Vibe coding isn't a gimmick. It's a fundamental shift in how software gets built. The developer's role evolves from typist to architect — from writing every semicolon to designing systems and directing their implementation.

Five hours from PRD to working app. That's the power of vibe coding.

If you haven't tried it yet, start with a clear idea, write a detailed PRD, and let the AI surprise you. You might just build something amazing before lunch.

---

*The news app described in this post is a real project I built in a single sitting. Vibe coding is my preferred development approach for rapid prototyping and MVPs.*
    `.trim(),
  },
  {
    slug: 'desktop-app-for-mom',
    title: 'My First Real-World App: Building a Desktop Solution for My Mom\'s Business',
    excerpt:
      'How I built an Electron desktop app to help my mom manage her travel agency business, and what I learned about building for real users.',
    date: '2026-01-30',
    tags: ['Electron', 'Desktop', 'SQLite', 'UX', 'Real-World'],
    readTime: 7,
    content: `
# My First Real-World App: Building a Desktop Solution for My Mom's Business

This is the first time I built an app that truly solves a real-world problem for someone I care about. And honestly, it taught me more about software development than any tutorial ever could.

## The Problem

My mom runs a travel agency proxy service, helping clients book and change flight tickets, reserve hotels, and plan trips. For years, she's been manually recording every transaction in Excel spreadsheets - client names, booking details, payments, commissions, everything.

As the business grew and my mom got older, this manual process became increasingly problematic:

- **Time-consuming**: A single month's reconciliation could take up to 30 minutes when there were many transactions
- **Error-prone**: Manual data entry meant easy mistakes - a mistyped number here, a forgotten entry there
- **Stressful**: Monthly settlement with the agency company required accurate calculations, and errors could mean financial discrepancies

She needed a better solution, and I saw an opportunity to help.

## The Solution: A Custom Desktop App

I decided to build a desktop application that would:

1. **Automate transaction filing** - Organize all transactions for each month with clear, consistent formatting
2. **Instant calculations** - Automatically calculate the exact amount to pay the agent company
3. **Simple data entry** - Make adding new records as straightforward as possible
4. **Reliable updates** - Handle app upgrades seamlessly without technical knowledge

### Tech Stack

I chose:

- **Electron** - Cross-platform desktop framework
- **Vite** - Fast build tool and development experience
- **SQLite** - Local database for transaction storage

Since this was a customized solution specifically for my mom's workflow, I didn't deploy it online. It's a completely local application.

## Key Features

### 1. Transaction Management

The app maintains a SQLite database of all transactions:

\`\`\`typescript
interface Transaction {
  id: string;
  date: string;
  clientName: string;
  serviceType: 'flight' | 'hotel' | 'package';
  totalAmount: number;
  commission: number;
  status: 'pending' | 'completed';
  notes?: string;
}
\`\`\`

### 2. Monthly Reports

With a single click, the app generates formatted monthly reports showing:
- All transactions for the period
- Total revenue
- Total commissions
- Amount due to agency company
- Transaction breakdown by service type

What used to take 30 minutes now takes seconds.

### 3. Auto-Update System

This was crucial. I couldn't have my mom dealing with manual updates or complex installation steps. The app checks for updates on startup and installs them automatically:

\`\`\`typescript
// Using electron-updater
autoUpdater.on('update-downloaded', () => {
  // Show user-friendly notification
  // Install on next app restart
});
\`\`\`

She just clicks the installer once, and everything else is handled automatically.

## The Most Important Lesson: Design for Zero Technical Knowledge

Here's the biggest lesson I learned from this project:

**Never assume users know anything about computers or software.**

My mom isn't a developer. She's a travel agent who uses computers as a tool, not a passion. This forced me to rethink everything:

### Simplified Installation
- Single-click installer (no command line, no configuration)
- No additional software dependencies
- Works immediately after installation

### Intuitive Interface
- Large, clear buttons with icons and text
- Minimal options to avoid confusion
- Confirmation dialogs for important actions
- Helpful error messages (not "Error: undefined")

### Forgiving Design
- Auto-save on every change
- Undo capability for mistakes
- Data validation to prevent bad entries
- Regular automatic backups

### Zero Maintenance
- Automatic updates
- No database migrations to run manually
- Self-healing database integrity checks
- Clear feedback when something needs attention

## Real-World Impact

The app has been running for several months now, and the impact is clear:

- **Time saved**: Monthly reconciliation went from ~30 minutes to under 5 minutes
- **Fewer errors**: Automated calculations eliminated arithmetic mistakes
- **Reduced stress**: My mom has confidence in the numbers
- **Better organization**: All historical data is searchable and accessible

But beyond the metrics, I can see the relief in my mom's face when she uses it. That's worth more than any GitHub stars.

## What I'd Do Differently

Looking back, here are things I would improve:

1. **Better error logging** - I should have added analytics to catch errors remotely
2. **Data export** - Adding Excel export would have been helpful for accountants
3. **Cloud backup** - Optional cloud sync for data safety
4. **Multi-user support** - In case she wants to hire someone to help

## Key Takeaways for Building Real-World Apps

### 1. Understand the Actual Problem
Don't assume you know what users need. I spent hours watching my mom work before writing a single line of code.

### 2. Prioritize Reliability Over Features
A simple app that works perfectly beats a feature-rich app that crashes. Stability is everything when someone relies on your software for their livelihood.

### 3. The Installation Experience Matters
If users can't install your app easily, they won't use it. Period. This includes updates.

### 4. Test with Real Users
My mom found UX issues I never would have imagined. Watch real people use your software.

### 5. Maintenance is Part of the Product
Build in logging, error reporting, and update mechanisms from day one. You can't fix what you can't see.

## Conclusion

This project wasn't about cutting-edge technology or impressive algorithms. It was about solving a real problem for a real person. And that made all the difference.

Building software for my mom taught me that the best code isn't the most clever - it's the code that helps someone do their job better, faster, and with less stress.

If you're a developer, I encourage you to build something for someone you know. Ask your parents, friends, or local businesses what frustrates them. Then build a solution.

You'll learn more from one real user than from a thousand tutorial projects.

---

*This desktop app continues to help my mom manage her travel agency business every day. It's not open source, but the lessons from building it inform every project I work on.*
    `.trim(),
  },
  {
    slug: 'building-sportlingo',
    title: 'Building Sportlingo: A B2B Coaching Platform',
    excerpt:
      'My journey leading the development of a comprehensive coaching dashboard with React, Supabase, and AI features.',
    date: '2026-01-05',
    tags: ['React', 'Supabase', 'AI', 'TypeScript'],
    readTime: 8,
    content: `
# Building Sportlingo: A B2B Coaching Platform

At Next Play Games, I had the opportunity to lead the development of Sportlingo, a comprehensive B2B coaching platform. This was one of the most challenging and rewarding projects I've worked on.

## The Challenge

We needed to build a platform that would help coaches manage their teams, create training content, and leverage AI to enhance their coaching capabilities. The platform needed to handle:

- **Team Management**: Coaches needed to organize players, track progress, and manage schedules
- **Content Creation**: A system for creating and managing educational content
- **AI Integration**: Intelligent features to help coaches with lesson planning and player analysis
- **Payment Processing**: Subscription management with Stripe

## Tech Stack

After careful consideration, we chose:

- **Frontend**: React with TypeScript and Vite for fast development
- **Backend**: Supabase for authentication, database, and edge functions
- **Payments**: Stripe for subscriptions and webhook handling
- **AI**: OpenAI API for intelligent coaching features

## Key Technical Challenges

### 1. Stripe Integration

Implementing Stripe was more complex than expected. We had to handle:

\`\`\`typescript
// Webhook handling for subscription events
async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
      await activateSubscription(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await deactivateSubscription(event.data.object);
      break;
    // ... more cases
  }
}
\`\`\`

### 2. AI-Powered Features

We built an automated fine-tuning pipeline that retrains our GPT-4o mini models based on conversation data:

- Weekly automatic retraining
- Triggered when 50+ new conversation records are collected
- Supabase Edge Functions for the pipeline automation

### 3. Database Migrations

One of the trickiest parts was managing Supabase migrations between development and production environments. We had to carefully plan our schema changes to avoid data loss.

## Lessons Learned

1. **Start with a solid architecture** - Planning the data model upfront saved us countless hours
2. **Stripe webhooks are critical** - Don't rely on client-side confirmation alone
3. **AI features need guardrails** - Always validate and sanitize AI outputs
4. **Test with real data** - Edge cases only appear with real usage patterns

## Results

The platform is now actively used by coaches, helping them save time and improve their training programs. Leading this project taught me invaluable lessons about building production-grade applications.

---

*This project was built during my internship at Next Play Games Inc.*
    `.trim(),
  },
  {
    slug: 'stripe-integration-lessons',
    title: 'Lessons from Stripe Integration',
    excerpt:
      'What I learned implementing payment subscriptions, webhooks, and PCI compliance in a real-world application.',
    date: '2025-12-20',
    tags: ['Stripe', 'Payments', 'Backend', 'Security'],
    readTime: 6,
    content: `
# Lessons from Stripe Integration

Payment integration is one of those things that seems straightforward until you actually do it. Here's what I learned implementing Stripe in a production application.

## The Basics Are Deceptively Simple

Stripe's documentation is excellent, and getting a basic checkout working is easy:

\`\`\`typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: \`\${baseUrl}/success\`,
  cancel_url: \`\${baseUrl}/cancel\`,
});
\`\`\`

But production payment systems need much more.

## Webhook Reliability is Critical

The most important lesson: **never trust client-side confirmation alone**. Users can close their browser, lose connection, or manipulate requests. Webhooks are your source of truth.

Key webhook events to handle:

- \`checkout.session.completed\` - Payment successful
- \`customer.subscription.updated\` - Plan changes
- \`customer.subscription.deleted\` - Cancellations
- \`invoice.payment_failed\` - Failed renewals

## Idempotency Matters

Webhooks can be sent multiple times. Always use idempotent handlers:

\`\`\`typescript
async function handleWebhook(event: Stripe.Event) {
  // Check if we've already processed this event
  const processed = await db.events.findUnique({
    where: { stripeEventId: event.id }
  });

  if (processed) return; // Already handled

  // Process the event...

  // Mark as processed
  await db.events.create({
    data: { stripeEventId: event.id }
  });
}
\`\`\`

## Testing is Tricky

Stripe provides test mode, but testing webhooks locally requires:

1. Stripe CLI for forwarding webhooks
2. Test clocks for subscription scenarios
3. Different test card numbers for various scenarios

## PCI Compliance

By using Stripe Elements or Checkout, you avoid handling raw card data. This keeps you in the simplest PCI compliance tier (SAQ A). Never build your own card form unless you absolutely have to.

## Customer Portal Saves Time

Stripe's customer portal lets users manage their own subscriptions:

\`\`\`typescript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: \`\${baseUrl}/account\`,
});
\`\`\`

This handles plan upgrades, downgrades, payment method updates, and cancellations - all without you building UI.

## Final Thoughts

Payment integration requires more attention to edge cases than most features. Invest time in proper error handling, logging, and monitoring. Your users' money is at stake.

---

*These lessons came from building the payment system for Sportlingo at Next Play Games.*
    `.trim(),
  },
  {
    slug: 'why-i-chose-cs',
    title: 'Why I Chose Computer Science',
    excerpt:
      'The ability to create something from nothing with just a computer - that power of creation is what drew me to CS.',
    date: '2025-12-10',
    tags: ['Personal', 'Career', 'Reflection'],
    readTime: 4,
    content: `
# Why I Chose Computer Science

People often ask why I chose to study computer science. The answer is simple but profound: **the power of creation**.

## The Magic of Building

Think about other forms of creation. To build a car, you need factories, materials, and teams of people. To construct a building, you need architects, engineers, and construction crews. To create a ship, you need shipyards and massive resources.

But with programming? All you need is a computer.

With just my laptop, I can create:
- Applications used by thousands of people
- Tools that solve real problems
- Games that bring joy to players
- Systems that automate tedious tasks

This independence is intoxicating. I don't need permission, capital, or teams to create something meaningful. I just need an idea and the skills to execute it.

## From Consumer to Creator

Growing up, I was always fascinated by technology - playing games, using apps, wondering how they worked. The transition from consumer to creator was transformative.

The first time I built something that worked - a simple program that did exactly what I told it to do - I was hooked. It felt like magic, except I was the magician.

## The Endless Frontier

What keeps me excited about CS is that there's always more to learn. New frameworks, new paradigms, new problems to solve. The field moves so fast that yesterday's impossible becomes tomorrow's tutorial project.

## My Goal

My career goal is simple: **to independently develop a product with a significant user base**.

I want to create something that:
- People actually use and find valuable
- Solves a real problem in their lives
- I built with my own hands (and keyboard)

This isn't about fame or fortune. It's about the satisfaction of creation - of bringing something into the world that didn't exist before.

## The Journey Continues

I'm currently pursuing my Master's at Northeastern University, building projects at internships, and constantly learning. Every line of code I write brings me closer to that goal.

If you're considering CS, ask yourself: do you want to create? If the answer is yes, you've found your field.

---

*This is a personal reflection written during my graduate studies.*
    `.trim(),
  },
];

// Helper functions
export function getAllPosts(): BlogPost[] {
  return blogPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getLatestPosts(count: number = 3): BlogPost[] {
  return getAllPosts().slice(0, count);
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  blogPosts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}
