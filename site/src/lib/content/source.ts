import { loadFixtures } from './fixtures'
import { assertRequiredFields, computeTranslations } from './translation'
import type {
  AboutPage,
  CommitteeMember,
  ContactPage,
  Content,
  ContentKind,
  HomePage,
  Member,
  MembershipPage,
  NewsPost,
  Project,
  RawContent,
  SiteSettings,
  Translations,
} from './types'

export { loadFixtures }

export type ContentReader = () => Promise<RawContent>

export type ContentSource = 'fixtures' | 'sanity'

let sanityReader: ContentReader | undefined

/**
 * The Sanity-backed reader is injected through this seam so fixture builds
 * never load a Sanity client and need no environment at all.
 */
export function setSanityReader(reader: ContentReader | undefined): void {
  sanityReader = reader
}

const SANITY_API_VERSION = '2025-10-15'

const IMAGE_PROJECTION =
  '{ ..., "dimensions": asset->metadata.dimensions { width, height } }'

// Body-level images are siblings of blocks (`of: [{block}, {image}]`), so the
// dimensions projection must sit at the array-item level, not inside children.
const PORTABLE_TEXT_PROJECTION =
  '[]{ ..., _type == "image" => { "dimensions": asset->metadata.dimensions { width, height } } }'

const SEO_PROJECTION = '{ ..., "image": image' + IMAGE_PROJECTION + ' }'

/**
 * One round trip for the whole site. Internationalized arrays are projected
 * raw as [{_key, language, value}] so they pass through the same normaliser
 * as the fixtures.
 */
const CONTENT_QUERY = `{
  "settings": *[_type == "siteSettings"][0]{
    ...,
    "slug": slug.current,
    "defaultSeo": defaultSeo ${SEO_PROJECTION}
  },
  "home": *[_type == "homePage"][0]{
    ...,
    "slug": slug.current,
    "coverImage": coverImage ${IMAGE_PROJECTION},
    "seo": seo ${SEO_PROJECTION}
  },
  "about": *[_type == "aboutPage"][0]{
    ...,
    "slug": slug.current,
    "body": body ${PORTABLE_TEXT_PROJECTION},
    "history": history ${PORTABLE_TEXT_PROJECTION},
    "partners": partners[]{ ..., "logo": logo ${IMAGE_PROJECTION} },
    "seo": seo ${SEO_PROJECTION}
  },
  "contact": *[_type == "contactPage"][0]{
    ...,
    "slug": slug.current,
    "seo": seo ${SEO_PROJECTION}
  },
  "membership": *[_type == "membershipPage"][0]{
    ...,
    "slug": slug.current,
    "tiers": tiers[]{ ..., "benefits": benefits ${PORTABLE_TEXT_PROJECTION} },
    "processSteps": processSteps[]{ ..., "body": body ${PORTABLE_TEXT_PROJECTION} },
    "seo": seo ${SEO_PROJECTION}
  },
  "members": *[_type == "member"] | order(order asc){
    ...,
    "slug": slug.current,
    "bio": bio ${PORTABLE_TEXT_PROJECTION},
    "portrait": portrait ${IMAGE_PROJECTION}
  },
  "committee": *[_type == "committeeMember"] | order(order asc){
    ...,
    "slug": slug.current,
    "bio": bio ${PORTABLE_TEXT_PROJECTION},
    "image": image ${IMAGE_PROJECTION}
  },
  "projects": *[_type == "project"] | order(year desc){
    ...,
    "slug": slug.current,
    "body": body ${PORTABLE_TEXT_PROJECTION},
    "coverImage": coverImage ${IMAGE_PROJECTION},
    "gallery": gallery[] ${IMAGE_PROJECTION}
  },
  "news": *[_type == "newsPost"] | order(publishedAt desc){
    ...,
    "slug": slug.current,
    "body": body ${PORTABLE_TEXT_PROJECTION},
    "coverImage": coverImage ${IMAGE_PROJECTION}
  }
}`

const SINGLETON_KEYS = [
  'settings',
  'home',
  'about',
  'contact',
  'membership',
] as const

/**
 * Build the content reader for the Sanity dataset. The client is imported
 * lazily so fixture paths never load it; a read token disables the CDN so
 * draft-visible datasets stay current.
 */
