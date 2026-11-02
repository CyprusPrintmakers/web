import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { SIGNATURE_HEADER, verifySanitySignature } from '../../src/lib/webhook'

const secret = 'test-secret'
const payload = JSON.stringify({ _id: 'news-1', _type: 'newsPost' })
const timestamp = Date.now()

function sign(body: string, at = timestamp, key = secret): string {
  const signature = createHmac('sha256', key)
    .update(`${at}.${body}`)
    .digest('base64url')
  return `t=${at},v1=${signature}`
}

describe('verifySanitySignature', () => {
  it('accepts a signature produced by Sanity', () => {
    expect(verifySanitySignature(payload, sign(payload), secret)).toBe(true)
  })

  it('rejects a tampered payload', () => {
    const header = sign(payload)
    expect(verifySanitySignature(`${payload} `, header, secret)).toBe(false)
  })

  it('rejects the wrong secret', () => {
    expect(verifySanitySignature(payload, sign(payload, timestamp, 'other'), secret)).toBe(false)
  })

  it('rejects missing or malformed headers', () => {
    expect(verifySanitySignature(payload, null, secret)).toBe(false)
    expect(verifySanitySignature(payload, '', secret)).toBe(false)
    expect(verifySanitySignature(payload, 'v1=abc', secret)).toBe(false)
    expect(verifySanitySignature(payload, 't=abc,v1=def', secret)).toBe(false)
  })

  it('exposes the header name Sanity sends', () => {
    expect(SIGNATURE_HEADER).toBe('sanity-webhook-signature')
  })
})