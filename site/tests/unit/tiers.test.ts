import { describe, expect, it } from 'vitest'
import { visiblePrice } from '../../src/lib/membership/tiers'

describe('visiblePrice', () => {
  it('hides prices until the tiers are confirmed', () => {
    expect(visiblePrice({ price: '€50' }, false)).toBeNull()
  })

  it('shows a confirmed non-empty price', () => {
    expect(visiblePrice({ price: '€50' }, true)).toBe('€50')
  })

  it('never shows an empty price', () => {
    expect(visiblePrice({ price: '' }, true)).toBeNull()
    expect(visiblePrice({ price: '   ' }, true)).toBeNull()
  })

  it('handles a missing price', () => {
    expect(visiblePrice({}, true)).toBeNull()
  })
})
