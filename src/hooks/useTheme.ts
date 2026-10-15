'use client';
import { useEffect } from 'react';
import { useSession } from './useSession';
import { getBrowserSession } from '../../lib/client/session';
import { applyTheme, setTheme, toggleTheme } from '../../lib/client/theme';
export function useTheme() {
  const theme = useSession('theme');
  useEffect(() => { applyTheme(getBrowserSession().getSnapshot().theme, false); }, []);
  return { theme, setTheme, toggleTheme };
}
