import { motion } from 'framer-motion';
import { skills } from '../data/portfolio';

// Import local SVG icons
import css3Icon from '../assets/icons/css3.svg';
import csharpIcon from '../assets/icons/csharp.svg';
import javaIcon from '../assets/icons/java.svg';
import awsIcon from '../assets/icons/aws.svg';
import illustratorIcon from '../assets/icons/illustrator.svg';
import indesignIcon from '../assets/icons/indesign.svg';
import photoshopIcon from '../assets/icons/photoshop.svg';
import navicatIcon from '../assets/icons/navicat.svg';

// Map of local icons
const localIcons: Record<string, string> = {
  'css3': css3Icon,
  'csharp': csharpIcon,
  'java': javaIcon,
  'amazonwebservices': awsIcon,
  'adobeillustrator': illustratorIcon,
  'adobeindesign': indesignIcon,
  'adobephotoshop': photoshopIcon,
  'navicat': navicatIcon,
};

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
    'adobephotoshop': 'adobephotoshop',
    'mathworks': 'mathworks',
    'cursor': 'cursor',
  };

  const slug = iconMap[iconName] || iconName;
  return `https://cdn.simpleicons.org/${slug}`;
};

// Handle image load errors - show skill name initials as fallback
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  const parent = img.parentElement;
  if (parent) {
    const skillName = img.alt.replace(' icon', '');
    const initials = skillName.slice(0, 2).toUpperCase();

    // Create a fallback div with initials
    const fallback = document.createElement('div');
    fallback.className = 'w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary to-secondary rounded-lg text-white text-xs font-bold';
    fallback.textContent = initials;

    parent.replaceChild(fallback, img);
  }
};

// Skill category colors
const categoryColors = {
  language: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  framework: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  tool: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  design: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
};

const categoryLabels = {
  language: 'Languages',
  framework: 'Frameworks',
  tool: 'Database & Tools',
  design: 'Design',
};

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

export default function Skills() {
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-4">
            Skillset
          </h2>
          <p className="text-slate-600 dark:text-slate-400">My technical skills</p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(groupedSkills) as Array<keyof typeof categoryColors>).map((category, categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              className={`p-6 rounded-3xl bg-gradient-to-br ${categoryColors[category]} border backdrop-blur-sm`}
            >
              <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-white mb-6">
                {categoryLabels[category]}
              </h3>
              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-3 sm:grid-cols-4 gap-4"
              >
                {groupedSkills[category].map((skill) => (
                  <motion.div
                    key={skill.name}
                    variants={item}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <img
                        src={getIconUrl(skill.icon)}
                        alt={`${skill.name} icon`}
                        className="w-8 h-8 object-contain dark:invert-[0.8] group-hover:scale-110 transition-transform duration-200"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                      {skill.name}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
