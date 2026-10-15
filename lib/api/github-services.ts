import 'server-only';
import { getAdminClient } from '../supabase/admin';
import type { Commit, GithubServices, CommitCache } from './github-commits';

const REPOSITORY = 'PlonGuo/Responsive-personal-portfolio';
interface GithubCommit { sha: string; commit: { message: string; author: { name: string; date: string } }; html_url: string }
export const githubServices: GithubServices = {
  async read() {
    const { data, error } = await getAdminClient().from('github_commits_cache').select('commits, expires_at')
      .eq('repository', REPOSITORY).abortSignal(AbortSignal.timeout(2000)).maybeSingle();
    if (error || !data || !Array.isArray(data.commits)) return null;
    return data as CommitCache;
  },
  async write(commits: Commit[]) {
    const { error } = await getAdminClient().from('github_commits_cache').upsert({
      repository: REPOSITORY, commits, cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }, { onConflict: 'repository' }).abortSignal(AbortSignal.timeout(1000));
    if (error) throw new Error('GitHub cache unavailable');
  },
  async fetchFresh() {
    const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/commits?per_page=5`, {
      signal: AbortSignal.timeout(4000), cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Portfolio-Website',
        ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
      },
    });
    if (!response.ok) throw new Error('GitHub upstream unavailable');
    const data: GithubCommit[] = await response.json();
    return data.map(commit => ({
      sha: commit.sha.slice(0, 7), message: commit.commit.message.split('\n')[0].slice(0, 72),
      date: commit.commit.author.date, author: commit.commit.author.name, url: commit.html_url,
    }));
  },
};
