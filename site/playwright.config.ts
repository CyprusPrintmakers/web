import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.E2E_PORT ?? 4321)

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
  },
  webServer: {
    // The Vercel adapter has no `astro preview` once the /api routes force a
    // server bundle, so e2e runs against the dev server instead. Astro's dev
    // CLI auto-backgrounds when it detects an agent harness; the env var
    // opts out (any value disables detection), keeping the server in the
    // foreground so Playwright owns its lifecycle. The stop prefix clears a
    // stale lockfile from a killed previous run.
    command: `npx astro dev stop || true; npm run dev -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI && !process.env.PUBLIC_STAGING,
    timeout: 180_000,
    env: {
      CONTENT_SOURCE: 'fixtures',
      PUBLIC_STAGING: process.env.PUBLIC_STAGING ?? 'false',
      ASTRO_DEV_BACKGROUND: '0',
      // Test-only: site/.env points PUBLIC_SITE_URL at the staging Vercel URL,
      // which makes the canonical assertions depend on local env. Pin the
      // production origin for e2e runs; do not change production env.
      PUBLIC_SITE_URL: 'https://cyprintmakers.densetheory.cc',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
