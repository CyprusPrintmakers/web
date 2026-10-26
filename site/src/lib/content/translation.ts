import type { Locale } from '../i18n/locales'
import type { ContentKind, IntlRich, IntlValue, Translations } from './types'

const REQUIRED_FIELDS: Record<ContentKind, readonly string[]> = {
  siteSettings: ['siteName'],
  homePage: ['title', 'currentLabel', 'currentTitle'],
  aboutPage: ['headline', 'body', 'history'],
  contactPage: ['openingNote', 'officeHours'],
  membershipPage: ['intro', 'formIntro', 'privacyNote'],
  supportPage: ['intro', 'notes'],
  member: ['name', 'discipline', 'bio'],
  committeeMember: ['name', 'role'],
  project: ['title', 'summary', 'body', 'venue'],
  newsPost: ['title', 'excerpt', 'body'],
}

type Localized = IntlValue[] | IntlRich[] | undefined

function hasLocalized(values: unknown, lang: Locale): boolean {
  if (!Array.isArray(values)) return false

  return values.some(entry => {
    if (entry === null || typeof entry !== 'object') return false
    const { language, value } = entry as { language?: unknown; value?: unknown }
    if (language !== lang) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (Array.isArray(value)) return value.length > 0
    return false
  })
}

function requiredValues(
  doc: Record<string, unknown>,
  kind: ContentKind,
): { field: string; values: unknown }[] {
  const fields = REQUIRED_FIELDS[kind].map(field => ({
    field,
    values: doc[field] as Localized,
  }))

  if (kind === 'membershipPage' || kind === 'supportPage') {
    const tiers = Array.isArray(doc.tiers) ? doc.tiers : []
    for (const tier of tiers) {
      if (tier === null || typeof tier !== 'object') continue
      fields.push({
        field: 'tiers[].name',
        values: (tier as { name?: Localized }).name,
      })
    }
  }

  return fields
}

/**
 * Fail the build on missing English prose, naming the document and field so
 * the editor can find it. Greek gaps are allowed: the page falls back to
 * English and is marked incomplete through `translations`/`isFullyTranslated`.
 */
export function assertRequiredFields(
  doc: object,
  kind: ContentKind,
  lang: Locale,
): void {
  const record = doc as Record<string, unknown>

  for (const { field, values } of requiredValues(record, kind)) {
    if (!hasLocalized(values, lang)) {
      throw new Error(
        `${kind} ${String(record._id)} missing required field ${field} for ${lang}`,
      )
    }
  }
}

export function computeTranslations(doc: object, kind: ContentKind): Translations {
  const record = doc as Record<string, unknown>

  return {
    en: requiredValues(record, kind).every(({ values }) => hasLocalized(values, 'en')),
    el: requiredValues(record, kind).every(({ values }) => hasLocalized(values, 'el')),
  }
}

export function isFullyTranslated(
  doc: object,
  kind: ContentKind,
  lang: Locale,
): boolean {
  const record = doc as Record<string, unknown>
  return requiredValues(record, kind).every(({ values }) => hasLocalized(values, lang))
}
