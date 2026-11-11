import type { APIRoute } from 'astro'
import { getInkEffect } from '../../lib/content/source'

export const prerender = false

export const GET: APIRoute = async () => {
  const enabled = await getInkEffect()
  return new Response(JSON.stringify({ enabled }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  })
}
