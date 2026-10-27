export type Locale = 'en' | 'el'

export const LOCALES: Locale[] = ['en', 'el']

const GREEK_PREFIX = '/el'

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'el'
}

/**
 * Remove a leading Greek locale segment without touching paths such as
 * `/elements`, where `el` is the start of a normal path segment.
 */
function stripGreekPrefix(path: string): string {
  if (path === GREEK_PREFIX) return '/'
  if (path.startsWith(`${GREEK_PREFIX}/`)) return path.slice(GREEK_PREFIX.length)
  return path
}

/**
 * Build the equivalent path in the requested locale.
 *
 * English is unprefixed, Greek is prefixed with `/el`. The home path is
 * always `/` or `/el`, never `/el/` and never doubled.
 */
export function localePath(path: string, lang: Locale): string {
  const input = path === '' ? '/' : path
  const withLeadingSlash = input.startsWith('/') ? input : `/${input}`
  const stripped = stripGreekPrefix(withLeadingSlash)

  if (lang === 'en') return stripped
  return stripped === '/' ? GREEK_PREFIX : `${GREEK_PREFIX}${stripped}`
}

/**
 * Static paths for a `[lang]` page without a slug.
 *
 * English is prerendered by the root route, so only the non-default locales
 * come back here — never `en`.
 */
export function getLocaleParams(): { params: { lang: Locale } }[] {
  return LOCALES.filter(locale => locale !== 'en').map(lang => ({ params: { lang } }))
}

/**
 * Static paths for a `[lang]/[slug]` page, one Greek route per slug.
 *
 * Collection routes pass exactly the slugs that exist in English, so a Greek
 * detail page exists for exactly those documents.
 */
export function getLocaleSlugParams(
  slugs: string[],
): { params: { lang: Locale; slug: string } }[] {
  return getLocaleParams().flatMap(({ params }) =>
    slugs
      .filter(slug => slug.trim() !== '')
      .map(slug => ({ params: { lang: params.lang, slug } })),
  )
}
