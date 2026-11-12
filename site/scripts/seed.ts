import settings from '../src/lib/content/fixtures/settings.json' with { type: 'json' }
import home from '../src/lib/content/fixtures/home.json' with { type: 'json' }
import about from '../src/lib/content/fixtures/about.json' with { type: 'json' }
import contact from '../src/lib/content/fixtures/contact.json' with { type: 'json' }
import membership from '../src/lib/content/fixtures/membership.json' with { type: 'json' }
import people from '../src/lib/content/fixtures/members.json' with { type: 'json' }
import projects from '../src/lib/content/fixtures/projects.json' with { type: 'json' }
import news from '../src/lib/content/fixtures/news.json' with { type: 'json' }

type RawDoc = { _id: string; slug: string } & Record<string, unknown>

type SeedDocument = { _id: string; _type: string } & Record<string, unknown>

type SingletonSpec = { kind: string; doc: RawDoc }

type CollectionSpec = { kind: string; docs: RawDoc[] }

const INTL_STRING_TYPE = 'internationalizedArrayStringValue'
const INTL_PORTABLE_TEXT_TYPE = 'internationalizedArrayPortableTextValue'

const ARRAY_ITEM_TYPES: Record<string, string> = {
  address: 'string',
  participants: 'string',
  gallery: 'image',
  tiers: 'tier',
  levels: 'tierLevel',
  processSteps: 'processStep',
  partners: 'partner',
  socialLinks: 'socialLink',
  links: 'link',
}

const OBJECT_FIELD_TYPES: Record<string, string> = {
  contact: 'contactDetails',
  seo: 'seo',
  defaultSeo: 'seo',
  dates: 'dateRange',
}

const SINGLETON_SPECS: SingletonSpec[] = [
  { kind: 'siteSettings', doc: settings as unknown as RawDoc },
  { kind: 'homePage', doc: home as unknown as RawDoc },
  { kind: 'aboutPage', doc: about as unknown as RawDoc },
  { kind: 'contactPage', doc: contact as unknown as RawDoc },
  { kind: 'membershipPage', doc: membership as unknown as RawDoc },
]

const COLLECTION_SPECS: CollectionSpec[] = [
  { kind: 'member', docs: (people as { members: RawDoc[] }).members },
  { kind: 'committeeMember', docs: (people as { committee: RawDoc[] }).committee },
  { kind: 'project', docs: projects as unknown as RawDoc[] },
  { kind: 'newsPost', docs: news as unknown as RawDoc[] },
]

function isIntlEntry(
  value: object,
): value is { _key: string; language: string; value: unknown } {
  return '_key' in value && 'language' in value && 'value' in value
}

function convertRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([field, value]) => [field, convertField(field, value)]),
  )
}

function convertItem(itemType: string | undefined, item: unknown): unknown {
  if (item === null || typeof item !== 'object') return item

  const record = item as Record<string, unknown>

  if (isIntlEntry(record)) {
    const intlType = Array.isArray(record.value)
      ? INTL_PORTABLE_TEXT_TYPE
      : INTL_STRING_TYPE
    return { _type: intlType, ...record }
  }

  const converted = convertRecord(record)

  if (record._type === 'image') return { ...converted, _type: 'altImage' }

  return itemType !== undefined && record._type === undefined
    ? { _type: itemType, ...converted }
    : converted
}

function convertField(field: string, value: unknown): unknown {
  if (field === 'slug' && typeof value === 'string') {
    return { _type: 'slug', current: value }
  }

  if (Array.isArray(value)) {
    const itemType = ARRAY_ITEM_TYPES[field]
    return value.map(item => convertItem(itemType, item))
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const objectType = OBJECT_FIELD_TYPES[field]
    const converted = convertRecord(record)

    if (record._type === 'image') return { ...converted, _type: 'altImage' }

    return objectType !== undefined && record._type === undefined
      ? { _type: objectType, ...converted }
      : converted
  }

  return value
}

const DROP = Symbol('drop')

