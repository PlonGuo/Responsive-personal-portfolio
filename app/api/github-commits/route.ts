import { createGithubRoute } from '@/lib/api/github-commits';
import { githubServices } from '@/lib/api/github-services';

export const maxDuration = 10;
const handle = createGithubRoute(githubServices);
export const GET = handle;
export const OPTIONS = handle;
