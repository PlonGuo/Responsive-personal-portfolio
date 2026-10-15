import { isAllowedOrigin } from '../../src/api/security';
export interface Commit { sha: string; message: string; date: string; author: string; url: string }
export interface CommitCache { commits: Commit[]; expires_at: string }
export interface GithubServices {
  read(): Promise<CommitCache | null>;
  write(commits: Commit[]): Promise<void>;
  fetchFresh(): Promise<Commit[]>;
}

export function createGithubRoute(services: GithubServices) {
  return async (request: Request): Promise<Response> => {
    const headers: Record<string, string> = { Vary: 'Origin', 'Cache-Control': 'no-store' };
    const origin = request.headers.get('origin') ?? undefined;
    if (request.method !== 'GET' && request.method !== 'OPTIONS') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { ...headers, Allow: 'GET, OPTIONS' } });
    }
    if ((origin || request.method === 'OPTIONS') && !isAllowedOrigin(origin)) {
      return Response.json({ error: 'Forbidden' }, { status: 403, headers });
    }
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') {
      headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      return new Response(null, { status: 204, headers });
    }
    let cache: CommitCache | null = null;
    try { cache = await services.read(); } catch { /* Public GitHub data can still be fetched. */ }
    if (cache && Date.parse(cache.expires_at) > Date.now()) {
      return Response.json({ commits: cache.commits, cached: true }, { headers });
    }
    try {
      const commits = await services.fetchFresh();
      try { await services.write(commits); } catch { console.error('GitHub cache write failed'); }
      return Response.json({ commits, cached: false }, { headers });
    } catch {
      if (cache) return Response.json({ commits: cache.commits, cached: true, stale: true }, { headers });
      return Response.json({ error: 'Failed to fetch commits', commits: [] }, { status: 500, headers });
    }
  };
}
