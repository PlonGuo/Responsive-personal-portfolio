// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import Portfolio from '../../src/components/Portfolio';
import LabView from '../../src/components/LabView';
import { getProject, getProjects } from '../../lib/content/projects';
import { getDictionary } from '../../lib/i18n/dictionaries';

for (const locale of ['en', 'zh'] as const) for (const id of ['knowhive', 'smia-agent']) {
  test(`${locale}/${id}: enabling the shared badge affects both renderers without changing Demo or Code links`, () => {
    const project = getProject(locale, id)!;
    const copy = getDictionary(locale);
    for (const render of [
      (visible: boolean) => <Portfolio projects={[{ ...project, showActiveBadge: visible }]} locale={locale} copy={copy} />,
      (visible: boolean) => <LabView projectsByYear={[[project.year, [{ ...project, showActiveBadge: visible }]]]} locale={locale} copy={copy} />,
    ]) {
      const off = new DOMParser().parseFromString(renderToStaticMarkup(render(false)), 'text/html');
      const on = new DOMParser().parseFromString(renderToStaticMarkup(render(true)), 'text/html');
      const badges = (document: Document) => [...document.querySelectorAll('span')].filter(node => node.textContent?.trim() === copy.actions.activeBadge);
      expect(badges(off)).toHaveLength(0); expect(badges(on)).toHaveLength(1);
      const links = (document: Document) => [...document.querySelectorAll('a')].map(node => node.getAttribute('href')).sort();
      expect(links(on)).toEqual(links(off));
      expect(links(on).includes(project.demoUrl ?? 'no-demo')).toBe(Boolean(project.demoUrl));
    }
    expect(getProjects(locale).every(project => project.showActiveBadge === false)).toBe(true);
  });
}
