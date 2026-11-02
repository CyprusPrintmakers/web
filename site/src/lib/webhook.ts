import { createHmac, timingSafeEqual } from 'node:crypto'

export const SIGNATURE_HEADER = 'sanity-webhook-signature'

const SIGNATURE_PATTERN = /^t=(\d+)[, ]+v1=([^, ]+)$/

/**
 * Verifies a Sanity GROQ webhook signature.
 *
 * Sanity signs `<timestamp>.<raw body>` with HMAC-SHA256 and sends
 * `t=<unix ms>,v1=<base64url signature>` in the `sanity-webhook-signature`
 * header. The raw request body must be used, never a re-encoded JSON string.
 */
export function verifySanitySignature(
  payload: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header || !secret) return false

  const match = header.trim().match(SIGNATURE_PATTERN)
  if (!match) return false

  const [, timestamp, provided] = match
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('base64url')

  const expectedBytes = Buffer.from(expected)
  const providedBytes = Buffer.from(provided)

  return (
    expectedBytes.length === providedBytes.length &&
    timingSafeEqual(expectedBytes, providedBytes)
  )
}