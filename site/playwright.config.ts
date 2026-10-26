import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'npm run build:fixtures && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI && !process.env.PUBLIC_STAGING,
    timeout: 180_000,
    env: {
      CONTENT_SOURCE: 'fixtures',
      PUBLIC_STAGING: process.env.PUBLIC_STAGING ?? 'false',
      // Astro's preview CLI self-backgrounds when it detects an agent harness,
      // which makes Playwright see the web server exit immediately. Setting
      // this keeps `astro preview` in the foreground so Playwright owns it.
      ASTRO_PREVIEW_BACKGROUND: '1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
