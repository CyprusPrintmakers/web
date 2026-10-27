import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getContent } from '../lib/content/source'
import { localePath } from '../lib/i18n/locales'
import { pickLocalized } from '../lib/i18n/localized'
import { t } from '../lib/i18n/ui'
import type { Locale } from '../lib/i18n/locales'

export async function GET(context: APIContext) {
  return rssFeed(context, 'en')
}

export async function rssFeed(context: APIContext, lang: Locale) {
  const { news, settings } = await getContent()
  const newestFirst = [...news].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )

  return rss({
    title: pickLocalized(settings.siteName, lang).text,
    description: t('news.heading', lang),
    site: context.site!,
    items: newestFirst.map(post => ({
      title: pickLocalized(post.title, lang).text,
      description: pickLocalized(post.excerpt, lang).text,
      pubDate: new Date(post.publishedAt),
      link: localePath(`/news/${post.slug}`, lang),
    })),
  })
}
