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

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function parseDate(iso: string): Date | null {
  const dateOnly = DATE_ONLY.exec(iso)
  if (dateOnly) {
    const year = Number(dateOnly[1])
    const month = Number(dateOnly[2])
    const day = Number(dateOnly[3])
    if (!isRealDate(year, month, day)) return null
    return new Date(Date.UTC(year, month - 1, day))
  }

  const dateTime = DATE_TIME.exec(iso)
  if (dateTime) {
    const year = Number(dateTime[1])
    const month = Number(dateTime[2])
    const day = Number(dateTime[3])
    if (!isRealDate(year, month, day)) return null

    const zoned = /(Z|[+-]\d{2}:?\d{2})$/.test(iso)
    const date = new Date(zoned ? iso : `${iso}Z`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

/**
 * Format an ISO date for display, or return an empty string if the input is
 * not a valid date. UTC keeps date-only CMS values on the day they name
 * regardless of the visitor's timezone, and zoneless datetimes are treated as
 * UTC rather than local time so the output is deterministic.
 */
export function formatDate(iso: string, lang: Locale): string {
  const date = parseDate(iso)
  if (!date) return ''
  return dateFormatters[lang].format(date)
}
