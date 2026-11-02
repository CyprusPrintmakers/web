import { createImageUrlBuilder } from '@sanity/image-url'
import type { ImageDoc } from '../media'

// Sanity asset ids look like `image-<sha1>-<width>x<height>-<ext>`.
// Fixture placeholders (`image-georgiou-portrait-1200x1500-jpg`) must not be
// sent to the CDN, or fixture builds would render broken images.
const SANITY_ASSET = /^image-[a-f0-9]{32,}-\d+x\d+-[a-z0-9]+$/i

function envValue(key: string): string | undefined {
  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  return process.env[key]?.trim() || viteEnv?.[key]?.trim()
}

/**
 * Build a public CDN URL for an image stored in Sanity. Returns `''` when the
 * site is running from fixtures or no project is configured, which makes
 * `imageAttrs` render its reserved placeholder instead of a broken image.
 */
export function sanityImageUrl(image: ImageDoc): string {
  const projectId = envValue('SANITY_PROJECT_ID')
  const ref = image.asset?._ref

  if (!projectId || !ref || !SANITY_ASSET.test(ref)) return ''

  const dataset = envValue('SANITY_DATASET') || 'production'
  return createImageUrlBuilder({ projectId, dataset }).image(image).url()
}