import type { APIRoute } from 'astro'
import { isPreviewEnabled, previewEnv, slugToType, loadDraft, extractText } from '../../lib/content/preview'

export const prerender = false

const noStore: Record<string, string> = { 'cache-control': 'no-store', 'content-type': 'text/html; charset=utf-8' }

export const GET: APIRoute = async ({ params, request }) => {
  const env = previewEnv(import.meta.env)

  if (!isPreviewEnabled(env)) {
    return new Response(
      '<!doctype html><html lang="en"><body><p>Draft preview is not enabled on this deployment.</p></body></html>',
      { status: 503, headers: noStore },
    )
  }

  const slug = params.slug ?? ''
  const match = slugToType(slug)
  if (!match) {
    return new Response(
      '<!doctype html><html lang="en"><body><p>Unknown preview path.</p></body></html>',
      { status: 404, headers: noStore },
    )
  }

  const origin = new URL(request.url).origin
  const doc = await loadDraft(env.SANITY_API_READ_TOKEN ?? '', match.type, match.slug, env.SANITY_DATASET)
  if (!doc) {
    return new Response(
      '<!doctype html><html lang="en"><body><p>No draft found for this slug.</p></body></html>',
      { status: 404, headers: noStore },
    )
  }

  const title = extractText(doc.title) ?? 'Draft'
  const body = extractText(doc.body) ?? ''
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Preview: ${title}</title></head>
<body>
<main>
  <p><a href="${origin}/admin">Open the Studio</a></p>
  <h1>${title}</h1>
  <div>${body}</div>
</main>
</body>
</html>`

  return new Response(html, { status: 200, headers: noStore })
}
