# Jason Guo's Personal Portfolio Website

## Project Overview

This is a modern personal portfolio website for Huizhirong (Jason) Guo, a Software Development Engineer. The project has been migrated from a static HTML/CSS/JS site to a React + TypeScript + Tailwind CSS application.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React + Simple Icons CDN
- **Package Manager**: pnpm

## Project Structure

```
portfolio-react/
├── public/
│   ├── images/           # Project screenshots and photos
│   └── favicon.svg       # Site favicon
├── src/
│   ├── components/       # React components
│   │   ├── Header.tsx    # Navigation with dark mode toggle
│   │   ├── Hero.tsx      # Hero section with typewriter effect
│   │   ├── About.tsx     # About section with stats
│   │   ├── Skills.tsx    # Bento grid skills display
│   │   ├── Qualifications.tsx  # Education & Experience timeline
│   │   ├── Portfolio.tsx # Project showcase slider
│   │   ├── Contact.tsx   # Contact form
│   │   └── Footer.tsx    # Footer with social links
│   ├── data/
│   │   └── portfolio.ts  # All portfolio content data
│   ├── hooks/
│   │   └── useTheme.ts   # Dark/light mode hook
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles with Tailwind
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## Key Features

- **Dark/Light Mode**: System preference detection with manual toggle
- **Responsive Design**: Mobile-first approach, works on all devices
- **Glassmorphism UI**: Modern glass-effect components
- **Smooth Animations**: Framer Motion for scroll and interaction animations
- **Accessibility**: WCAG compliant with proper contrast and keyboard navigation
- **Performance**: Optimized with lazy loading and efficient bundling

## Development Commands

```bash
cd portfolio-react

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deployment (Vercel)

When deploying to Vercel, configure:
- **Root Directory**: `portfolio-react`
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Framework Preset**: Vite

## Design System

### Colors
- Primary: `#3B82F6` (Blue)
- Secondary: `#8B5CF6` (Purple)
- Accent: `#06B6D4` (Cyan)

### Typography
- Headings: Space Grotesk
- Body: DM Sans

### Components
- Cards use rounded-2xl (16px) corners
- Buttons have shadow-primary/25 for depth
- Glass effects use backdrop-blur-xl

## Content Updates

All portfolio content is centralized in `src/data/portfolio.ts`:
- Personal information
- Skills list
- Education history
- Work experience
- Project portfolio
- Social links
- Contact information

## Adding New Projects

Edit `src/data/portfolio.ts`:

```typescript
{
  title: 'Project Name',
  description: 'Project description...',
  image: '/images/project-image.jpg',
  demoUrl: 'https://demo-url.com',  // optional
  githubUrl: 'https://github.com/...',  // optional
  technologies: ['React', 'TypeScript', ...]
}
```

## Claude Code Skills

This project uses the `ui-ux-pro-max` skill for UI/UX design intelligence. The skill provides:
- Style recommendations (glassmorphism, bento grid, etc.)
- Color palette suggestions
- Typography pairings
- Accessibility guidelines
- React-specific best practices
