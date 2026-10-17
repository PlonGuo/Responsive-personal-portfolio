import { defineConfig, devices } from '@playwright/test';
const port = Number(process.env.PORTFOLIO_TEST_PORT ?? 3000);
const baseURL = process.env.PORTFOLIO_TEST_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [{
    command: `pnpm exec next start --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/en`,
    reuseExistingServer: process.env.PORTFOLIO_TEST_USE_EXISTING === '1',
    timeout: 30_000,
  }, {
    command: 'node --import tsx tests/fixtures/chat-stream-server.mjs',
    env: { FIXTURE_ALLOWED_ORIGIN: baseURL },
    url: 'http://127.0.0.1:3219/health',
    reuseExistingServer: false,
    timeout: 10_000,
  }],
});
