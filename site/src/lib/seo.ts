import type { Locale } from './i18n/locales'
import type { Settings, NewsPost, Project } from './content/types'
import { pickLocalized } from './i18n/localized'

const SITE_NAME_EN = 'Cyprus Printmakers Association'

export function pageTitle(page: string, siteName: string): string {
  return page.trim().toLowerCase() === siteName.trim().toLowerCase()
    ? siteName
    : `${page} — ${siteName}`
}

export function organizationJsonLd(settings: Settings, lang: Locale): object {
  const name = pickLocalized(settings.siteName, lang).text || SITE_NAME_EN
  const contact = settings.contact

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: `${site()}${lang === 'el' ? '/el' : ''}`,
    email: contact.email,
    telephone: contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.address.join(', '),
      addressCountry: 'CY',
    },
  }
}

export function articleJsonLd(post: NewsPost, lang: Locale): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pickLocalized(post.title, lang).text,
    datePublished: post.publishedAt,
    author: { '@type': 'Person', name: post.author },
  }
}

export function visualArtworkJsonLd(project: Project, lang: Locale): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: pickLocalized(project.title, lang).text,
    abstract: pickLocalized(project.summary, lang).text,
    dateCreated: String(project.year),
  }
}

export function site(): string {
  const url = process.env.PUBLIC_SITE_URL ?? 'https://cyprintmakers.densetheory.cc'
  return url.replace(/\/$/, '')
}

export function robotsTxt(staging: boolean): string {
  if (staging) {
    return 'User-agent: *\nDisallow: /\n'
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${site()}/sitemap-index.xml\n`
}
