'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Linkedin, Github, Instagram } from 'lucide-react';
import type { PortfolioProfile } from '../../lib/content/types';
import type { SocialLink } from '../types';
import type { Dictionary } from '../../lib/i18n/types';
import { useTypewriter } from '../hooks/useTypewriter';


// Bluesky icon as inline SVG since lucide doesn't have it
const BlueskyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
  </svg>
);

// Medium icon as inline SVG since lucide doesn't have it
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

interface HeroProps {
  profile: PortfolioProfile;
  lines: string[];
  socialLinks: SocialLink[];
  copy: Pick<Dictionary, 'sections' | 'actions' | 'a11y'>;
}

export default function Hero({ profile: personalInfo, lines, socialLinks, copy }: HeroProps) {
  const reduced = useReducedMotion();
  const displayText = useTypewriter(lines, Boolean(reduced));

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" />

      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={reduced ? undefined : {
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={reduced ? undefined : {
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Social Links - Vertical on desktop */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:flex flex-col gap-4"
          >
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/10 transition-all duration-200 shadow-sm cursor-pointer"
                aria-label={link.name}
              >
                {socialIcons[link.icon]}
              </a>
            ))}
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-center"
          >
            <motion.p
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-primary font-medium mb-4"
            >
              {copy.sections.welcome}
            </motion.p>

            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-slate-900 dark:text-white mb-4"
            >
              {copy.sections.greeting + " " + personalInfo.shortName}
            </motion.h1>

            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="h-16 sm:h-20 flex items-center justify-center mb-6"
            >
              <span data-typewriter className="text-2xl sm:text-3xl lg:text-4xl font-heading font-semibold text-primary">
                {displayText}
                <span aria-hidden="true" className="animate-pulse motion-reduce:hidden">|</span>
              </span>
            </motion.div>

            <motion.p
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mt-2"
            >
              {personalInfo.title}
            </motion.p>

            <motion.p
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed"
            >
              {personalInfo.bio}
            </motion.p>

            {/* Social Links - Horizontal on mobile */}
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex lg:hidden justify-center gap-4 mb-8"
            >
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/10 transition-all duration-200 shadow-sm cursor-pointer"
                  aria-label={link.name}
                >
                  {socialIcons[link.icon]}
                </a>
              ))}
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById('contact')
                    ?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 cursor-pointer"
              >
                {copy.actions.contactMe}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </a>
            </motion.div>

            {/* Scroll Down Indicator */}
            <motion.button
              onClick={scrollToAbout}
              initial={false}
              animate={reduced ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, 10, 0] }}
              transition={{
                opacity: { delay: 1 },
                y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="mt-12 text-primary hover:text-primary-dark transition-colors cursor-pointer"
              aria-label={copy.a11y.scrollAbout}
            >
              <ChevronDown size={40} />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
