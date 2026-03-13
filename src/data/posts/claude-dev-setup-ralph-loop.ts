import type { BlogPost } from '../../types/blog';

const post: BlogPost = {
  slug: 'claude-dev-setup-ralph-loop',
  title: 'How I Set Up Claude Code for Autonomous Development with the Ralph Loop',
  excerpt:
    'I spent a day building a reusable Claude Code configuration — a long-running autonomous loop, eval-driven task completion, and quality assurance commands. Here\'s what I learned from Anthropic\'s engineering playbook.',
  date: '2026-03-12',
  tags: ['AI', 'Claude Code', 'Automation', 'DevOps', 'Open Source'],
  readTime: 8,
  content: `
# How I Set Up Claude Code for Autonomous Development with the Ralph Loop

I've been using Claude Code daily for weeks — building SmIA, my portfolio site, side projects. But I kept running into the same friction: manually prompting Claude iteration after iteration, losing context mid-feature, forgetting to run tests before marking things done. I wanted Claude to work like a junior developer who can grind through a task list overnight while I sleep.

So I spent a day reading three Anthropic engineering articles, distilling their patterns into a reusable setup, and open-sourcing the result.

**The repo**: [claude-dev-setup](https://github.com/PlonGuo/claude-dev-setup)

---

## The Problem with Long-Running Claude Sessions

Claude Code is powerful, but it has a fundamental constraint: **context windows are finite**. A complex feature might take 20+ iterations to implement. By iteration 15, Claude is forgetting decisions from iteration 3. The quality degrades, it starts contradicting itself, and you end up manually correcting things that were already working.

The solution from Anthropic's own engineering team is surprisingly simple: **don't fight the context limit — embrace it**. Give each iteration a fresh context window and use external files as persistent memory.

---

## The Ralph Loop: Autonomous Task Execution

The core of my setup is the **Ralph loop** — a bash script that runs Claude Code in headless mode, one iteration at a time, with fresh context per call.

### How It Works

\`\`\`
Plan Mode (chat) → ralph → Review commits
\`\`\`

1. **Plan Mode**: I discuss requirements with Claude in a normal chat session. We design the architecture, break down the feature into small tasks.
2. **\`ralph\`**: One command. It initializes \`feature-requirements.md\` + \`progress.txt\`, then loops autonomously — each iteration gets a fresh context window, reads the progress file, picks the next uncompleted task, implements it, runs tests, commits, and updates progress.
3. **Review**: I check the git history when it's done. If something needs tweaking, I adjust and re-run \`ralph\` — it picks up from where it left off.

### The Key Insight: Git as Memory

Instead of relying on Claude's context window for state, the Ralph loop uses **git as its memory system**:

- \`progress.txt\` tracks which tasks are done (\`[x]\`) and which remain (\`[ ]\`)
- \`feature-requirements.md\` holds the full spec and design decisions
- Both files are committed to git after every change — atomic commits prevent state drift

When a new iteration starts, Claude reads \`git log --oneline -50\` and \`progress.txt\` to rebuild context. It doesn't need to remember anything — the state is right there in the files.

### Safety and Reliability

The v3 overhaul (which I finished today) addressed every sharp edge I hit during real usage:

| Problem | Solution |
|---------|----------|
| Hung Claude blocking the loop indefinitely | Per-call timeout (default 10 min, configurable) |
| Rapid retries burning API credits on rate limits | Exponential backoff (2^n seconds, capped at 60s) |
| Code and progress.txt committed separately — crash = state drift | Atomic commit: code + progress in one \`git commit\` |
| \`git add -A\` accidentally committing secrets | Explicit file adds with \`.gitignore\` warnings |
| Re-running \`ralph\` reset completed tasks | Resume mode: detects existing \`[x]\` tasks, skips re-init |
| \`--dangerously-skip-permissions\` with no warning | 5-second countdown with Ctrl+C escape hatch |

The script is about 100 lines of bash. Simple enough to understand, robust enough to run unattended for 50+ iterations.

---

## Eval-Driven Development: Tests as Completion Gates

This is the pattern from Anthropic's [Demystifying Evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) article that changed how I think about AI-assisted development:

**A task is only complete when its tests pass.**

In the Ralph loop, Claude can't just write code and mark a task \`[x]\`. It must:

1. Write the implementation
2. Run the corresponding unit tests
3. Only mark \`[x]\` if all tests pass
4. If tests fail, fix the code and try again — within the same iteration

This is essentially the AI equivalent of eval-driven development. The tests ARE the eval. They're the objective measure of whether the agent actually completed the task, not just whether it thinks it did.

### Why This Matters

Without test gates, I found Claude would mark tasks complete that were subtly broken — the code looked right, the commit message was confident, but the feature didn't actually work. Adding test gates eliminated this class of failure almost entirely.

The three-article pattern maps to a phased approach:
- **Phase 1 (during dev)**: Unit tests as completion criteria — no eval infrastructure needed
- **Phase 2 (pre-launch)**: Regression evals for core features
- **Phase 3 (at scale)**: Model-based graders for quality, capability evals from user feedback

For most solo projects, Phase 1 is all you need. The Ralph loop enforces it automatically.

---

## Quality Assurance: \`/quality-gate\` and \`/quality-fix\`

The second thing I built today was a pair of global Claude Code commands for engineering quality:

### \`/quality-gate\` — Read-Only Audit

Run this in any project and it will:

1. **Detect your stack** — reads \`CLAUDE.md\` first, then infers from project files (pyproject.toml, package.json, go.mod, etc.)
2. **Audit five dimensions** per stack:

| Check | What it looks for |
|-------|------------------|
| Tests | Is a test framework installed, configured, and in CI? |
| Coverage | Is coverage measurement set up with a threshold? |
| Linting | Is a linter installed and configured? |
| Type Checking | Is static type checking enabled? |
| Security Scan | Is dependency vulnerability scanning in place? |

3. **Write a gap report** to \`.claude/quality-gate.md\` — a checklist of what's missing

It works across Python, Node/TS, Go, Rust, Java, Ruby, and PHP. The key: it's **read-only**. It doesn't change any files, just tells you what's missing.

### \`/quality-fix\` — Implement with Safety Gates

After reviewing the gap report, run \`/quality-fix\` to implement the fixes. It has three explicitly gated steps:

1. **Config files** — updates manifest files with missing tool configurations
2. **Install dependencies** — lists exact commands, waits for your confirmation
3. **CI pipeline** — modifies \`.github/workflows/\` only after a separate explicit confirmation

After each fix, it immediately runs the tool to verify it works. If verification fails, it stops — no silent continuation to the next gap.

### Why Two Commands?

Audit and implementation have fundamentally different blast radii. \`/quality-gate\` is safe to run anytime — it's just reading your project. \`/quality-fix\` modifies files, installs dependencies, and touches CI pipelines. Separating them means you can audit freely and implement deliberately.

---

## The Three Articles That Made This Possible

Everything in this setup comes from three Anthropic engineering articles:

1. **[Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)** — the two-phase agent pattern (initializer + coding loop), state persistence via files, granular task lists to prevent "I'm done" hallucination

2. **[Building a C Compiler with Parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)** — git-based coordination, logging to files (not context), \`--fast\` mode for quick regression checks, keeping README/progress files updated for fresh agents

3. **[Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)** — tests as completion gates, phased rollout of eval complexity, the critical distinction between pass@k (capability) and pass^k (reliability)

I'd recommend every Claude Code user read all three. They changed my mental model of what "AI-assisted development" actually means — it's not about prompting better, it's about **building better harnesses**.

---

## What I Learned

### 1. Fresh Context Beats Long Context

Counter-intuitively, giving Claude a fresh context window every iteration produces more consistent results than trying to maintain one long session. The quality of iteration 40 is identical to iteration 1, because both start from the same clean state + progress file.

### 2. The Harness Is More Important Than the Prompt

I spent more time on \`ralph.sh\` (the loop runner) than on any prompt. Timeouts, backoff, atomic commits, resume logic — these infrastructure pieces determine whether the system is reliable, not the quality of any individual prompt.

### 3. Separation of Concerns Applies to AI Workflows Too

Planning (chat) → Execution (ralph) → Quality (quality-gate/fix) → Review (git log). Each phase has different requirements and different risk profiles. Mixing them leads to the same mess as mixing concerns in code.

### 4. Open Source Your Setup

After configuring all of this for myself, I realized other Claude Code users would benefit from the same patterns. The setup is language-agnostic and project-agnostic — paste the instruction file into a Claude Code session and it configures everything automatically.

---

## Try It

\`\`\`bash
git clone https://github.com/PlonGuo/claude-dev-setup.git
\`\`\`

Paste the contents of \`claude-code-setup-instruction-en.md\` (or the Chinese version) into a new Claude Code session. It will configure your \`~/.claude/\` environment, install the Ralph loop, and set up quality commands.

Then in any project:

\`\`\`bash
ralph    # autonomous task execution
\`\`\`

Or for quality assurance:

\`\`\`
/quality-gate    # audit
/quality-fix     # implement fixes
\`\`\`

---

*The repo is MIT licensed. If you find it useful, star it on [GitHub](https://github.com/PlonGuo/claude-dev-setup) — and if you hit edge cases, open an issue. The v3 overhaul fixed 10 bugs, but I'm sure there are more hiding in real-world usage.*
  `.trim(),
};

export default post;
