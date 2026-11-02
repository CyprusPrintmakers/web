import { describe, expect, it } from 'vitest'
import { brandWordmark } from '../../src/lib/brand'

describe('brandWordmark', () => {
  it('returns the English lockup', () => {
    expect(brandWordmark('en')).toEqual(['CYPRUS', 'PRINTMAKERS ASSOCIATION'])
  })

  it('returns the Greek lockup', () => {
    expect(brandWordmark('el')).toEqual(['ΣΥΛΛΟΓΟΣ', 'ΧΑΡΑΚΤΩΝ ΚΥΠΡΟΥ'])
  })
})