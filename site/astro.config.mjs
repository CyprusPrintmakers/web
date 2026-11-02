import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'
import sanity from '@sanity/astro'

// The Sanity integration and its React runtime are only loaded once a project
// exists, so every fixture build (and this repo today) works with no env at all.
const sanityIntegrations = process.env.SANITY_PROJECT_ID
  ? [
      react(),
      sanity({
        projectId: process.env.SANITY_PROJECT_ID,
        dataset: process.env.SANITY_DATASET,
        studioBasePath: '/admin',
        studioRouterHistory: 'hash',
      }),
    ]
  : []

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: process.env.PUBLIC_SITE_URL ?? 'https://cyprintmakers.densetheory.cc',
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