async function createSanityClient(env: Record<string, string | undefined>) {
  const projectId = env.SANITY_PROJECT_ID?.trim()

  if (!projectId) {
    throw new Error('SANITY_PROJECT_ID is required for the Sanity content source')
  }

  const { createClient } = await import('@sanity/client')
  const token = env.SANITY_API_READ_TOKEN?.trim() || undefined
  return createClient({
    projectId,
    dataset: env.SANITY_DATASET?.trim() || 'production',
    apiVersion: SANITY_API_VERSION,
    token,
    useCdn: !token,
    // Builds read published content only, even when a token can see drafts.
    perspective: 'published',
  })
}

export function createSanityReader(
  env: Record<string, string | undefined> = process.env,
): ContentReader {
  return async () => {
    const client = await createSanityClient(env)
    const result = await client.fetch<RawContent>(CONTENT_QUERY)

    for (const key of SINGLETON_KEYS) {
      if (!result[key]) {
        throw new Error(`Sanity dataset is missing the ${key} singleton document`)
      }
    }

    return result
  }
}

setSanityReader(createSanityReader())

export async function loadSanity(): Promise<RawContent> {
  if (!sanityReader) {
    throw new Error(
      'Sanity content source selected but the reader failed to register; check that @sanity/client is installed and SANITY_PROJECT_ID is valid',
    )
  }

  return sanityReader()
}

export function resolveContentSource(
  env: Record<string, string | undefined> = process.env,
): ContentSource {
  const requested = env.CONTENT_SOURCE?.trim().toLowerCase()

  if (requested !== undefined && requested !== '') {
    if (requested === 'fixtures' || requested === 'sanity') return requested
    throw new Error(`Unknown CONTENT_SOURCE "${env.CONTENT_SOURCE}"`)
  }

  return env.SANITY_PROJECT_ID?.trim() ? 'sanity' : 'fixtures'
}

/**
 * The home ink switch is read at request time so publishing it does not wait
 * for the next prerendered rebuild. A missing value means on.
 */
export async function getInkEffect(
  env: Record<string, string | undefined> = process.env,
): Promise<boolean> {
  if (resolveContentSource(env) === 'fixtures') {
    const raw = await loadFixtures()
    return raw.settings.inkEffect !== false
  }

  const client = await createSanityClient(env)
  const value = await client.fetch<boolean | null>(
    '*[_type == "siteSettings"][0].inkEffect',
  )
  return value !== false
}

function prepare<T extends object>(
  doc: T,
  kind: ContentKind,
): T & { translations: Translations } {
  assertRequiredFields(doc, kind, 'en')
  return { ...doc, translations: computeTranslations(doc, kind) }
}

function prepareMany<T extends object>(
  docs: T[],
  kind: ContentKind,
): (T & { translations: Translations })[] {
  return docs.map(doc => prepare(doc, kind))
}

/**
 * Build a loader from any raw content reader. The fixture path and the Sanity
 * path produce the same `Content` shape, with translation flags and ordering
 * applied once here.
 */
export function createContentLoader(
  read: ContentReader,
): () => Promise<Content> {
  return async () => {
    const raw = await read()

    return {
      settings: prepare(raw.settings, 'siteSettings') as SiteSettings,
      home: prepare(raw.home, 'homePage') as HomePage,
      about: prepare(raw.about, 'aboutPage') as AboutPage,
      contact: prepare(raw.contact, 'contactPage') as ContactPage,
      membership: prepare(raw.membership, 'membershipPage') as MembershipPage,
      members: prepareMany(raw.members, 'member')
        .sort((a, b) => a.order - b.order) as Member[],
      committee: prepareMany(raw.committee, 'committeeMember')
        .sort((a, b) => a.order - b.order) as CommitteeMember[],
      projects: prepareMany(raw.projects, 'project')
        .sort((a, b) => b.year - a.year) as Project[],
      news: prepareMany(raw.news, 'newsPost')
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) as NewsPost[],
    }
  }
}

/**
 * Resolve the source once per call, then load it. `CONTENT_SOURCE` always
 * wins; otherwise a project id selects Sanity and no project id selects the
 * checked-in fixtures.
 */
export function getContent(): Promise<Content> {
  const source = resolveContentSource()

  if (source === 'sanity') {
    return createContentLoader(loadSanity)()
  }

  return createContentLoader(loadFixtures)()
}

