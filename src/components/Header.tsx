'use client';

import Image from 'next/image';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '../../lib/i18n/locales';
import type { Dictionary } from '../../lib/i18n/types';
import { Menu, X, Home, User, Code2, Briefcase, FolderOpen, Mail, FileText, Beaker, Sun, Moon } from 'lucide-react';
const avatarImage = '/images/jason-clipart.jpg';
import { useTheme } from '../hooks/useTheme';
import LanguageSwitcher from './LanguageSwitcher';
import { getLanguageNavigation } from '../../lib/client/language-navigation';

// Hash links for homepage sections
const homeSectionItems = [
  { name: 'home', href: '#home', icon: Home },
  { name: 'about', href: '#about', icon: User },
  { name: 'skills', href: '#skills', icon: Code2 },
  { name: 'qualifications', href: '#qualifications', icon: Briefcase },
  { name: 'portfolio', href: '#portfolio', icon: FolderOpen },
  { name: 'contact', href: '#contact', icon: Mail },
] as const;

// Route links for separate pages
const pageLinks = [
  { name: 'blog', href: '/blog', icon: FileText },
  { name: 'lab', href: '/lab', icon: Beaker },
] as const;

export default function Header({ locale, name, copy }: {
  locale: Locale; name: string; copy: Pick<Dictionary, 'nav' | 'a11y'>;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const menuRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    // Move focus before aria-hidden/inert hides the menu from accessibility.
    if (menuRef.current?.contains(document.activeElement)) {
      menuToggleRef.current?.focus({ preventScroll: true });
    }
    setIsMenuOpen(false);
  }, []);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === `/${locale}`;
  const isLabPage = pathname === `/${locale}/lab`;
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
    const unsubscribe = getLanguageNavigation().subscribe(() => {
      if (getLanguageNavigation().getSnapshot().pending) closeMenu();
    });
    return () => { window.removeEventListener('scroll', handleScroll); unsubscribe(); };
  }, [isHomePage, closeMenu]);

  const handleNavClick = (href: string) => {
    closeMenu();
    // If we're not on homepage and clicking a hash link, navigate to home first
    if (!isHomePage && href.startsWith('#')) {
      router.push(`/${locale}${href}`);
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };

  return (
    <header
      className="site-header fixed top-0 inset-x-0 z-50"
      data-tone={isLabPage ? 'dark' : undefined}
      data-scrolled={isScrolled || isMenuOpen}
    >
      <div className="header-backdrop" aria-hidden="true">
        <span className="header-blur header-blur-soft" />
        <span className="header-blur header-blur-medium" />
        <span className="header-blur header-blur-strong" />
      </div>
      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href={`/${locale}#home`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#home');
            }}
            className={`font-heading font-bold text-xl ${isLabPage ? "text-white" : "text-slate-900 dark:text-white"} hover:text-primary transition-colors cursor-pointer`}
          >
            {name}
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Homepage section links - only show on homepage */}
            {isHomePage && homeSectionItems.map((item) => (
              <a
                key={item.name}
                href={`/${locale}${item.href}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeSection === item.href.slice(1)
                    ? 'text-primary bg-primary/10'
                    : `${isLabPage ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'} hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800`
                }`}
              >
                {copy.nav[item.name]}
              </a>
            ))}

            {/* Back to Home link - show on non-home pages */}
            {!isHomePage && (
              <Link
                href={`/${locale}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${isLabPage ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'} hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800`}
              >
                {copy.nav.home}
              </Link>
            )}

            {/* Separator */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Page links (Blog, Lab) */}
            {pageLinks.map((item) => (
              <Link
                key={item.name}
                href={`/${locale}${item.href}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  pathname === `/${locale}${item.href}`
                    ? 'text-primary bg-primary/10'
                    : `${isLabPage ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'} hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800`
                }`}
              >
                {copy.nav[item.name]}
              </Link>
            ))}

            {/* Theme Toggle - hide on Lab page */}
            {!isLabPage && (
              <button
                onClick={(e) => toggleTheme(e)}
                className={`ml-2 p-2 rounded-xl ${isLabPage ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'} hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200`}
                aria-label={theme === 'dark' ? copy.a11y.lightTheme : copy.a11y.darkTheme}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            {/* Avatar */}
            <div className="ml-1">
              <Image
                src={avatarImage}
                alt={name}
                width={36}
                height={36}
                loading="eager"
                className="w-9 h-9 rounded-full object-cover border-2 border-primary/30 hover:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Mobile Menu Button & Avatar */}
          <div className="flex items-center gap-2">
            {/* Mobile Theme Toggle - hide on Lab page */}
            {!isLabPage && (
              <button
                onClick={(e) => toggleTheme(e)}
                className={`lg:hidden p-2 rounded-xl ${isLabPage ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
                aria-label={theme === 'dark' ? copy.a11y.lightTheme : copy.a11y.darkTheme}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            {/* Mobile Avatar */}
            <Image
              src={avatarImage}
              alt={name}
              width={32}
              height={32}
              loading="eager"
              className="lg:hidden w-8 h-8 rounded-full object-cover border-2 border-primary/30"
            />
            <button
              id="mobile-menu-toggle"
              ref={menuToggleRef}
              onClick={() => isMenuOpen ? closeMenu() : setIsMenuOpen(true)}
              className={`lg:hidden p-2 rounded-xl ${isLabPage ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
              aria-label={isMenuOpen ? copy.a11y.closeMenu : copy.a11y.menu}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          id="mobile-navigation"
          ref={menuRef}
          inert={!isMenuOpen}
          aria-hidden={!isMenuOpen}
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
            isMenuOpen ? 'max-h-[500px] pb-4' : 'max-h-0'
          }`}
        >
          <div className="grid grid-cols-2 gap-2 pt-2">
            <LanguageSwitcher locale={locale} variant="menu" onSelect={closeMenu} />
            {/* Homepage section links */}
            {isHomePage ? (
              homeSectionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={`/${locale}${item.href}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                      activeSection === item.href.slice(1)
                        ? 'text-primary bg-primary/10'
                        : `${isLabPage ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'} hover:bg-slate-100 dark:hover:bg-slate-800`
                    }`}
                  >
                    <Icon size={18} />
                    {copy.nav[item.name]}
                  </a>
                );
              })
            ) : (
              <Link
                href={`/${locale}`}
                onClick={closeMenu}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${isLabPage ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'} hover:bg-slate-100 dark:hover:bg-slate-800`}
              >
                <Home size={18} />
                {copy.nav.home}
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
                  href={`/${locale}${item.href}`}
                  onClick={closeMenu}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    pathname === `/${locale}${item.href}`
                      ? 'text-primary bg-primary/10'
                      : `${isLabPage ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'} hover:bg-slate-100 dark:hover:bg-slate-800`
                  }`}
                >
                  <Icon size={18} />
                  {copy.nav[item.name]}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
