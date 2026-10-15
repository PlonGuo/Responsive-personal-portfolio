import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { htmlLang, isLocale } from '@/lib/i18n/locales';
import Script from 'next/script';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getProfile, getSocialLinks } from '@/lib/content/profile';
import Header from '@/src/components/Header';
import Footer from '@/src/components/Footer';
import Chatbot from '@/src/components/Chatbot';
import UpdatesWidget from '@/src/components/UpdatesWidget';
import ThemeBootstrap from '@/src/components/ThemeBootstrap';
import LanguageNavigation from '@/src/components/LanguageNavigation';
import LanguageSwitcher from '@/src/components/LanguageSwitcher';
import { sans } from '@/lib/fonts';
import { SITE_URL, getIndexingRobots } from '@/lib/seo';
import '../globals.css';

export const dynamicParams = false;
export const metadata: Metadata = { metadataBase: new URL(SITE_URL), robots: getIndexingRobots() };
export default async function RootLayout({ children, params }: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const profile = getProfile(lang);
  return (
    <html lang={htmlLang[lang]} className={`light ${sans.variable}`} suppressHydrationWarning>
      <head><ThemeBootstrap locale={lang} /></head>
      <body>
        <LanguageNavigation copy={{ actions: dict.actions, a11y: dict.a11y, errors: dict.errors, forms: dict.forms }}>
        <Header locale={lang} name={profile.shortName} copy={{ nav: dict.nav, a11y: dict.a11y }} />
        {children}
        <Footer locale={lang} name={profile.shortName} title={profile.title}
          socialLinks={getSocialLinks()} year={new Date().getUTCFullYear()}
          copy={{ nav: dict.nav, sections: dict.sections, a11y: dict.a11y }} />
        <UpdatesWidget locale={lang} copy={{ updates: dict.updates, a11y: dict.a11y, errors: dict.errors }} />
        <Chatbot locale={lang} siteKey={process.env.TURNSTILE_SITE_KEY ?? ''}
          copy={{ chat: dict.chat, a11y: dict.a11y, errors: dict.errors }} />
        <LanguageSwitcher locale={lang} />
        </LanguageNavigation>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
