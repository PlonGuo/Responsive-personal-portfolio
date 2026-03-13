import claudeDevSetupRalphLoop from './posts/claude-dev-setup-ralph-loop';
import smiaMcpServer from './posts/smia-mcp-server';
import smiaAgentFromIdeaToLaunch from './posts/smia-agent-from-idea-to-launch';
import nextStepLocalNewsAgent from './posts/next-step-local-news-agent';
import vibeCodingNewsApp5Hours from './posts/vibe-coding-news-app-5-hours';
import desktopAppForMom from './posts/desktop-app-for-mom';
import buildingSportlingo from './posts/building-sportlingo';
import stripeIntegrationLessons from './posts/stripe-integration-lessons';
import whyIChoseCs from './posts/why-i-chose-cs';

export const blogPosts = [
  claudeDevSetupRalphLoop,
  smiaMcpServer,
  smiaAgentFromIdeaToLaunch,
  nextStepLocalNewsAgent,
  vibeCodingNewsApp5Hours,
  desktopAppForMom,
  buildingSportlingo,
  stripeIntegrationLessons,
  whyIChoseCs,
];

// Helper functions
export function getAllPosts() {
  return blogPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getLatestPosts(count: number = 3) {
  return getAllPosts().slice(0, count);
}

export function getPostsByTag(tag: string) {
  return getAllPosts().filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  blogPosts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}
