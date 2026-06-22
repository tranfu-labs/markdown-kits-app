import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const webPort = Number(process.env.E2E_WEB_PORT || 55173);
const apiPort = Number(process.env.E2E_API_PORT || 58877);
const shareDataFile = path.resolve('.tmp', `e2e-shares-${process.pid}.json`);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 30_000,
  expect: {
    timeout: 6_000
  },
  use: {
    acceptDownloads: true,
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `npx concurrently -k -n api,web "tsx server/index.ts" "vite --host 127.0.0.1 --port ${webPort} --strictPort"`,
    url: `http://127.0.0.1:${webPort}`,
    env: {
      API_PORT: String(apiPort),
      LIST_PAGE_PASSWORD: 'dev-password',
      NODE_ENV: 'development',
      SHARE_DATA_FILE: shareDataFile
    },
    reuseExistingServer: false,
    timeout: 120_000
  }
});
