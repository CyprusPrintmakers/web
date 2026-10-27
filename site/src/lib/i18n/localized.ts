import type { Locale } from './locales'
import type { IntlRich, RichText } from '../content/types'

export type IntlValue = {
  _key: string
  language: Locale
  value: string
}

export type LocalizedValue = {
  text: string
  isFallback: boolean
}

function usableText(values: IntlValue[] | undefined, lang: Locale): string | undefined {
  const match = values?.find(entry => entry.language === lang && entry.value.trim() !== '')
  return match?.value.trim()
}

/** Rich-text twin of `pickLocalized`: requested language wins, English falls back. */
export function pickRich(values: IntlRich[] | undefined, lang: Locale): RichText {
  const usable = (entry: IntlRich) => entry.value.length > 0
  return (
    values?.find(entry => entry.language === lang && usable(entry))?.value ??
    values?.find(entry => entry.language === 'en' && usable(entry))?.value ??
    []
  )
}

/**
 * Pick a field's text for the requested locale.
 *
 * Values are trimmed and whitespace-only values are treated as missing. When
 * Greek is missing, English is used and `isFallback` tells the caller to wrap
 * the text in `lang="en"`. If neither language has usable text the result is
 * empty, never the whitespace that was supplied.
 */
export function pickLocalized(
  values: IntlValue[] | undefined,
  lang: Locale,
): LocalizedValue {
  const selected = usableText(values, lang)
  if (selected !== undefined) return { text: selected, isFallback: false }

  if (lang !== 'en') {
    const fallback = usableText(values, 'en')
    if (fallback !== undefined) return { text: fallback, isFallback: true }
  }

  return { text: '', isFallback: true }
}
