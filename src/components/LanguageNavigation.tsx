'use client';

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Dictionary } from '../../lib/i18n/types';
import { beginLanguageNavigation, dismissLanguageError, getLanguageNavigation, getNavigationServerSnapshot,
  initializeLanguageNavigation, observeLanguageNavigation } from '../../lib/client/language-navigation';

type Copy = Pick<Dictionary, 'actions' | 'a11y' | 'errors' | 'forms'>;
const Context = createContext<Copy | null>(null);
export function useLanguageCopy() {
  const copy = useContext(Context);
  if (!copy) throw new Error('Language controls require the navigation boundary');
  return copy;
}
const subscribe = (listener: () => void) => getLanguageNavigation().subscribe(listener);
const getSnapshot = () => getLanguageNavigation().getSnapshot();
export function useLanguageNavigationState() {
  return useSyncExternalStore(subscribe, getSnapshot, getNavigationServerSnapshot);
}

export default function LanguageNavigation({ copy, children }: { copy: Copy; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useLanguageNavigationState();
  useEffect(() => { initializeLanguageNavigation(); observeLanguageNavigation(pathname); }, [pathname]);
  return <Context.Provider value={copy}>
    {children}
    {(state.pending || state.errorCode) && <div className="language-notice fixed z-[60] rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
      {state.pending ? <p role="status">{copy.a11y.loading}</p> : <>
        <p role="alert">{copy.errors.navigation}</p>
        <div className="mt-2 flex gap-4">
          <button className="text-primary underline" onClick={() => void beginLanguageNavigation(state.target, router)}>{copy.forms.retry}</button>
          <button onClick={dismissLanguageError}>{copy.a11y.close}</button>
        </div>
      </>}
    </div>}
  </Context.Provider>;
}
