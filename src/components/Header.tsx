import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, User, Code2, Briefcase, FolderOpen, Mail, FileText, Beaker, Sun, Moon } from 'lucide-react';
import avatarImage from '../assets/jason-clipart.jpg';
import { useTheme } from '../hooks/useTheme';

// Hash links for homepage sections
const homeSectionItems = [
  { name: 'Home', href: '#home', icon: Home },
  { name: 'About', href: '#about', icon: User },
  { name: 'Skills', href: '#skills', icon: Code2 },
  { name: 'Qualifications', href: '#qualifications', icon: Briefcase },
  { name: 'Portfolio', href: '#portfolio', icon: FolderOpen },
  { name: 'Contact', href: '#contact', icon: Mail },
];

// Route links for separate pages
const pageLinks = [
  { name: 'Blog', href: '/blog', icon: FileText },
  { name: 'Lab', href: '/lab', icon: Beaker },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isLabPage = location.pathname === '/lab';
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Only track sections on homepage
      if (!isHomePage) return;

      // Update active section based on scroll position
      const sections = homeSectionItems.map(item => item.href.slice(1));
      for (const section of sections.reverse()) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    // If we're not on homepage and clicking a hash link, navigate to home first
    if (!isHomePage && href.startsWith('#')) {
      window.location.href = '/' + href;
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 rounded-2xl ${
        isScrolled
          ? 'glass bg-white/80 dark:bg-slate-900/80 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#home');
            }}
            className="font-heading font-bold text-xl text-slate-900 dark:text-white hover:text-primary transition-colors cursor-pointer"
          >
            Huizhirong Guo
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* Homepage section links - only show on homepage */}
            {isHomePage && homeSectionItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeSection === item.href.slice(1)
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.name}
              </a>
            ))}

            {/* Back to Home link - show on non-home pages */}
            {!isHomePage && (
              <Link
                to="/"
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Home
              </Link>
            )}

            {/* Separator */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Page links (Blog, Lab) */}
            {pageLinks.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  location.pathname === item.href
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Theme Toggle - hide on Lab page */}
            {!isLabPage && (
              <button
                onClick={toggleTheme}
                className="ml-2 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            {/* Avatar */}
            <div className="ml-1">
              <img
                src={avatarImage}
                alt="Jason Guo"
                className="w-9 h-9 rounded-full object-cover border-2 border-primary/30 hover:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Mobile Menu Button & Avatar */}
          <div className="flex items-center gap-2">
            {/* Mobile Theme Toggle - hide on Lab page */}
            {!isLabPage && (
              <button
                onClick={toggleTheme}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            {/* Mobile Avatar */}
            <img
              src={avatarImage}
              alt="Jason Guo"
              className="md:hidden w-8 h-8 rounded-full object-cover border-2 border-primary/30"
            />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            isMenuOpen ? 'max-h-[500px] pb-4' : 'max-h-0'
          }`}
        >
          <div className="grid grid-cols-2 gap-2 pt-2">
            {/* Homepage section links */}
            {isHomePage ? (
              homeSectionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                      activeSection === item.href.slice(1)
                        ? 'text-primary bg-primary/10'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </a>
                );
              })
            ) : (
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Home size={18} />
                Home
              </Link>
            )}

            {/* Separator line */}
            <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 my-2" />

            {/* Page links (Blog, Lab) */}
            {pageLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    location.pathname === item.href
                      ? 'text-primary bg-primary/10'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
