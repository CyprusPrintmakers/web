export type ImageDoc = {
  _type?: 'image' | 'altImage'
  asset?: {
    _ref?: string
    _type?: string
  }
  alt?: string
  dimensions?: {
    width?: number
    height?: number
  }
  crop?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
  hotspot?: {
    x?: number
    y?: number
  }
}

export type ImageAttrs = {
  src?: string
  alt: string
  width: number
  height: number
}

export type ImageAttrsOptions = {
  urlFor: (image: ImageDoc) => string
  fallback?: { width: number; height: number }
}

const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 800

function positive(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && value > 0 ? value : fallback
}

function cropped(value: number, start = 0, end = 0): number {
  const remaining = 1 - start - end
  return Math.max(1, Math.round(value * Math.max(remaining, 0)))
}

/**
 * Turn an image document into the attributes `Figure.astro` needs.
 *
 * Dimensions are reserved from the intrinsic size so a missing asset never
 * collapses the layout; `src` stays undefined so `Figure` renders its rule
 * placeholder instead of a broken image. Crop is applied multiplicatively,
 * matching Sanity's crop semantics.
 */
export function imageAttrs(
  image: ImageDoc | undefined,
  { urlFor, fallback }: ImageAttrsOptions,
): ImageAttrs {
  const fallbackWidth = fallback?.width ?? DEFAULT_WIDTH
  const fallbackHeight = fallback?.height ?? DEFAULT_HEIGHT

  const width = cropped(
    positive(image?.dimensions?.width, fallbackWidth),
    image?.crop?.left,
    image?.crop?.right,
  )
  const height = cropped(
    positive(image?.dimensions?.height, fallbackHeight),
    image?.crop?.top,
    image?.crop?.bottom,
  )

  const hasAsset = typeof image?.asset?._ref === 'string' && image.asset._ref !== ''
  const url = image && hasAsset ? urlFor(image) : ''

  return {
    src: url !== '' ? url : undefined,
    alt: image?.alt ?? '',
    width,
    height,
  }
}