/**
 * Fixture images reference placeholder asset ids that do not exist in Sanity,
 * so writing them makes Sanity reject the whole document. Strip image objects
 * unless the caller has uploaded real assets first (SEED_INCLUDE_IMAGES=true).
 */
function dropImages(value: unknown): unknown | typeof DROP {
  if (Array.isArray(value)) {
    return value.map(item => dropImages(item)).filter(item => item !== DROP)
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record._type === 'image' || record._type === 'altImage') return DROP

    return Object.fromEntries(
      Object.entries(record)
        .map(([key, item]) => [key, dropImages(item)] as const)
        .filter(([, item]) => item !== DROP),
    )
  }

  return value
}

function toSanityDocument(kind: string, doc: RawDoc): SeedDocument {
  const { _id, slug, ...fields } = doc
  const converted = convertRecord(fields)
  const body = (
    process.env.SEED_INCLUDE_IMAGES === 'true' ? converted : dropImages(converted)
  ) as Record<string, unknown>

  return {
    _id,
    _type: kind,
    slug: { _type: 'slug', current: slug },
    ...body,
  }
}

export function buildSeedDocuments(): {
  singletons: SeedDocument[]
  collections: SeedDocument[]
} {
  return {
    singletons: SINGLETON_SPECS.map(({ kind, doc }) => toSanityDocument(kind, doc)),
    collections: COLLECTION_SPECS.flatMap(({ kind, docs }) =>
      docs.map(doc => toSanityDocument(kind, doc)),
    ),
  }
}

async function runDryRun(): Promise<void> {
  const { singletons, collections } = buildSeedDocuments()

  console.log(`Singletons (${singletons.length}):`)
  for (const doc of singletons) {
    console.log(`\n--- ${doc._id} ---`)
    console.log(JSON.stringify(doc, null, 2))
  }

  console.log(`\nCollections (${collections.length}):`)
  for (const doc of collections) {
    console.log(`\n--- ${doc._type} ${doc._id} ---`)
    console.log(JSON.stringify(doc, null, 2))
  }

  console.log(
    `\nDry run only: ${singletons.length} singletons and ${collections.length} collection documents would be written.`,
  )
}

function requireSeedEnv(): { projectId: string; dataset: string; token: string } {
  const projectId = process.env.SANITY_PROJECT_ID?.trim()
  const dataset = process.env.SANITY_DATASET?.trim() || 'production'
  const token = process.env.SANITY_API_READ_TOKEN?.trim()

  if (!projectId || !token) {
    throw new Error(
      'Seeding needs SANITY_PROJECT_ID and SANITY_API_READ_TOKEN (a write-capable token); --dry-run needs neither',
    )
  }

  return { projectId, dataset, token }
}

async function runSeed(): Promise<void> {
  const { projectId, dataset, token } = requireSeedEnv()
  const { createClient } = await import('@sanity/client')
  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2025-10-15',
    token,
    useCdn: false,
  })

  const { singletons, collections } = buildSeedDocuments()

  if (process.env.SEED_INCLUDE_IMAGES !== 'true') {
    console.log(
      'Skipping fixture image references (placeholders, not uploaded assets). Set SEED_INCLUDE_IMAGES=true once real assets exist.',
    )
  }

  for (const doc of singletons) {
    await client.createOrReplace(doc)
    console.log(`createOrReplace ${doc._id}`)
  }

  for (const doc of collections) {
    try {
      await client.create(doc)
      console.log(`create ${doc._type} ${doc._id}`)
    } catch (error) {
      if (error instanceof Error && /already exists/i.test(error.message)) {
        console.log(`skip ${doc._type} ${doc._id} (already exists)`)
        continue
      }
      throw error
    }
  }

  console.log(
    `\nSeeded ${singletons.length} singletons and ${collections.length} collection documents into ${projectId}/${dataset}`,
  )
}

const isDryRun = process.argv.slice(2).includes('--dry-run')

try {
  await (isDryRun ? runDryRun() : runSeed())
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
