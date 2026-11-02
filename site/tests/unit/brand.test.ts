import { describe, expect, it } from 'vitest'
import { brandWordmark, splitHeroTitle } from '../../src/lib/brand'

describe('brandWordmark', () => {
  it('returns the English lockup', () => {
    expect(brandWordmark('en')).toEqual(['CYPRUS', 'PRINTMAKERS ASSOCIATION'])
  })

  it('returns the Greek lockup', () => {
    expect(brandWordmark('el')).toEqual(['ΣΥΛΛΟΓΟΣ', 'ΧΑΡΑΚΤΩΝ ΚΥΠΡΟΥ'])
  })
})

it('splits the hero title into the lead and the rest', () => {
  expect(splitHeroTitle('CYPRUS PRINTMAKERS ASSOCIATION')).toEqual([
    'CYPRUS',
    'PRINTMAKERS ASSOCIATION',
  ])
  expect(splitHeroTitle('ΣΥΛΛΟΓΟΣ ΧΑΡΑΚΤΩΝ ΚΥΠΡΟΥ')).toEqual([
    'ΣΥΛΛΟΓΟΣ',
    'ΧΑΡΑΚΤΩΝ ΚΥΠΡΟΥ',
  ])
})