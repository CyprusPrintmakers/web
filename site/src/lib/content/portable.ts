import {
  toHTML,
  escapeHTML,
  uriLooksSafe,
  type PortableTextComponents,
} from '@portabletext/to-html'
import type {
  ArbitraryTypedObject,
  PortableTextBlock,
} from '@portabletext/types'
import type { Locale } from '../i18n/locales'

export type PortableTextValue = PortableTextBlock | ArbitraryTypedObject

export type PortableTextImage = {
  alt?: string
  dimensions?: { width?: number; height?: number }
  [key: string]: unknown
}

export type PortableToHtmlOptions = {
  lang: Locale
  imageUrl?: (image: PortableTextImage) => string | undefined
}

const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 800

function imageSize(image: PortableTextImage): { width: number; height: number } {
  const width = image.dimensions?.width
  const height = image.dimensions?.height

  if (
    typeof width === 'number' &&
    width > 0 &&
    typeof height === 'number' &&
    height > 0
  ) {
    return { width, height }
  }

  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
}

/**
 * The placeholder box shared with `Figure.astro`: a 1 px rule around reserved
 * space, so a missing image never collapses into a broken box or a jump.
 */
export function figurePlaceholderStyle(width: number, height: number): string {
  return `width: 100%; aspect-ratio: ${width} / ${height}; border: var(--rule);`
}

function isExternalHref(href: string): boolean {
  return href.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(href)
}

/**
 * Render Portable Text to HTML. Images and links are serialised here rather
 * than in an Astro component because `@portabletext/to-html` returns strings.
 */
export function portableToHtml(
  blocks: PortableTextValue[] | undefined,
  options: PortableToHtmlOptions,
): string {
  if (!blocks || blocks.length === 0) return ''

  const { lang, imageUrl } = options
  void lang

  const renderImage = ({ value }: { value: unknown }) => {
    const image = value as PortableTextImage
    const { width, height } = imageSize(image)
    const src = imageUrl?.(image)
    const alt = typeof image.alt === 'string' ? image.alt : ''

    if (!src) {
      const hidden = alt === '' ? ' aria-hidden="true"' : ''
      return `<figure class="pt-image"${hidden}><div class="figure__placeholder" style="${figurePlaceholderStyle(width, height)}"></div></figure>`
    }

    return `<figure class="pt-image"><img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async" style="border: var(--rule);" /></figure>`
  }

  const components: PortableTextComponents = {
    marks: {
      link: ({ value, children }) => {
        const href = (value as { href?: unknown }).href
        if (typeof href !== 'string') return children ?? ''

        const safeHref = href.trim()
        if (safeHref === '' || !uriLooksSafe(safeHref)) return children ?? ''

        const rel = isExternalHref(safeHref) ? ' rel="noopener"' : ''
        return `<a href="${escapeHTML(safeHref)}"${rel}>${children ?? ''}</a>`
      },
    },
    types: {
      // `altImage` is the schema type; `image` keeps fixture/legacy bodies valid.
      image: renderImage,
      altImage: renderImage,
    },
  }

  return toHTML(blocks, { components })
}
