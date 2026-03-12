import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type ClickEvent = { clientX: number; clientY: number };

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    root.classList.add(theme);
    body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (event?: ClickEvent) => {
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';

    // Set ripple origin for CSS animation
    document.documentElement.style.setProperty('--ripple-x', `${x}px`);
    document.documentElement.style.setProperty('--ripple-y', `${y}px`);

    // Apply theme synchronously so View Transitions captures the correct snapshot
    const applyTheme = () => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(newTheme);
      localStorage.setItem('theme', newTheme);
      setTheme(newTheme);
    };

    const vt = (document as Document & { startViewTransition?: (fn: () => void) => void }).startViewTransition;
    if (vt) {
      vt.call(document, applyTheme);
    } else {
      applyTheme();
    }
  };

  return { theme, toggleTheme, setTheme };
}
