import { describe, expect, it } from 'vitest';
import { getProjects, getFeaturedProjects, validatePortfolioContent } from '../../lib/content/projects';
import { getEducation, getExperience, getResumeHref } from '../../lib/content/profile';
import { shared } from '../../content/portfolio/shared';
import { en } from '../../content/portfolio/en';
import { zh } from '../../content/portfolio/zh';

describe('portfolio language contract', () => {
  it('preserves facts and ordering while changing project descriptions', () => {
    const english = getProjects('en');
    const chinese = getProjects('zh');
    expect(chinese.map(p => p.id)).toEqual(english.map(p => p.id));
    expect(chinese.map(p => [p.id, p.year, p.image, p.demoUrl, p.githubUrl, p.technologies, p.featured, p.showActiveBadge]))
      .toEqual(english.map(p => [p.id, p.year, p.image, p.demoUrl, p.githubUrl, p.technologies, p.featured, p.showActiveBadge]));
    expect(chinese[0].description).toMatch(/[\u4e00-\u9fff]/);
    expect(english[0].description).not.toBe(chinese[0].description);
    expect(english).toHaveLength(10);
    expect(english.every(p => p.showActiveBadge === false)).toBe(true);
    expect(getFeaturedProjects('zh').map(p => p.id).slice(0, 2)).toEqual(['knowhive', 'smia-agent']);
  });

  it('matches education and experience identities in both languages', () => {
    expect(getEducation('zh').map(p => [p.id, p.year])).toEqual(getEducation('en').map(p => [p.id, p.year]));
    expect(getExperience('zh').map(p => [p.id, p.year])).toEqual(getExperience('en').map(p => [p.id, p.year]));
    expect(getExperience('zh').filter(p => p.company === '博世中国')).toHaveLength(2);
  });

  it('selects each existing resume without changing the resource URL language', () => {
    expect(decodeURI(getResumeHref('en'))).toBe('/Huizhirong Guo.pdf');
    expect(decodeURI(getResumeHref('zh'))).toBe('/过汇智融-中文简历.pdf');
  });

  it('rejects missing Chinese entities', () => {
    const broken = structuredClone(zh);
    delete (broken.projects as Record<string, unknown>)['knowhive'];
    expect(() => validatePortfolioContent({ shared, en, zh: broken })).toThrow(/knowhive/);
  });

  it('rejects duplicate project IDs', () => {
    const broken = structuredClone(shared);
    broken.projects[1].id = broken.projects[0].id;
    expect(() => validatePortfolioContent({ shared: broken, en, zh })).toThrow(/duplicate/i);
  });

  it('allows a future badge switch without accepting invalid flags', () => {
    const future = structuredClone(shared);
    future.projects[0].showActiveBadge = true;
    expect(() => validatePortfolioContent({ shared: future, en, zh })).not.toThrow();
    const invalid = { ...future, projects: future.projects.map((p, i) => i ? p : { ...p, showActiveBadge: 'yes' }) };
    expect(() => validatePortfolioContent({ shared: invalid, en, zh })).toThrow(/showActiveBadge/);
  });
});
