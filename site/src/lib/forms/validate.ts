import { t } from '../i18n/ui'
import type { Locale } from '../i18n/locales'
import { CV_MAX_BYTES, CV_TYPES, VELOCITY_MS, type FormWire } from './schema'

export type FormInput = FormWire

export type Result =
  | { ok: true }
  | { ok: false; silent: true; errors?: undefined }
  | { ok: false; silent: false; errors: Record<string, string> }

export function wantsJson(accept: string): boolean {
  return accept.includes('application/json') && !accept.includes('text/html')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isBot(input: FormInput, now: number): boolean {
  if ((input.honeypot?.trim() ?? '').length > 0) return true
  if ((input.website?.trim() ?? '').length > 0) return true

  // forms.js fills renderedAt on load; a no-JS submit leaves it empty and is
  // never rejected on timing.
  const raw = input.renderedAt
  if (raw === undefined || (typeof raw === 'string' && raw.trim() === '')) return false
  const rendered = Number(typeof raw === 'string' ? raw.trim() : raw)
  if (!Number.isFinite(rendered)) return false

  return now - rendered < VELOCITY_MS
}

function validateCv(cv: FormInput['cv'], lang: Locale): string | undefined {
  if (cv === undefined) return undefined

  if (cv.size > CV_MAX_BYTES) return t('form.errors.cvTooLarge', lang)
  if (cv.size === 0 || !(CV_TYPES as readonly string[]).includes(cv.type))
    return t('form.errors.cvUnsupported', lang)

  return undefined
}

function orderedMembershipErrors(
  input: FormInput,
  lang: Locale,
): Record<string, string> {
  const errors: Record<string, string> = {}
  const add = (key: string, message: string) => {
    if (errors[key] === undefined) errors[key] = message
  }

  const cvError = validateCv(input.cv, lang)
  if (cvError !== undefined) add('cv', cvError)

  if (input.name === undefined || input.name.trim() === '')
    add('name', t('form.errors.name', lang))
  if (input.email === undefined || !EMAIL_RE.test(input.email))
    add('email', t('form.errors.email', lang))
  if (input.message === undefined || input.message.trim() === '')
    add('message', t('form.errors.why', lang))
  if (input.cv === undefined) add('cv', t('form.errors.cvRequired', lang))
  if (input.consent !== true) add('consent', t('form.errors.consent', lang))

  return errors
}

function orderedContactErrors(input: FormInput, lang: Locale): Record<string, string> {
  const errors: Record<string, string> = {}
  const add = (key: string, message: string) => {
    if (errors[key] === undefined) errors[key] = message
  }

  if (input.name === undefined || input.name.trim() === '')
    add('name', t('form.errors.name', lang))
  if (input.email === undefined || !EMAIL_RE.test(input.email))
    add('email', t('form.errors.email', lang))
  if (input.message === undefined || input.message.trim() === '')
    add('message', t('form.errors.message', lang))

  return errors
}

export function validateMembership(
  input: FormInput,
  lang: Locale,
  now: number = Date.now(),
): Result {
  if (isBot(input, now)) return { ok: false, silent: true }

  const errors = orderedMembershipErrors(input, lang)
  return Object.keys(errors).length > 0 ? { ok: false, silent: false, errors } : { ok: true }
}

export function validateContact(
  input: FormInput,
  lang: Locale,
  now: number = Date.now(),
): Result {
  if (isBot(input, now)) return { ok: false, silent: true }

  const errors = orderedContactErrors(input, lang)
  return Object.keys(errors).length > 0 ? { ok: false, silent: false, errors } : { ok: true }
}
