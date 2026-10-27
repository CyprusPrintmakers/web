import type { APIContext } from 'astro'
import { rssFeed } from '../rss.xml'
import type { Locale } from '../../lib/i18n/locales'

export async function GET(context: APIContext) {
  return rssFeed(context, 'el' satisfies Locale)
}
