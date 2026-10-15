import { notFound } from 'next/navigation';
import { getPageMetadata } from '@/lib/seo';
import { isLocale, locales } from '@/lib/i18n/locales';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getProjectsByYear } from '@/lib/content/projects';
import LabView from '@/src/components/LabView';

export function generateStaticParams() {
  return locales.map(lang => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return getPageMetadata(lang, 'lab');
}

export default async function LabPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return <LabView projectsByYear={getProjectsByYear(lang)} locale={lang}
    copy={{ sections: dict.sections, actions: dict.actions }} />;
}
