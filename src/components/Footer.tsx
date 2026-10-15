'use client';

import { motion } from 'framer-motion';
import { ArrowUp, Linkedin, Github, Instagram } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SocialLink } from '../types';
import type { Locale } from '../../lib/i18n/locales';
import type { Dictionary } from '../../lib/i18n/types';

// Bluesky icon
const BlueskyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
  </svg>
);

const MediumIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

const socialIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin size={20} />,
  github: <Github size={20} />,
  instagram: <Instagram size={20} />,
  bluesky: <BlueskyIcon />,
  medium: <MediumIcon />,
};

// Links for homepage (hash navigation to sections)
const homePageLinks = [
  { name: 'about', href: '#about' },
  { name: 'portfolio', href: '#portfolio' },
  { name: 'contact', href: '#contact' },
] as const;

// Links for other pages (route navigation)
const otherPageLinks = [
  { name: 'home', href: '/' },
  { name: 'blog', href: '/blog' },
  { name: 'lab', href: '/lab' },
] as const;

export default function Footer({ locale, name, title, socialLinks, year, copy }: {
  locale: Locale; name: string; title: string; socialLinks: SocialLink[]; year: number;
  copy: Pick<Dictionary, 'nav' | 'sections' | 'a11y'>;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === `/${locale}`;
  const footerLinks = isHomePage ? homePageLinks : otherPageLinks;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };

  return (
    <footer className="relative bg-primary dark:bg-slate-950">
      {/* Scroll to Top Button */}
      <motion.button
        onClick={scrollToTop}
        initial={false}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="absolute -top-6 left-1/2 -translate-x-1/2 p-4 rounded-full bg-primary dark:bg-slate-800 text-white shadow-lg hover:bg-primary-dark dark:hover:bg-slate-700 transition-colors cursor-pointer"
        aria-label={copy.a11y.scrollTop}
      >
        <ArrowUp size={24} />
      </motion.button>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid md:grid-cols-3 gap-8 items-center text-center md:text-left">
          {/* Brand */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-heading font-bold text-white mb-2">
              {name}
            </h3>
            <p className="text-white/70">{title}</p>
          </motion.div>

          {/* Links */}
          <motion.ul
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-6"
          >
            {footerLinks.map((link) => (
              <li key={link.name}>
                {link.href.startsWith('#') ? (
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href);
                    }}
                    className="text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    {copy.nav[link.name]}
                  </a>
                ) : (
                  <Link
                    href={link.href === "/" ? `/${locale}` : `/${locale}${link.href}`}
                    className="text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    {copy.nav[link.name]}
                  </Link>
                )}
              </li>
            ))}
          </motion.ul>

          {/* Social Links */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex justify-center md:justify-end gap-4"
          >
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label={link.name}
              >
                {socialIcons[link.icon]}
              </a>
            ))}
          </motion.div>
        </div>

        {/* Copyright */}
        <motion.p
          initial={false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-white/50 text-sm mt-12 pt-8 border-t border-white/10"
        >
          © {year} {name}. {copy.sections.footerRights}
        </motion.p>
      </div>
    </footer>
  );
}
