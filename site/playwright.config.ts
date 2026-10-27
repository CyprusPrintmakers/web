import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    // The Vercel adapter has no `astro preview` once the /api routes force a
    // server bundle, so e2e runs against the dev server instead. Astro's dev
    // CLI auto-backgrounds when it detects an agent harness; the env var
    // opts out (any value disables detection), keeping the server in the
    // foreground so Playwright owns its lifecycle. The stop prefix clears a
    // stale lockfile from a killed previous run.
    command: 'npx astro dev stop || true; npm run dev -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI && !process.env.PUBLIC_STAGING,
    timeout: 180_000,
    env: {
      CONTENT_SOURCE: 'fixtures',
      PUBLIC_STAGING: process.env.PUBLIC_STAGING ?? 'false',
      ASTRO_DEV_BACKGROUND: '0',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
