'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ExternalLink, Github, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { LocalizedProject } from '../../lib/content/types';
import type { Locale } from '../../lib/i18n/locales';
import type { Dictionary } from '../../lib/i18n/types';
import ActiveBadge from './ActiveBadge';


export default function Portfolio({ projects: displayProjects, copy, locale }: {
  projects: LocalizedProject[]; locale: Locale;
  copy: Pick<Dictionary, 'sections' | 'actions' | 'a11y'>;
}) {
  const reduced = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextProject = () => {
    setCurrentIndex((prev) => (prev + 1) % displayProjects.length);
  };

  const prevProject = () => {
    setCurrentIndex((prev) => (prev - 1 + displayProjects.length) % displayProjects.length);
  };

  const currentProject = displayProjects[currentIndex];

  return (
    <section id="portfolio" className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-4">
            {copy.sections.portfolio}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{copy.sections.portfolioSubtitle}</p>
        </motion.div>

        {/* Project Slider */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Project Image */}
              <div className="relative h-64 lg:h-[400px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentProject.id}
                    initial={false}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                    transition={{ duration: reduced ? 0 : 0.4 }}
                    className="absolute inset-0"
                  >
                    <Image src={currentProject.image} alt={currentProject.title} fill
                      sizes="(min-width: 1152px) 544px, (min-width: 1024px) calc((100vw - 64px) / 2), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
                      className="object-cover" />
                  </motion.div>
                </AnimatePresence>

                <ActiveBadge visible={currentProject.showActiveBadge} label={copy.actions.activeBadge} />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:hidden" />
              </div>

              {/* Project Content */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentProject.id}
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: reduced ? 0 : 0.4 }}
                  >
                    <h3 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 dark:text-white mb-4">
                      {currentProject.title}
                    </h3>

                    {currentProject.tagline && (
                      <p className="text-sm font-medium text-primary mb-2">
                        {currentProject.tagline}
                      </p>
                    )}

                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      {currentProject.description}
                    </p>

                    {currentProject.highlights?.length ? (
                      <details className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                        <summary className="cursor-pointer font-medium text-primary">{copy.sections.projectHighlights}</summary>
                        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                          {currentProject.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}
                        </ul>
                      </details>
                    ) : null}

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2 mb-8">
                      {currentProject.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Links */}
                    <div className="flex gap-4">
                      {currentProject.githubUrl && (
                        <a
                          href={currentProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer"
                        >
                          {copy.actions.source}
                          <Github size={18} />
                        </a>
                      )}
                      {currentProject.demoUrl && (
                        <a
                          href={currentProject.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 cursor-pointer"
                        >
                          {copy.actions.demo}
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevProject}
              className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white transition-all duration-200 shadow-md cursor-pointer"
              aria-label={copy.a11y.previousProject}
            >
              <ChevronLeft size={24} />
            </button>

            {/* Pagination Dots */}
            <div className="flex gap-2">
              {displayProjects.map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 cursor-pointer ${
                    index === currentIndex
                      ? 'bg-primary w-8'
                      : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                  }`}
                  aria-label={copy.a11y.project.replace("{count}", String(index + 1))}
                />
              ))}
            </div>

            <button
              onClick={nextProject}
              className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white transition-all duration-200 shadow-md cursor-pointer"
              aria-label={copy.a11y.nextProject}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* See More CTA */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-6"
          >
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {copy.actions.seeMoreProjects}{' '}
              <Link
                href={`/${locale}/lab`}
                className="inline-flex items-center gap-1 text-primary dark:text-white underline underline-offset-2 decoration-primary dark:decoration-white hover:decoration-transparent transition-all duration-200 font-medium"
              >
                {copy.sections.lab}
                <ArrowRight size={14} />
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
