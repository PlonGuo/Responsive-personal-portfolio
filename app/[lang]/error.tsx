'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { recoverLanguageNavigation } from '../../lib/client/language-navigation';
import { useLanguageCopy } from '../../src/components/LanguageNavigation';

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const router = useRouter();
  const copy = useLanguageCopy();
  useEffect(() => { recoverLanguageNavigation(router); }, [error, router]);
  return <main className="min-h-screen px-6 pb-20 pt-32 text-center text-slate-900 dark:text-slate-100">
    <p role="alert">{copy.errors.generic}</p>
    <button className="mt-4 rounded-xl bg-primary px-5 py-3 text-white" onClick={retry}>{copy.forms.retry}</button>
  </main>;
}
