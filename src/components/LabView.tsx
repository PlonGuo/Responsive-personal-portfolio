'use client';

import Image from 'next/image';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ExternalLink, Github, Beaker, ArrowLeft } from 'lucide-react';
import type { LocalizedProject } from '../../lib/content/types';
import type { Locale } from '../../lib/i18n/locales';
import type { Dictionary } from '../../lib/i18n/types';
import ActiveBadge from './ActiveBadge';

const particles = Array.from({ length: 15 }, (_, i) => ({
  left: `${(i * 37 + 13) % 100}%`, top: `${(i * 23 + 7) % 100}%`,
  duration: 3 + (i % 5) * 0.4, delay: (i % 4) * 0.5,
}));

export default function LabView({ projectsByYear: groups, locale, copy }: {
  projectsByYear: Array<[number, LocalizedProject[]]>; locale: Locale;
  copy: Pick<Dictionary, 'sections' | 'actions'>;
}) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const projectsByYear = Object.fromEntries(groups);
  const sortedYears = groups.map(([year]) => year);

  return (
    <main className="min-h-screen bg-[#0a0f1a] relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 lab-grid-bg opacity-50" />

      {/* Scan Line Effect */}
      <div className="lab-scanline" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-500/30 rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
            }}
            animate={reduced ? undefined : {
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {copy.actions.backHome}
          </Link>

          {/* Header */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Beaker className="w-8 h-8 text-emerald-500" />
              <span className="text-emerald-500 text-sm uppercase">
                {copy.sections.labBadge}
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-heading font-bold text-white mb-4">
              {copy.sections.lab}
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {copy.sections.labSubtitle}
            </p>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ delay: reduced ? 0 : 0.2 }}
            className="space-y-16"
          >
            {sortedYears.map((year) => (
              <div key={year} className="relative">
                {/* Year Header */}
                <motion.div
                  initial={false}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 mb-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <h2 className="text-4xl font-heading font-bold text-white">
                      {year}
                    </h2>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
                </motion.div>

                {/* Projects Grid for this year */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-7">
                  {projectsByYear[year].map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={false}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      onMouseEnter={() => setHoveredProject(project.id)}
                      onMouseLeave={() => setHoveredProject(null)}
                      className="group relative"
                    >
                      <div
                        className={`bg-slate-900/80 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 border border-emerald-500/20 hover:border-emerald-500/50 ${
                          hoveredProject === project.id
                            ? 'lab-glow-border transform scale-[1.02]'
                            : ''
                        }`}
                      >
                        {/* Project Image */}
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            loading={year === sortedYears[0] && index === 0 ? 'eager' : 'lazy'}
                            sizes="(min-width: 1280px) 380px, (min-width: 1024px) calc((100vw - 140px) / 3), (min-width: 768px) calc((100vw - 100px) / 2), (min-width: 640px) calc(100vw - 78px), calc(100vw - 60px)"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

                          <ActiveBadge visible={project.showActiveBadge} label={copy.actions.activeBadge} />
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-xl font-heading font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                            {project.description}
                          </p>

                          {project.highlights?.length ? (
                            <details className="mb-4 text-sm text-slate-400">
                              <summary className="cursor-pointer font-medium text-emerald-400">{copy.sections.projectHighlights}</summary>
                              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                                {project.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}
                              </ul>
                            </details>
                          ) : null}

                          {/* Technologies */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.technologies.map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-1 text-xs bg-slate-800 text-emerald-400/80 rounded border border-emerald-500/20"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>

                          {/* Links */}
                          <div className="flex gap-3">
                            {project.githubUrl && (
                              <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                              >
                                <Github className="w-4 h-4" />
                                {copy.actions.source}
                              </a>
                            )}
                            {project.demoUrl && (
                              <a
                                href={project.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                              >
                                <ExternalLink className="w-4 h-4" />
                                {copy.actions.demo}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
