import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run emulators',
      port: 8080,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      port: 5173,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI
    }
  ]
});
