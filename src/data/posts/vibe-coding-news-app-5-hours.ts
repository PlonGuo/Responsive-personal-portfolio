import type { BlogPost } from '../../types/blog';

const post: BlogPost = {
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
};

export default post;
