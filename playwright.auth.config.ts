import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser/authenticated',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4182',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    { name:'desktop-chromium', use:{ ...devices['Desktop Chrome'] } },
    { name:'mobile-chromium', use:{ ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npx tsx tests/browser/fixtures/staffHarness.ts',
    url: 'http://127.0.0.1:4182/staff-crm',
    reuseExistingServer:false,
    timeout: 45_000,
    env: {
      CI:'true',
      NODE_ENV:'test',
      HRGEN_INTERNAL_API_TOKEN:'',
      GEMINI_API_KEY:'',
      SUPABASE_URL:'',
    },
  },
});
