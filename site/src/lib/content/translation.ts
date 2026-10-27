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

function nestedLocalized(
  doc: Record<string, unknown>,
  kind: ContentKind,
): { field: string; values: unknown }[] {
  const fields: { field: string; values: unknown }[] = []

  if (kind === 'membershipPage' || kind === 'supportPage') {
    const tiers = Array.isArray(doc.tiers) ? doc.tiers : []
    tiers.forEach((tier, index) => {
      if (tier === null || typeof tier !== 'object') return
      const record = tier as { name?: Localized; benefits?: Localized }
      fields.push({ field: `tiers[${index}].name`, values: record.name })
      if (record.benefits !== undefined)
        fields.push({ field: `tiers[${index}].benefits`, values: record.benefits })
    })

    const steps = Array.isArray(doc.processSteps) ? doc.processSteps : []
    steps.forEach((step, index) => {
      if (step === null || typeof step !== 'object') return
      const record = step as { title?: Localized; body?: Localized }
      fields.push({ field: `process[${index}].title`, values: record.title })
      fields.push({ field: `process[${index}].body`, values: record.body })
    })
  }

  if (kind === 'committeeMember') {
    const bio = (doc as { bio?: Localized }).bio
    if (bio !== undefined) fields.push({ field: 'bio', values: bio })
  }

  return fields
}

function requiredValues(
  doc: Record<string, unknown>,
  kind: ContentKind,
): { field: string; values: unknown }[] {
  const fields = REQUIRED_FIELDS[kind].map(field => ({
    field,
    values: doc[field] as Localized,
  }))

  return fields.concat(nestedLocalized(doc, kind))
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
