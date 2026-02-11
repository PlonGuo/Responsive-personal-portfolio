# Jason Guo's Personal Portfolio Website

## Quick Context

React 19 + TypeScript + Tailwind CSS portfolio site. Dark/light mode, glassmorphism UI, fully responsive.

## Tech Stack

- **Core**: React 19, TypeScript, Vite 7
- **Styling**: Tailwind CSS 4, Framer Motion
- **Icons**: Lucide React, Simple Icons CDN
- **Package Manager**: pnpm

## Development Workflow

### Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview build
```

### Key File Locations

- **Content**: `src/data/portfolio.ts` (all text, projects, skills)
- **Components**: `src/components/` (modular React components)
- **Types**: `src/types/index.ts`
- **Theme**: `src/hooks/useTheme.ts`

## Code Standards & Conventions

### Component Structure

- Use functional components with TypeScript
- Props interfaces in same file, suffix with `Props`
- Export default component at bottom

### Styling Rules

- **Colors**: Primary `#3B82F6`, Secondary `#8B5CF6`, Accent `#06B6D4`
- **Corners**: `rounded-2xl` for cards
- **Glass Effect**: `backdrop-blur-xl` with opacity
- **Spacing**: Consistent Tailwind spacing scale

### Typography

- **Headings**: Space Grotesk
- **Body**: DM Sans

## Common Tasks

### Adding New Project

Edit `src/data/portfolio.ts`:

```typescript
{
  title: 'Project Name',
  description: 'Brief description...',
  image: '/images/project.jpg',
  demoUrl: 'https://...', // optional
  githubUrl: 'https://...', // optional
  technologies: ['React', 'TypeScript']
}
```

### Adding New Skill

Edit `src/data/portfolio.ts` skills array with:

- name, category, level (1-100)

### Updating Contact Info

Edit `contactInfo` in `src/data/portfolio.ts`

## Design System Reference

### Component Patterns

- **Cards**: Glass effect with `bg-white/10 dark:bg-white/5`
- **Buttons**: `shadow-primary/25` for depth
- **Animations**: Use Framer Motion `initial`, `whileInView`, `viewport`

### Accessibility Standards

- WCAG AA contrast ratios
- Keyboard navigation support
- Semantic HTML elements

## Supabase Configuration

The project uses Supabase for backend services. Configuration is stored in `.env.local`:

```bash
# .env.local (NOT committed to Git)
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ACCESS_TOKEN=your-access-token
```

**Important**:
- Never commit `.env.local` to Git (already in `.gitignore`)
- Use Supabase MCP tools when needed for database operations
- Tokens are available in `.env.local` for local development

## Deployment

- **Platform**: Vercel
- **Root**: `.` (project root)
- **Build**: `pnpm build`
- **Output**: `dist`
- **Environment Variables**: Add Supabase keys in Vercel dashboard
- **Security**: Cloudflare WAF proxy (see [CLOUDFLARE_WAF_SETUP.md](CLOUDFLARE_WAF_SETUP.md))

## Project Context for AI Assistance

### When Suggesting Changes:

1. Maintain glassmorphism aesthetic
2. Ensure dark mode compatibility
3. Keep mobile-first responsive design
4. Use TypeScript strictly (no `any`)
5. Follow existing component patterns

### Optimization Priorities:

1. Performance (lazy loading, code splitting)
2. Accessibility (ARIA labels, keyboard nav)
3. SEO (meta tags, semantic HTML)
4. Bundle size (tree-shaking, minimal deps)

## Sound Notification (macOS)

IMPORTANT: After finishing responding to my request or running a command, run this command to notify me by sound:

```bash
afplay /System/Library/Sounds/Funk.aiff
```

This uses macOS's built-in `afplay` command to play system sounds.

---

**Last Updated**: February 2026
**Skill Used**: `ui-ux-pro-max` for design intelligence
