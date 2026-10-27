import { describe, expect, it } from 'vitest'
import { isPreviewEnabled } from '../../src/lib/content/preview'

describe('isPreviewEnabled', () => {
  it('is off by default', () => {
    expect(isPreviewEnabled({})).toBe(false)
    expect(isPreviewEnabled({ PUBLIC_SANITY_VISUAL_EDITING_ENABLED: 'false' })).toBe(false)
  })

  it('needs both the flag and a read token', () => {
    expect(
      isPreviewEnabled({
        PUBLIC_SANITY_VISUAL_EDITING_ENABLED: 'true',
        SANITY_API_READ_TOKEN: 'sk',
      }),
    ).toBe(true)
    expect(isPreviewEnabled({ PUBLIC_SANITY_VISUAL_EDITING_ENABLED: 'true' })).toBe(false)
    expect(isPreviewEnabled({ SANITY_API_READ_TOKEN: 'sk' })).toBe(false)
  })
})
