import { describe, expect, it } from 'vitest'
import { LOCALES, isLocale, localePath } from '../../src/lib/i18n/locales'
import { pickLocalized, type IntlValue } from '../../src/lib/i18n/localized'
import { formatDate } from '../../src/lib/i18n/format'
import { t } from '../../src/lib/i18n/ui'

describe('localePath', () => {
  it('matches the brief cases', () => {
    expect(localePath('/', 'el')).toBe('/el')
    expect(localePath('/members', 'el')).toBe('/el/members')
    expect(localePath('/members', 'en')).toBe('/members')
    expect(localePath('/el/members', 'en')).toBe('/members')
  })

  it('never doubles or trails the locale prefix', () => {
    expect(localePath('/', 'en')).toBe('/')
    expect(localePath('/el', 'en')).toBe('/')
    expect(localePath('/el', 'el')).toBe('/el')
    expect(localePath('/el/', 'en')).toBe('/')
    expect(localePath('/el/', 'el')).toBe('/el')
    expect(localePath('/el/members', 'el')).toBe('/el/members')
    expect(localePath('/elements', 'en')).toBe('/elements')
  })
})

describe('pickLocalized', () => {
  it('matches the brief cases', () => {
    expect(pickLocalized([{ _key: 'a', language: 'en', value: 'Hello' }], 'el'))
      .toEqual({ text: 'Hello', isFallback: true })
    expect(pickLocalized([{ _key: 'a', language: 'el', value: 'Γεια' }], 'el'))
      .toEqual({ text: 'Γεια', isFallback: false })
    expect(pickLocalized([{ _key: 'a', language: 'el', value: '   ' }], 'el'))
      .toEqual({ text: '', isFallback: true })
    expect(pickLocalized(undefined, 'en')).toEqual({ text: '', isFallback: true })
  })

  it('trims values and falls back rather than returning Greek whitespace', () => {
    const values: IntlValue[] = [
      { _key: 'a', language: 'el', value: '  Γεια  ' },
      { _key: 'b', language: 'en', value: ' Hello ' },
    ]

    expect(pickLocalized(values, 'el')).toEqual({ text: 'Γεια', isFallback: false })
    expect(pickLocalized(values, 'en')).toEqual({ text: 'Hello', isFallback: false })
    expect(pickLocalized([
      { _key: 'a', language: 'el', value: '  ' },
      { _key: 'b', language: 'en', value: 'Hello' },
    ], 'el')).toEqual({ text: 'Hello', isFallback: true })
    expect(pickLocalized([{ _key: 'a', language: 'el', value: '  ' }], 'el'))
      .toEqual({ text: '', isFallback: true })
  })
})

describe('formatDate', () => {
  it('matches the brief cases', () => {
    expect(formatDate('2019-05-03', 'el')).toContain('Μαΐου')
    expect(formatDate('2019-05-03', 'en')).toBe('3 May 2019')
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatDate('not-a-date', 'en')).toBe('')
  })
})

describe('t', () => {
  it('matches the brief cases', () => {
    expect(t('nav.members', 'en')).toBe('MEMBERS')
    expect(t('nav.members', 'el')).toBe('ΜΕΛΗ')
  })
})

describe('locales', () => {
  it('exposes both locales and a guard', () => {
    expect(LOCALES).toEqual(['en', 'el'])
    expect(isLocale('en')).toBe(true)
    expect(isLocale('el')).toBe(true)
    expect(isLocale('fr')).toBe(false)
  })
})
