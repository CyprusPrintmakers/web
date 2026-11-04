import { describe, expect, it } from 'vitest'
import { hasEnglishValue, requiredEnglish } from '../../src/sanity/validation'

describe('requiredEnglish', () => {
  it('accepts an English value with content', () => {
    expect(hasEnglishValue([{ language: 'en', value: 'A real excerpt' }])).toBe(true)
  })

  it('rejects an English entry with no value', () => {
    expect(hasEnglishValue([{ language: 'en' }])).toBe(false)
  })

  it('rejects whitespace-only and other languages', () => {
    expect(hasEnglishValue([{ language: 'en', value: '   ' }])).toBe(false)
    expect(hasEnglishValue([{ language: 'el', value: 'Κείμενο' }])).toBe(false)
    expect(hasEnglishValue([])).toBe(false)
    expect(hasEnglishValue(undefined)).toBe(false)
  })

  it('returns the custom message through the rule', () => {
    const rule = {
      custom: (check: (values: unknown) => true | string) => check,
    }
    const check = requiredEnglish('Add an English excerpt')(rule as never) as unknown as (
      values: unknown,
    ) => true | string

    expect(check([{ language: 'en' }])).toBe('Add an English excerpt')
    expect(check([{ language: 'en', value: 'Excerpt' }])).toBe(true)
  })
})
