'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Dictionary } from '../../lib/i18n/types';
import type { Skill } from '../types';

// Import local SVG icons
const css3Icon = '/icons/css3.svg';
const csharpIcon = '/icons/csharp.svg';
const javaIcon = '/icons/java.svg';
const awsIcon = '/icons/aws.svg';
const navicatIcon = '/icons/navicat.svg';

// Map of local icons
const localIcons: Record<string, string> = {
  'css3': css3Icon,
  'csharp': csharpIcon,
  'java': javaIcon,
  'amazonwebservices': awsIcon,
  'navicat': navicatIcon,
};

// Slugs removed from Simple Icons at the brand's request — no CDN asset exists,
// so these render as a text tile instead of a logo.
const TEXT_ONLY_ICONS = new Set(['amazonaws', 'openai', 'langfuse', 'microsoftazure']);

// The tile spells the name out in full, so the longer brands step down a size to
// stay inside their footprint next to the logos.
const textTileFontSize = (name: string): string =>
  name.length <= 4 ? 'text-[10px]' : 'text-[9px]';

// Get icon URL - try local first, then Simple Icons CDN
const getIconUrl = (iconName: string) => {
  // Check if we have a local icon
  if (localIcons[iconName]) {
    return localIcons[iconName];
  }

  // Map some icon names to their correct Simple Icons slugs
  const iconMap: Record<string, string> = {
    'cplusplus': 'cplusplus',
    'nodedotjs': 'nodedotjs',
    'nextdotjs': 'nextdotjs',
    'visualstudiocode': 'visualstudiocode',
    'mathworks': 'mathworks',
    'cursor': 'cursor',
  };

  const slug = iconMap[iconName] || iconName;
  return `https://cdn.simpleicons.org/${slug}`;
};

// Let React own the fallback so later language renders keep the DOM in sync.
function SkillIcon({ skill }: { skill: Skill }) {
  const [failed, setFailed] = useState(false);
  if (TEXT_ONLY_ICONS.has(skill.icon)) {
    return (
      <div className={`w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white font-bold tracking-tight px-0.5 ${textTileFontSize(skill.name)}`}>
        {skill.name}
      </div>
    );
  }
  if (failed) return (
    <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary to-secondary rounded-lg text-white text-xs font-bold">
      {skill.name.slice(0, 2).toUpperCase()}
    </div>
  );
  return <img src={getIconUrl(skill.icon)} alt={skill.name}
    className="w-8 h-8 object-contain dark:invert-[0.8] group-hover:scale-110 transition-transform duration-200"
    loading="lazy" onError={() => setFailed(true)} />;
}

// Skill category colors
const categoryColors: Record<Skill['category'], string> = {
  ai: 'from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/30',
  language: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  framework: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  data: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
  tool: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
};


/** Controls the render order of the skill groups. */
const categoryOrder: Skill['category'][] = [
  'ai',
  'language',
  'framework',
  'data',
  'tool',
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Skills({ skills, copy }: {
  skills: Skill[]; copy: Pick<Dictionary, 'sections' | 'skillCategories'>;
}) {
  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <section id="skills" className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-800/50">
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
            {copy.sections.skills}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{copy.sections.skillsSubtitle}</p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryOrder.map((category, categoryIndex) => {
            const group = groupedSkills[category];
            if (!group || group.length === 0) return null;
            return (
              <motion.div
                key={category}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                className={`p-6 rounded-3xl bg-gradient-to-br ${categoryColors[category]} border backdrop-blur-sm`}
              >
                <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-white mb-6">
                  {copy.skillCategories[category]}
                </h3>
                <motion.div
                  variants={container}
                  initial={false}
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid grid-cols-3 sm:grid-cols-4 gap-4"
                >
                  {group.map((skill) => (
                    <motion.div
                      key={skill.name}
                      variants={item}
                      className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-10 h-10 flex items-center justify-center">
                        <SkillIcon skill={skill} />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                        {skill.name}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
