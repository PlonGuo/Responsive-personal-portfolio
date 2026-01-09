import { motion } from 'framer-motion';
import { ArrowUp, Linkedin, Github, Instagram } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { personalInfo, socialLinks } from '../data/portfolio';

// Bluesky icon
const BlueskyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
  </svg>
);

const socialIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin size={20} />,
  github: <Github size={20} />,
  instagram: <Instagram size={20} />,
  bluesky: <BlueskyIcon />,
};

// Links for homepage (hash navigation to sections)
const homePageLinks = [
  { name: 'About Me', href: '#about' },
  { name: 'My Portfolio', href: '#portfolio' },
  { name: 'Contact Me', href: '#contact' },
];

// Links for other pages (route navigation)
const otherPageLinks = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'Lab', href: '/lab' },
];

export default function Footer() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const footerLinks = isHomePage ? homePageLinks : otherPageLinks;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-primary dark:bg-slate-950">
      {/* Scroll to Top Button */}
      <motion.button
        onClick={scrollToTop}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="absolute -top-6 left-1/2 -translate-x-1/2 p-4 rounded-full bg-primary dark:bg-slate-800 text-white shadow-lg hover:bg-primary-dark dark:hover:bg-slate-700 transition-colors cursor-pointer"
        aria-label="Scroll to top"
      >
        <ArrowUp size={24} />
      </motion.button>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid md:grid-cols-3 gap-8 items-center text-center md:text-left">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-heading font-bold text-white mb-2">
              {personalInfo.shortName.split(' ')[0]}
            </h3>
            <p className="text-white/70">{personalInfo.title}</p>
          </motion.div>

          {/* Links */}
          <motion.ul
            initial={{ opacity: 0, y: 20 }}
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
                    {link.name}
                  </a>
                ) : (
                  <Link
                    to={link.href}
                    className="text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    {link.name}
                  </Link>
                )}
              </li>
            ))}
          </motion.ul>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
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
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-white/50 text-sm mt-12 pt-8 border-t border-white/10"
        >
          © {new Date().getFullYear()} Jason Guo. All rights reserved.
        </motion.p>
      </div>
    </footer>
  );
}
