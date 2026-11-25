import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const config = JSON.parse(
  readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
) as { redirects: Array<Record<string, unknown>> }

describe('vercel redirects', () => {
  it('sends retired member profiles back to the directory', () => {
    expect(config.redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/members/:slug',
          destination: '/members',
          permanent: true,
        }),
        expect.objectContaining({
          source: '/el/members/:slug',
          destination: '/el/members',
          permanent: true,
        }),
      ]),
    )
  })

  it('redirects the apex domain to www', () => {
    expect(config.redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/:path*',
          has: [{ type: 'host', value: 'cyprintmakers.com' }],
          destination: 'https://www.cyprintmakers.com/:path*',
          permanent: true,
        }),
      ]),
    )
  })
})
