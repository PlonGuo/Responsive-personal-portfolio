import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// --- INITIALIZATION ---
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- CONSTANTS ---
const GITHUB_REPO = 'PlonGuo/Responsive-personal-portfolio';
const CACHE_TTL_MINUTES = 5;

const ALLOWED_ORIGINS = [
  'https://plonguo.com',
  'https://www.plonguo.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// --- CORS Validation ---
function validateCORS(origin: string | undefined): boolean {
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return true;
  }
  return origin ? ALLOWED_ORIGINS.includes(origin) : false;
}

// --- Types ---
interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface CachedCommit {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
}

interface CacheRecord {
  commits: CachedCommit[];
  expires_at: string;
}

// --- Fetch from GitHub ---
async function fetchFromGitHub(): Promise<CachedCommit[]> {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=5`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-Website',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data: GitHubCommit[] = await response.json();

  return data.map((commit) => ({
    sha: commit.sha.substring(0, 7),
    message: commit.commit.message.split('\n')[0].substring(0, 72),
    date: commit.commit.author.date,
    author: commit.commit.author.name,
    url: commit.html_url,
  }));
}

// --- Cache Functions ---
async function getFromCache(): Promise<CacheRecord | null> {
  try {
    const { data, error } = await supabase
      .from('github_commits_cache')
      .select('commits, expires_at')
      .eq('repository', GITHUB_REPO)
      .single();

    if (error || !data) return null;

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return null;
    }

    return data as CacheRecord;
  } catch {
    return null;
  }
}

async function saveToCache(commits: CachedCommit[]): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000);

  try {
    await supabase.from('github_commits_cache').upsert(
      {
        repository: GITHUB_REPO,
        commits,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'repository' }
    );
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

async function getStaleCache(): Promise<CachedCommit[] | null> {
  try {
    const { data } = await supabase
      .from('github_commits_cache')
      .select('commits')
      .eq('repository', GITHUB_REPO)
      .single();

    return data?.commits || null;
  } catch {
    return null;
  }
}

// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS validation
  const origin = req.headers.origin;
  if (origin && !validateCORS(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  try {
    // Try to get from cache first
    const cached = await getFromCache();
    if (cached) {
      return res.status(200).json({
        commits: cached.commits,
        cached: true,
      });
    }

    // Fetch fresh data from GitHub
    const commits = await fetchFromGitHub();

    // Save to cache (async, don't wait)
    saveToCache(commits).catch(console.error);

    return res.status(200).json({
      commits,
      cached: false,
    });
  } catch (error) {
    console.error('GitHub commits error:', error);

    // Try to return stale cache on error
    const staleCommits = await getStaleCache();
    if (staleCommits) {
      return res.status(200).json({
        commits: staleCommits,
        cached: true,
        stale: true,
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch commits',
      commits: [],
    });
  }
}
