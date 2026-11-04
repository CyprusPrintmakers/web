import type { PortableTextValue } from '../content/portable'

type TextBlock = { children?: Array<{ text?: string }> }

function blockText(block: PortableTextValue): string {
  const children = (block as TextBlock).children
  if (!Array.isArray(children)) return ''
  return children.map(child => (typeof child.text === 'string' ? child.text : '')).join(' ')
}

const normalise = (value: string): string => value.replace(/\s+/g, ' ').trim()

/**
 * The archive import set each project's summary to its first paragraph and
 * kept that paragraph in the body. The summary is truncated at 280
 * characters, so a first paragraph that starts with the summary is the same
 * text; drop it from the body so the page does not print it twice.
 */
export function bodyWithoutLead<T extends PortableTextValue>(
  body: T[],
  summary: string,
): T[] {
  const needle = normalise(summary)
  if (needle === '' || body.length === 0) return body

  const first = normalise(blockText(body[0]))
  if (first === needle || first.startsWith(needle)) return body.slice(1)

  return body
}
