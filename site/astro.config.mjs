import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: process.env.PUBLIC_SITE_URL ?? 'https://cyprintmakers.densetheory.cc',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'el'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap()],
})
