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
