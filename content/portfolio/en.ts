import type { PortfolioText } from '../../lib/content/types';

export const en: PortfolioText = {
  "profile": {
    "name": "Huizhirong (Jason) Guo",
    "shortName": "Jason Guo",
    "title": "AI Agent & LLM Application Engineer",
    "bio": "I build AI agents and LLM applications, with full-stack and production backend experience. I like making technical choices that are driven by measurement rather than by feel.",
    "aboutDescription": "AI Agent and LLM application developer with full-stack engineering and production backend experience. I default to quantitative evaluation when choosing between architectures and models. Internship experience in both China and the US; comfortable working in English and Chinese.",
    "focus": [
      "Agent architecture & tool loops",
      "RAG retrieval pipelines",
      "LLM evaluation & cost optimization",
      "Production backend (Go / Python / TypeScript)"
    ]
  },
  "heroLines": [
    "Huizhirong Guo",
    "an AI Agent Engineer",
    "an LLM Application Developer",
    "a Full-Stack Engineer"
  ],
  "projects": {
    "knowhive": {
      "title": "KnowHive",
      "tagline": "Local-first RAG + Agent knowledge base desktop app",
      "description": "A local-first knowledge base desktop app with hybrid retrieval, an agent tool layer, long-term memory, and injection defenses — every retrieval change validated by RAGAS A/B before becoming the default.",
      "highlights": [
        "Retrieval: a unified document layer picks a chunking strategy per file type and uses parent/child blocks. Hybrid recall over vectors and FTS5 keywords, fused with RRF and reranked by a cross-encoder, then parent-block expansion restores context. Promoted to default only after RAGAS A/B showed context_precision 0.788 → 0.862. Also fixed FTS5 silently failing to tokenize Chinese, which had disabled keyword retrieval entirely (recall +0.054).",
        "Agent tooling: 7 knowledge-base and session-history tools on the AI SDK tool loop, with call caps and duplicate-retrieval guards so a text answer is always produced. Write operations fail closed and require human approval (HITL).",
        "Long-term memory: past conversations are distilled into semantic, preference, and episodic memories, retrieved by vector search or injected directly. Questions whose answer existed only in conversation history went from 0% to 100% correct.",
        "Refusal and injection defense: a rerank-score threshold turned unanswerable questions into correct refusals 32% → 91% of the time (4% false refusals). Spotlighting isolation cut injection success from 0.40 to 0.27. A later refactor regressed it to 0.47, caught by a self-built red-team suite before merge."
      ]
    },
    "mom-test-validation": {
      "title": "AI-Powered Mom Test Validation",
      "description": "Real-time Voice AI interviewer that conducts unbiased startup validation interviews using the Mom Test framework, then analyzes transcripts to extract validated pain points and insight reports."
    },
    "smia-agent": {
      "title": "SmIA - Social Media Intelligence Agent",
      "description": "AI-powered platform that aggregates and analyzes content from Reddit, YouTube, and Amazon, delivering structured trend reports with sentiment analysis and interactive visualizations."
    },
    "go-chatroom": {
      "title": "GoChatroom",
      "description": "Real-time chat backend in Go supporting private chat, group chat, and P2P video calling, with a React frontend on Vercel and the service on Fly.io.",
      "highlights": [
        "Goroutine-per-connection with separated read/write loops, buffered channels for non-blocking delivery, and differentiated backpressure for chat and signaling. Profiling traced a throughput ceiling to synchronous persistence inside the Hub event loop; proposed an async, sharded fix.",
        "Stateless JWT auth with zero DB lookups on business endpoints, Redis session management, and a custom WebRTC signaling service supporting ICE candidate queueing plus two-level recovery for signaling and media."
      ]
    },
    "travel-agent-booking": {
      "title": "Travel Agent Booking System",
      "description": "A comprehensive booking management system designed for travel agents to track flights, hotels, and insurance payments with customer payment tracking."
    },
    "flowboard": {
      "title": "Flowboard",
      "description": "Real-time collaborative kanban board with AI assistant and interactive whiteboard. Built with .NET 8 & Angular 17"
    },
    "sportlingo": {
      "title": "Sportlingo Coaching Dashboard",
      "description": "B2B coach dashboard for team management and analytics, enabling coaches to add users to teams, monitor individual progress, and track performance metrics."
    },
    "makeform": {
      "title": "Makeform.ai",
      "description": "An innovative platform that empowers users to easily design and deploy dynamic online forms using AI, enhancing productivity and user engagement."
    },
    "github-finder": {
      "title": "GitHub Finder",
      "description": "A web-based application that allows users to search for any GitHub account and browse their profile information."
    },
    "food-ecommerce": {
      "title": "Food E-commerce Platform",
      "description": "An online store for browsing and purchasing food products."
    }
  },
  "education": {
    "northeastern-ms-2024": {
      "degree": "M.S. in Computer Science",
      "school": "Northeastern University",
      "college": "Khoury College of Computer Sciences",
      "period": "Sep 2024 – May 2027 (Expected)"
    },
    "santa-clara-bs-2020": {
      "degree": "B.S. in Computer Science",
      "school": "Santa Clara University",
      "college": "College of Arts and Sciences",
      "location": "Silicon Valley, CA",
      "period": "Sep 2020 – Jun 2024"
    }
  },
  "experience": {
    "saisuode-agent-2026": {
      "title": "Agent Algorithm Intern",
      "company": "Saisuode Intelligence",
      "companyNote": "Embodied AI",
      "location": "Shanghai, China",
      "period": "Sep 2026 – Dec 2026",
      "summary": "On-robot Agent architecture and core algorithms",
      "highlights": [
        "Building the on-robot Agent architecture and implementing its core algorithms.",
        "Integrating the Agent with the motion-control and vision-perception modules, working alongside the locomotion and vision teams."
      ]
    },
    "bosch-email-2026": {
      "title": "Agent Development Intern",
      "company": "Bosch China",
      "location": "Wuxi, China",
      "period": "May 2026 – Aug 2026",
      "summary": "Email Assistant — led the Dify backend workflow (100+ DAU)",
      "highlights": [
        "Led design and delivery of the email assistant backend workflow: batch summarization of unread mail and multi-turn reply drafting. Designed multi-factory tenant routing with cost isolation, lightweight-model pre-routing, and automatic fallback on failure — keeping model spend controlled while serving multiple factories reliably.",
        "Built a 30-sample comparison harness from real emails and chose the architecture on end-to-end latency and output quality. Moving from Agent to Workflow cut P95 from 52s to 18s; tiered model routing then cut latency a further 50%+ on 70% of samples with no quality loss.",
        "With the platform managed by another team and no database access, instrumented parallel branches and reused the platform dedup to break usage monitoring down from application level to per-user call and cost tracking."
      ]
    },
    "bosch-scheduling-2026": {
      "title": "Agent Development Intern",
      "company": "Bosch China",
      "location": "Wuxi, China",
      "period": "May 2026 – Aug 2026",
      "summary": "Intelligent Scheduling POC",
      "highlights": [
        "Modeled material, capacity, and driver-vehicle shift constraints across 5 MySQL tables, exposed the data layer as an MCP service, and wrote a scheduling Skill so a deepagents Agent could generate schedules from live constraints and adjust them through multi-turn dialogue — turning fixed-rule scheduling into a natural-language, interactive decision POC."
      ]
    },
    "next-play-2025": {
      "title": "Software Engineer Intern",
      "company": "Next Play Games",
      "location": "San Jose, CA",
      "period": "Sep 2025 – Dec 2025",
      "summary": "B2B SaaS coaching platform",
      "highlights": [
        "Led full-stack development of a B2B SaaS coaching platform. Established a versioned migration pipeline: migrations validated per-PR and post-merge in CI before syncing to dev/prod, with a rollback strategy — removing schema drift risk under parallel development.",
        "Rebuilt the data path: direct Supabase access from the frontend under RLS, with business logic pushed down into Postgres RPC — end-to-end P95 from ~420ms to ~170ms. Replaced 1-second mobile polling with Realtime WebSocket subscriptions, cutting a single client from ~29,000 requests/day to a handful.",
        "Led AI-assisted development for the team: an AGENT.md that standardized coding-agent conventions across 10+ developers (3 new members onboarded from it), plus AI PR review via GitHub Actions so large AI-generated diffs stay reviewable, auto-filing an issue when CI fails.",
        "Built AI coaching features on the OpenAI API with an automated fine-tuning pipeline: 200+ samples, 5 fully automated iterations, zero manual intervention."
      ]
    },
    "geshang-fuxin-2025": {
      "title": "Backend Engineer Intern",
      "company": "Beijing Geshang Fuxin Wealth Advisory",
      "location": "Beijing, China",
      "period": "Jun 2025 – Aug 2025",
      "highlights": [
        "Maintained and extended 5 core RESTful APIs in a 7-year-old Flask/MongoDB codebase, keeping changes backward compatible with zero production interruption and no regressions.",
        "Replaced full-collection queries with pagination on list endpoints, cutting response time from 300–500ms to 200ms."
      ]
    }
  }
};
