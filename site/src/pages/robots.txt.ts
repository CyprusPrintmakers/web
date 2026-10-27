import type { APIRoute } from 'astro'
import { robotsTxt } from '../lib/seo'

export const GET: APIRoute = () => {
  const staging = process.env.PUBLIC_STAGING === 'true' || import.meta.env.PUBLIC_STAGING === 'true'
  return new Response(robotsTxt(staging), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
