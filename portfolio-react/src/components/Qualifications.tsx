import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Rocket } from 'lucide-react';
import { education, experience } from '../data/portfolio';

export default function Qualifications() {
  return (
    <section id="qualifications" className="py-20 lg:py-32 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-4">
            Qualification
          </h2>
          <p className="text-slate-600 dark:text-slate-400">My personal journey</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Education Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white">
                Education
              </h3>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

              {education.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-12 pb-8 last:pb-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{item.year}</span>
                  </div>

                  {/* Content card */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                    <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-1">
                      {item.degree}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {item.school}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {item.period}
                      {item.location && ` • ${item.location}`}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Rocket at the end */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute left-0 -bottom-4 w-8 h-8 flex items-center justify-center"
              >
                <Rocket className="w-5 h-5 text-primary transform rotate-45" />
              </motion.div>
            </div>
          </motion.div>

          {/* Experience Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Briefcase className="w-8 h-8 text-secondary" />
              <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white">
                Experience
              </h3>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-secondary via-secondary/50 to-transparent" />

              {experience.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-12 pb-8 last:pb-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-secondary/10 border-2 border-secondary flex items-center justify-center">
                    <span className="text-xs font-bold text-secondary">{item.year}</span>
                  </div>

                  {/* Content card */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                    <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {item.company}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                      {item.period}
                    </p>
                    {item.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Rocket at the end */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute left-0 -bottom-4 w-8 h-8 flex items-center justify-center"
              >
                <Rocket className="w-5 h-5 text-secondary transform rotate-45" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
