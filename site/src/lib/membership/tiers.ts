export type Tier = {
  name: import('../content/types').IntlValue[]
  benefits?: import('../content/types').IntlRich[]
  price?: string
  levels?: { name: string; price?: string }[]
}

/**
 * Prices exist in the CMS before the committee confirms them, so nothing
 * renders until `tiersConfirmed` is true — a screenshot can never become a
 * published fee.
 */
export function visiblePrice(tier: { price?: string }, confirmed: boolean): string | null {
  if (!confirmed) return null

  const price = tier.price?.trim()
  return price ? price : null
}
