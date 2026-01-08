import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { personalInfo } from '../data/portfolio';

export default function About() {
  return (
    <section id="about" className="py-20 lg:py-32 bg-white dark:bg-slate-900">
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
            About
          </h2>
          <p className="text-slate-600 dark:text-slate-400">My Introduction</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl transform rotate-6" />
              <img
                src="/images/self-pic.jpg"
                alt="Jason Guo"
                className="relative w-full h-full object-cover rounded-2xl shadow-xl"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              {personalInfo.aboutDescription}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800"
              >
                <span className="block text-3xl font-heading font-bold text-primary mb-1">
                  {personalInfo.stats.projects}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Completed<br />Projects
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800"
              >
                <span className="block text-3xl font-heading font-bold text-primary mb-1">
                  {personalInfo.stats.companies}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Companies<br />Worked
                </span>
              </motion.div>
            </div>

            {/* Download CV Button */}
            <motion.a
              href="/Huizhirong Guo.pdf"
              download="Huizhirong_Guo_CV"
              target="_blank"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl cursor-pointer"
            >
              Download CV
              <Download size={20} />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
