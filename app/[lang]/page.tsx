import { notFound } from 'next/navigation';
import { getPageMetadata } from '@/lib/seo';
import { isLocale, locales } from '@/lib/i18n/locales';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getContactInfo, getEducation, getExperience, getHeroLines, getProfile, getResumeHref, getSkills, getSocialLinks } from '@/lib/content/profile';
import { getFeaturedProjects } from '@/lib/content/projects';
import { getLatestPosts } from '@/lib/content/posts';
import Hero from '@/src/components/Hero';
import About from '@/src/components/About';
import Skills from '@/src/components/Skills';
import Qualifications from '@/src/components/Qualifications';
import Portfolio from '@/src/components/Portfolio';
import Contact from '@/src/components/Contact';
import BlogPreview from '@/src/components/blog/BlogPreview';
import MotionSection from '@/src/components/MotionSection';

export function generateStaticParams() {
  return locales.map(lang => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return getPageMetadata(lang, 'home');
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const profile = getProfile(lang);
  const posts = getLatestPosts().map(post => ({
    slug: post.slug, title: post.title, excerpt: post.excerpt, date: post.date,
    tags: post.tags, readTime: post.readTime, coverImage: post.coverImage,
  }));
  return (
    <main>
      <MotionSection id="home"><Hero profile={profile} lines={getHeroLines(lang)} socialLinks={getSocialLinks()}
        copy={{ sections: dict.sections, actions: dict.actions, a11y: dict.a11y }} /></MotionSection>
      <MotionSection id="about"><About profile={profile} locale={lang}
        resumeHref={getResumeHref(lang)} otherResumeHref={getResumeHref(lang === 'en' ? 'zh' : 'en')}
        copy={{ sections: dict.sections, actions: dict.actions }} /></MotionSection>
      <MotionSection id="skills"><Skills skills={getSkills()}
        copy={{ sections: dict.sections, skillCategories: dict.skillCategories }} /></MotionSection>
      <MotionSection id="qualifications"><Qualifications education={getEducation(lang)} experience={getExperience(lang)}
        copy={{ sections: dict.sections }} /></MotionSection>
      <MotionSection id="portfolio"><Portfolio projects={getFeaturedProjects(lang)} locale={lang}
        copy={{ sections: dict.sections, actions: dict.actions, a11y: dict.a11y }} /></MotionSection>
      <BlogPreview posts={posts} locale={lang} copy={{ blog: dict.blog, actions: dict.actions }} />
      <MotionSection id="contact"><Contact contactInfo={getContactInfo()} siteKey={process.env.TURNSTILE_SITE_KEY ?? ''}
        copy={{ sections: dict.sections, forms: dict.forms, errors: dict.errors }} /></MotionSection>
    </main>
  );
}
