'use client';

import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import Image from 'next/image';
import type { PortfolioProfile } from '../../lib/content/types';
import type { Locale } from '../../lib/i18n/locales';
import type { Dictionary } from '../../lib/i18n/types';

export default function About({ profile: personalInfo, resumeHref, otherResumeHref, locale, copy }: {
  profile: PortfolioProfile; resumeHref: string; otherResumeHref: string; locale: Locale;
  copy: Pick<Dictionary, 'sections' | 'actions'>;
}) {
  return (
    <section id="about" className="py-20 lg:py-32 bg-white dark:bg-slate-900">
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
            {copy.sections.about}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{copy.sections.aboutSubtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl transform rotate-6" />
              <Image
                src="/images/self-pic.jpg"
                alt={personalInfo.name}
                fill
                sizes="(min-width: 640px) 320px, 256px"
                className="object-cover rounded-2xl shadow-xl"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              {personalInfo.aboutDescription}
            </p>

            {personalInfo.focus && (
              <ul className="space-y-2 mb-8">
                {personalInfo.focus.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800"
              >
                <span className="block text-3xl font-heading font-bold text-primary mb-1">
                  {personalInfo.stats.projects}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {copy.sections.projectsStat}
                </span>
              </motion.div>

              <motion.div
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800"
              >
                <span className="block text-3xl font-heading font-bold text-primary mb-1">
                  {personalInfo.stats.companies}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {copy.sections.companiesStat}
                </span>
              </motion.div>
            </div>

            {/* Download CV Buttons */}
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center sm:justify-start gap-3"
            >
              <a
                href={resumeHref}
                download
                target="_blank"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl cursor-pointer"
              >
                {copy.actions.downloadResume}
                <Download size={20} />
              </a>
              <a
                href={otherResumeHref}
                download
                target="_blank"
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium rounded-xl transition-all duration-200 shadow-md cursor-pointer"
              >
                {locale === 'en' ? copy.actions.downloadChineseResume : copy.actions.downloadEnglishResume}
                <Download size={20} />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
