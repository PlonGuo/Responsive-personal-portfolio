import type { BlogPost } from '../../types/blog';

const post: BlogPost = {
  slug: 'smia-mcp-server',
  title: 'Adding MCP to SmIA: Making AI Digest Available to Any AI Client',
  excerpt:
    'How I added a public MCP server to SmIA so Claude Desktop, Cursor, and Windsurf can fetch AI digests directly — and why MCP is really just an API with an AI-friendly interface.',
  date: '2026-03-12',
  tags: ['AI', 'MCP', 'FastAPI', 'Python', 'SmIA'],
  readTime: 7,
  content: `
# Adding MCP to SmIA: Making AI Digest Available to Any AI Client

SmIA already had a web app and a Telegram bot. But there was a third interface I kept wanting — the ability to ask my AI coding assistant "what's trending in AI today?" and get SmIA's digest right inside the conversation. That's exactly what MCP enables.

**The update is live**: any MCP-compatible client can connect with zero configuration beyond a single URL.

---

## What is MCP, Really?

There's a lot of hype around MCP (Model Context Protocol), but after implementing it, here's my honest take: **MCP is essentially just an API, but designed for AI consumption instead of human consumption**.

Think about it. A traditional REST API returns JSON that a frontend developer reads, parses, and renders into UI. An MCP server returns structured data that an LLM reads, understands, and weaves into its response. The difference isn't the transport or the data — it's the consumer.

What makes MCP different from a regular API:

- **Tool descriptions are the documentation**. Instead of writing OpenAPI docs for humans, you write function docstrings that the LLM reads to decide when and how to call your tools
- **The return format is AI-optimized**. I return markdown-formatted strings instead of raw JSON, because LLMs work better with natural language structure
- **Discovery is built-in**. The client automatically learns what tools are available — no need for the user to read docs first

In practice, building an MCP server felt almost identical to building a REST API. The mental shift is: your "frontend" is now an LLM, not a React app.

---

## What I Built

I added a public MCP server to SmIA's existing FastAPI backend, mounted at \`/mcp\`. Three tools:

| Tool | What It Does |
|------|-------------|
| \`get_digest(topic)\` | Returns today's AI-curated digest (AI, Geopolitics, Climate, or Health) |
| \`get_digest_history(topic, days)\` | Returns the last N days of executive summaries for trend analysis |
| \`list_topics()\` | Lists available digest topics |

The key design decision: **fully public, no auth required**. The digest content is already public on the web app, so there's no reason to gate it behind tokens. This means any AI client can connect with just a URL — zero friction.

### How It Connects

Any MCP-compatible client (Claude Desktop, Cursor, Windsurf) just needs this config:

\`\`\`json
{
  "mcpServers": {
    "smia": {
      "url": "https://smia-agent.fly.dev/mcp"
    }
  }
}
\`\`\`

That's it. No API keys, no OAuth flow, no signup. Paste the config, and your AI assistant can now fetch real-time intelligence digests.

---

## Implementation: Surprisingly Simple

The entire MCP server is about 170 lines of Python. Here's why it was so straightforward:

### FastMCP + FastAPI = One Line Mount

\`\`\`python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("SmIA — Social Media Intelligence Agent")

# Mount on existing FastAPI app — no new server needed
app.mount("/mcp", mcp.streamable_http_app())
\`\`\`

The \`FastMCP\` library from Anthropic handles all the protocol negotiation. I just define tools as decorated Python functions and mount the ASGI sub-app on my existing Fly.io backend. No new machine, no new deployment, no new port.

### Tool Implementation

Each tool is just a function with a descriptive docstring:

\`\`\`python
@mcp.tool()
def get_digest(topic: str = "ai") -> str:
    """Get today's AI-curated digest for a topic.

    Available topics: ai, geopolitics, climate, health.
    If today's digest hasn't been generated yet, this triggers
    generation in the background and asks you to retry in ~1 minute.
    """
    result = claim_or_get_digest(topic=topic)

    if result["status"] == "completed":
        return _format_digest(result["digest"])

    # ... handle generating / failed states
\`\`\`

The docstring is critical — it's what the LLM reads to decide whether to call this tool. I spent more time writing clear docstrings than writing the actual logic.

### On-Demand Generation

The smartest design choice was reusing SmIA's existing lazy-trigger system. If today's digest doesn't exist yet when an AI client asks for it, the MCP server:

1. Claims a database lock (preventing duplicate generation)
2. Triggers background digest generation
3. Returns immediately with "please retry in ~1 minute"

This means the MCP server costs zero LLM tokens when nobody is using it — digests are only generated on first request.

### AI-Optimized Response Format

Instead of returning raw JSON (which would work but isn't ideal), I format responses as markdown:

\`\`\`python
def _format_digest(digest: dict) -> str:
    lines = [
        f"# {digest_date} — {display_name}",
        "",
        executive_summary,
        "",
        "## Top Stories",
    ]
    # Top 10 items sorted by importance
    for i, item in enumerate(sorted_items, 1):
        lines.append(f"{i}. **{item['title']}** ({item['source']})")
        lines.append(f"   {item['why_it_matters']}")
    # ...
    return "\\n".join(lines)
\`\`\`

LLMs parse markdown naturally. Returning structured markdown instead of JSON means the AI client can immediately incorporate the digest into its response without any parsing overhead.

---

## The Frontend Touch

I also added a fourth tutorial slide on SmIA's landing page — "Connect via MCP" — with a copyable JSON config block and a list of available tools. It's a small touch, but it makes onboarding frictionless: users see the config, copy it, paste it into their AI client, done.

---

## What I Learned

### 1. MCP Demystifies Quickly

Before building this, MCP felt like a big new protocol to learn. After building it, I realized it's just a thin wrapper around function calls. If you can build a REST API, you can build an MCP server. The \`FastMCP\` library abstracts away all the protocol details.

### 2. Docstrings Are Your API Docs

In a REST API, you write documentation for humans. In MCP, your function docstrings ARE the documentation — the LLM reads them to understand what each tool does and when to use it. Good docstrings = good tool usage. Bad docstrings = the LLM will misuse your tools.

### 3. Return Markdown, Not JSON

This was the biggest practical insight. LLMs are text-native. When your MCP tool returns a well-formatted markdown string, the LLM can seamlessly integrate it into its response. Returning raw JSON forces the LLM to parse and reformat, which wastes tokens and introduces errors.

### 4. Public MCP Servers Are Underrated

Most MCP examples I've seen require authentication. But for public data, a zero-auth MCP server is incredibly powerful — it removes all friction. Anyone with an AI client can start querying your data in seconds.

---

## SmIA's Three Interfaces

SmIA now has three distinct ways to access its intelligence:

| Interface | Best For | Auth Required |
|-----------|----------|---------------|
| **Web App** | Full interactive experience — charts, history, filters | Yes (Supabase Auth) |
| **Telegram Bot** | Quick mobile queries on the go | Yes (binding code) |
| **MCP Server** | AI-native access from any coding assistant | No |

Each interface serves a different context, but they all share the same backend and data. The MCP server is the newest and arguably the most exciting — it turns SmIA from a product you visit into a capability your AI assistant has.

---

## Try It

Add this to your Claude Desktop or Cursor config:

\`\`\`json
{
  "mcpServers": {
    "smia": {
      "url": "https://smia-agent.fly.dev/mcp"
    }
  }
}
\`\`\`

Then ask: *"What's in today's AI digest?"*

---

*This is a follow-up to [SmIA Agent: From Blog Post to Live Product in 2 Days](/blog/smia-agent-from-idea-to-launch). The full project is on [GitHub](https://github.com/PlonGuo/smia-agent).*
  `.trim(),
};

export default post;
