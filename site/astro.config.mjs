import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'
import sanity from '@sanity/astro'
import { loadEnv } from 'vite'

// Config runs before Astro loads .env into process.env, so read it explicitly.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')
const projectId = process.env.SANITY_PROJECT_ID ?? env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? env.SANITY_DATASET ?? 'production'
const siteUrl =
  process.env.PUBLIC_SITE_URL ?? env.PUBLIC_SITE_URL ?? 'https://cyprintmakers.densetheory.cc'

// The Sanity integration and its React runtime are only loaded once a project
// exists, so every fixture build (and this repo today) works with no env at all.
const sanityIntegrations = projectId
  ? [
      react(),
      sanity({
        projectId,
        dataset,
        studioBasePath: '/admin',
        studioRouterHistory: 'hash',
      }),
    ]
  : []

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: siteUrl,
  // sanity.config.ts is bundled for the browser, where `process` does not
  // exist. Bake the public values in at build time instead.
  vite: {
    define: {
      'process.env.SANITY_PROJECT_ID': JSON.stringify(projectId ?? ''),
      'process.env.SANITY_DATASET': JSON.stringify(dataset),
      'process.env.PUBLIC_SITE_URL': JSON.stringify(siteUrl),
    },
  },
  prefetch: { defaultStrategy: 'hover' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'el'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en-GB', el: 'el-CY' } },
      filter: page => !page.includes('404') && !page.includes('/preview'),
    }),
    ...sanityIntegrations,
  ],
})
