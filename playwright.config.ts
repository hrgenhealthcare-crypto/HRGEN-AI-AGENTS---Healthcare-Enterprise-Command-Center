import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testIgnore: '**/authenticated/**', // signed-user flow uses playwright.auth.config.ts only
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4173/staff-crm',
    reuseExistingServer: false,
    timeout: 45_000,
    env: {
      NODE_ENV: 'production',
      PORT: '4173',
      GEMINI_API_KEY: 'synthetic-ci-only-no-network',
      HRGEN_INTERNAL_API_TOKEN: '',
      SUPABASE_URL: '',
    },
  },
});
