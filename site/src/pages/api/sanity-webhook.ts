import type { APIRoute } from 'astro'
import { SIGNATURE_HEADER, verifySanitySignature } from '../../lib/webhook'

export const prerender = false

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.SANITY_WEBHOOK_SECRET
  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!secret || !deployHook) {
    return json({ ok: false, error: 'webhook not configured' }, 503)
  }

  const payload = await request.text()
  if (!verifySanitySignature(payload, request.headers.get(SIGNATURE_HEADER), secret)) {
    return json({ ok: false, error: 'invalid signature' }, 401)
  }

  // Drafts are excluded by the Sanity filter, but ignore them here too so a
  // misconfigured hook can never rebuild the public site from unpublished data.
  try {
    const document = JSON.parse(payload) as { _id?: string }
    if (document._id?.startsWith('drafts.')) {
      return json({ ok: true, skipped: 'draft' }, 200)
    }
  } catch {
    return json({ ok: false, error: 'invalid payload' }, 400)
  }

  const response = await fetch(deployHook, { method: 'POST' })
  if (!response.ok) {
    return json({ ok: false, error: 'deploy hook failed' }, 502)
  }

  return json({ ok: true }, 200)
}