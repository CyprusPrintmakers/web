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
  SupportPage,
  Translations,
} from './types'

export { loadFixtures }

export type ContentReader = () => Promise<RawContent>

export type ContentSource = 'fixtures' | 'sanity'

let sanityReader: ContentReader | undefined

/**
 * Task 5 registers the Sanity-backed reader here. Keeping it behind a setter
 * means this task never imports a Sanity client and fixture builds need no
 * environment at all.
 */
export function setSanityReader(reader: ContentReader | undefined): void {
  sanityReader = reader
}

export async function loadSanity(): Promise<RawContent> {
  if (!sanityReader) {
    throw new Error(
      'Sanity content source selected but no reader has been registered; call setSanityReader() from the Sanity integration',
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
      support: prepare(raw.support, 'supportPage') as SupportPage,
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

