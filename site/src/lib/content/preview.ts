export type PreviewEnv = {
  PUBLIC_SANITY_VISUAL_EDITING_ENABLED?: string
  SANITY_API_READ_TOKEN?: string
  [key: string]: string | undefined
}

/**
 * Draft preview is a deliberate, dual-keyed opt-in: the public flag turns the
 * surface on and the read token makes drafts actually reachable. Either one
 * alone leaves it off, so a misconfigured deployment fails closed.
 */
export function isPreviewEnabled(env: PreviewEnv): boolean {
  return (
    env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === 'true' &&
    typeof env.SANITY_API_READ_TOKEN === 'string' &&
    env.SANITY_API_READ_TOKEN !== ''
  )
}

/** Merges Astro's public env with the Node process env for the preview gate. */
export function previewEnv(
  publicEnv: Record<string, unknown>,
  processEnv: NodeJS.ProcessEnv = process.env,
): PreviewEnv {
  const merged: PreviewEnv = {}
  for (const [key, value] of Object.entries(processEnv)) {
    if (typeof value === 'string') merged[key] = value
  }
  for (const [key, value] of Object.entries(publicEnv)) {
    if (typeof value === 'string') merged[key] = value
  }
  return merged
}

export type PreviewDocType = 'homePage' | 'aboutPage' | 'member' | 'project' | 'newsPost'

/** Maps a preview path to the document type it would render. */
export function slugToType(path: string): { type: PreviewDocType; slug: string } | null {
  if (path === '' || path === 'home' || path === '/') return { type: 'homePage', slug: 'home' }
  if (path === 'about') return { type: 'aboutPage', slug: 'about' }
  const [prefix, slug] = path.split('/')
  if (prefix === 'members' && slug) return { type: 'member', slug }
  if (prefix === 'projects' && slug) return { type: 'project', slug }
  if (prefix === 'news' && slug) return { type: 'newsPost', slug }
  return null
}

type DraftDoc = {
  title?: unknown
  body?: unknown
}

/**
 * Loads the draft version of a document, falling back to the published one so
 * a preview link never dies the moment a document is published. Uses
 * @sanity/client directly — this route is the only consumer of the read token
 * and it must never be exercised by a public build.
 */
export async function loadDraft(
  token: string,
  type: PreviewDocType,
  slug: string,
  dataset = 'production',
): Promise<DraftDoc | null> {
  const { createClient } = await import('@sanity/client')
  const projectId = process.env.SANITY_PROJECT_ID
  if (!projectId) return null

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-10-01',
    token,
    perspective: 'drafts',
    useCdn: false,
  })

  const query = `*[_type == $type && slug.current == $slug][0]{ title, body }`
  return (await client.fetch(query, { type, slug })) ?? null
}

/** Pulls readable text out of an internationalized field or Portable Text body. */
export function extractText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const parts = value
      .map(entry => {
        if (entry && typeof entry === 'object') {
          const record = entry as { language?: unknown; value?: unknown; children?: unknown }
          if (typeof record.value === 'string') return record.value
          if (Array.isArray(record.children)) {
            return record.children
              .map(child =>
                child && typeof child === 'object' && typeof (child as { text?: unknown }).text === 'string'
                  ? (child as { text: string }).text
                  : '',
              )
              .join('')
          }
        }
        return ''
      })
      .filter(part => part !== '')
    return parts.join(' ')
  }
  return ''
}
