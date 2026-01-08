# Jason Guo's Personal Portfolio

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![Cloudflare](https://img.shields.io/badge/Protected%20by-Cloudflare-orange?style=flat&logo=cloudflare)](https://cloudflare.com)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

Modern, responsive personal portfolio website built with React 19, TypeScript, and Tailwind CSS. Features glassmorphism UI, dark mode, and comprehensive security protection.

🌐 **Live Demo**: [plonguo.com](https://plonguo.com)

---

## ✨ Features

### 🎨 Design & UI
- **Glassmorphism Aesthetic** - Modern glass-effect components
- **Dark/Light Mode** - System preference detection with manual toggle
- **Fully Responsive** - Mobile-first design, works on all devices
- **Smooth Animations** - Framer Motion scroll and interaction effects
- **Accessibility** - WCAG AA compliant with keyboard navigation

### 🔒 Security & Performance
- **Cloudflare WAF** - Web Application Firewall protection
- **DDoS Protection** - Automatic attack mitigation
- **Rate Limiting** - API endpoint protection
- **Bot Defense** - Malicious bot blocking
- **CDN** - Global content delivery via Cloudflare (200+ locations)
- **SSL/TLS** - Full (strict) encryption end-to-end

### 🛠️ Technical Stack
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom theme
- **Build Tool**: Vite 7
- **Animations**: Framer Motion
- **Icons**: Lucide React + Local SVG assets
- **Backend**: Supabase for data storage
- **Email**: Resend for contact form
- **Deployment**: Vercel with Cloudflare proxy
- **Package Manager**: pnpm

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/PlonGuo/Responsive-personal-portfolio.git
cd Responsive-personal-portfolio

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_ACCESS_TOKEN=your-access-token
```

---

## 📁 Project Structure

```
Responsive-personal-portfolio/
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx       # Navigation with dark mode
│   │   ├── Hero.tsx         # Hero section
│   │   ├── About.tsx        # About section
│   │   ├── Skills.tsx       # Skills display
│   │   ├── Qualifications.tsx # Education & Experience
│   │   ├── Portfolio.tsx    # Project showcase
│   │   ├── Contact.tsx      # Contact form
│   │   └── Footer.tsx       # Footer with social links
│   ├── data/
│   │   └── portfolio.ts     # All content data
│   ├── hooks/
│   │   └── useTheme.ts      # Dark/light mode hook
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── assets/
│   │   └── icons/           # Local SVG icons
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/
│   ├── images/              # Project screenshots
│   └── favicon.svg          # Site favicon
├── api/
│   └── send-email.ts        # Serverless email function
├── .env.local               # Environment variables (not committed)
├── CLAUDE.md                # AI assistant context
├── CLOUDFLARE_WAF_SETUP.md  # Security configuration guide
├── CLOUDFLARE_DEPLOYMENT_KNOWLEDGE.md # Technical knowledge summary
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## 🎨 Customization

### Update Content

Edit `src/data/portfolio.ts` to update:
- Personal information
- Skills list
- Education history
- Work experience
- Project portfolio
- Social links
- Contact information

### Add New Project

```typescript
// src/data/portfolio.ts
{
  title: 'Project Name',
  description: 'Brief description...',
  image: '/images/project.jpg',
  demoUrl: 'https://demo-url.com',  // optional
  githubUrl: 'https://github.com/user/repo',  // optional
  technologies: ['React', 'TypeScript', 'Tailwind']
}
```

### Add New Skill

```typescript
// src/data/portfolio.ts
{ name: 'Skill Name', icon: 'icon-name', category: 'language' | 'framework' | 'tool' | 'design' }
```

### Design System

**Colors**:
- Primary: `#3B82F6` (Blue)
- Secondary: `#8B5CF6` (Purple)
- Accent: `#06B6D4` (Cyan)

**Typography**:
- Headings: Space Grotesk
- Body: DM Sans

**Components**:
- Cards: `rounded-2xl` with glass effect
- Buttons: `shadow-primary/25` for depth
- Animations: Framer Motion with `whileInView`

---

## 🔧 Deployment

### Vercel Deployment

1. **Connect Repository**:
   - Link GitHub repository to Vercel
   - Auto-deploy on `git push`

2. **Configure Project**:
   ```
   Root Directory: .
   Build Command: pnpm build
   Output Directory: dist
   Framework: Vite
   ```

3. **Add Environment Variables**:
   - Add Supabase keys in Vercel dashboard
   - Settings → Environment Variables

### Cloudflare WAF Setup

See [CLOUDFLARE_WAF_SETUP.md](CLOUDFLARE_WAF_SETUP.md) for detailed setup guide.

**Quick Summary**:
1. Add site to Cloudflare
2. Update nameservers at domain registrar
3. Configure DNS: `CNAME @ cname.vercel-dns.com` (Proxied)
4. Set SSL/TLS to **Full (strict)**
5. Enable WAF rules and rate limiting

---

## 📊 Performance

### Lighthouse Scores
- Performance: 98/100
- Accessibility: 100/100
- Best Practices: 100/100
- SEO: 100/100

### Optimizations
- ✅ Lazy loading for images
- ✅ Code splitting with Vite
- ✅ Tree-shaking for minimal bundle size
- ✅ Brotli/Gzip compression
- ✅ HTTP/2 support
- ✅ CDN caching (Cloudflare)

### Metrics
- **First Contentful Paint**: < 1.0s
- **Time to Interactive**: < 2.0s
- **Total Bundle Size**: 365 KB (gzipped: 117 KB)
- **Global Latency**: 50ms (avg)

---

## 🛡️ Security Features

### Cloudflare Protection
- **DDoS Mitigation** - Automatic attack defense
- **WAF Rules** - Block SQL injection, XSS attacks
- **Rate Limiting** - 10 requests/min per IP on API endpoints
- **Bot Fight Mode** - Block malicious bots
- **Geo-blocking** - Optional country restrictions

### SSL/TLS
- **Mode**: Full (strict) - End-to-end encryption
- **Version**: TLS 1.3
- **Certificate**: Cloudflare Universal SSL (auto-renew)

### API Security
- Request validation
- Cloudflare header verification
- Environment variable protection

---

## 🧑‍💻 Development

### Scripts

```bash
pnpm dev          # Start dev server (http://localhost:5173)
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
```

### Code Standards

- **TypeScript**: Strict mode, no `any` types
- **Components**: Functional components with hooks
- **Styling**: Tailwind utility classes
- **Naming**: PascalCase for components, camelCase for functions
- **Exports**: Default export for components

---

## 📚 Technical Knowledge

This project demonstrates knowledge of:

1. **Frontend Development**: React 19, TypeScript, Tailwind CSS
2. **DNS Management**: Nameserver configuration, CNAME records
3. **CDN Architecture**: Content delivery, edge caching
4. **SSL/TLS**: Encryption modes, certificate management
5. **Reverse Proxy**: Cloudflare as proxy layer
6. **Web Security**: WAF, DDoS protection, rate limiting
7. **HTTP Protocols**: HTTP/2, HTTPS handshake
8. **Cloud Architecture**: Edge computing, serverless functions

See [CLOUDFLARE_DEPLOYMENT_KNOWLEDGE.md](CLOUDFLARE_DEPLOYMENT_KNOWLEDGE.md) for detailed technical documentation.

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Huizhirong (Jason) Guo**

- Portfolio: [plonguo.com](https://plonguo.com)
- GitHub: [@PlonGuo](https://github.com/PlonGuo)
- LinkedIn: [jasonguo1104](https://linkedin.com/in/jasonguo1104)
- Email: jason.ghzr@gmail.com

---

## 🙏 Acknowledgments

- Design inspiration: Modern glassmorphism trends
- Icons: [Lucide](https://lucide.dev) + [Simple Icons](https://simpleicons.org)
- Fonts: [Google Fonts](https://fonts.google.com)
- Deployment: [Vercel](https://vercel.com)
- Security: [Cloudflare](https://cloudflare.com)
- Backend: [Supabase](https://supabase.com)

---

## 📞 Support

For questions or issues:
1. Open an issue on [GitHub](https://github.com/PlonGuo/Responsive-personal-portfolio/issues)
2. Contact via email: jason.ghzr@gmail.com

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**

*Last Updated: January 2026*
