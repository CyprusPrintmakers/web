import type { Locale } from './locales'

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}

const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-GB', DATE_OPTIONS),
  el: new Intl.DateTimeFormat('el-CY', DATE_OPTIONS),
}

/**
 * Format an ISO date for display, or return an empty string if the input is
 * not a valid date. UTC keeps date-only CMS values on the day they name
 * regardless of the visitor's timezone.
 */
export function formatDate(iso: string, lang: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return dateFormatters[lang].format(date)
}
