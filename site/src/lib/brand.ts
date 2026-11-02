import type { Locale } from './i18n/locales'

const WORDMARKS: Record<Locale, [string, string]> = {
  en: ['CYPRUS', 'PRINTMAKERS ASSOCIATION'],
  el: ['ΣΥΛΛΟΓΟΣ', 'ΧΑΡΑΚΤΩΝ ΚΥΠΡΟΥ'],
}

export function brandWordmark(lang: Locale): [string, string] {
  return WORDMARKS[lang]
}