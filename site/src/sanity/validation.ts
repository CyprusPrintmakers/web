import type { Rule } from 'sanity'

export type IntlEntry = { language?: unknown; value?: unknown }

export function isNonEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== ''
  return Array.isArray(value) && value.length > 0
}

/** True when the array has an English entry with real content. */
export function hasEnglishValue(values: unknown): boolean {
  if (!Array.isArray(values)) return false

  const english = values.find(
    entry => typeof entry === 'object' && entry !== null && (entry as IntlEntry).language === 'en',
  )

  return isNonEmpty((english as IntlEntry | undefined)?.value)
}

/**
 * `Rule.required()` on an internationalized array only checks that the array
 * exists, so a language entry with no value can still be published. This
 * validation makes “required” mean an English value that is actually filled.
 */
export function requiredEnglish(message: string) {
  return (rule: Rule) =>
    rule.custom((values: unknown) => (hasEnglishValue(values) ? true : message))
}
