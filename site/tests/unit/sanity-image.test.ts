import { afterEach, describe, expect, it } from 'vitest'
import type { ImageDoc } from '../../src/lib/media'
import { sanityImageUrl } from '../../src/lib/sanity/image'

const realImage: ImageDoc = {
  _type: 'altImage',
  asset: { _ref: 'image-d139b2649247db52b8c280217a945e59c1ec3da3-581x800-png' },
  alt: 'A print',
}

const fixtureImage: ImageDoc = {
  _type: 'image',
  asset: { _ref: 'image-georgiou-portrait-1200x1500-jpg' },
  alt: 'Portrait',
}

const originalProjectId = process.env.SANITY_PROJECT_ID
const originalDataset = process.env.SANITY_DATASET

afterEach(() => {
  if (originalProjectId === undefined) delete process.env.SANITY_PROJECT_ID
  else process.env.SANITY_PROJECT_ID = originalProjectId

  if (originalDataset === undefined) delete process.env.SANITY_DATASET
  else process.env.SANITY_DATASET = originalDataset
})

describe('sanityImageUrl', () => {
  it('builds a CDN URL for an uploaded Sanity asset', () => {
    process.env.SANITY_PROJECT_ID = 'hyel0os7'
    process.env.SANITY_DATASET = 'production'

    expect(sanityImageUrl(realImage)).toMatch(
      /^https:\/\/cdn\.sanity\.io\/images\/hyel0os7\/production\/d139b264/,
    )
  })

  it('returns an empty string for fixture placeholder refs', () => {
    process.env.SANITY_PROJECT_ID = 'hyel0os7'
    expect(sanityImageUrl(fixtureImage)).toBe('')
  })

  it('returns an empty string when no project id is configured', () => {
    delete process.env.SANITY_PROJECT_ID
    expect(sanityImageUrl(realImage)).toBe('')
  })
})
