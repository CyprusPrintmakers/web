import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'
import { parseCommitteePage, parseYearProjects, type ArchiveProject } from './lib/archive'
import {
  buildCommitteeSeeds,
  buildMemberSeeds,
  buildProjectSeeds,
  SAMPLE_DOCUMENT_IDS,
  type ImportManifest,
  type SeedDocument,
} from './lib/content-import'
import { withWebhookPaused } from './lib/sanity-hooks'
import { loadMemberDrafts } from './lib/inputs'

const siteDir = fileURLToPath(new URL('..', import.meta.url))
const repoRoot = resolve(siteDir, '..')
const archiveDir = resolve(repoRoot, 'wix-archive')
const dryRun = process.argv.includes('--dry-run')

const manifest = JSON.parse(
  await readFile(resolve(archiveDir, 'rescrape/manifest.json'), 'utf8'),
) as ImportManifest

const projects: ArchiveProject[] = []
for (let year = 2009; year <= 2019; year += 1) {
  const html = await readFile(resolve(archiveDir, 'pages', `${year}.html`), 'utf8')
  projects.push(...parseYearProjects(html, year))
}

const members = loadMemberDrafts()
const committeeTranslations = parseCommitteePage(
  await readFile(resolve(archiveDir, 'pages', 'executive-committee.html'), 'utf8'),
)
const projectSeeds = buildProjectSeeds(projects, manifest)
const memberSeeds = buildMemberSeeds(members, manifest)
const committeeSeeds = buildCommitteeSeeds(members, manifest, committeeTranslations)

if (dryRun) {
  console.log(
    JSON.stringify(
      {
        projects: projectSeeds.length,
        members: memberSeeds.length,
        committee: committeeSeeds.length,
        projectTitles: projectSeeds.map(seed => ({
          year: seed.doc.year,
          title: (seed.doc.title as Array<{ value: string }>)[0]?.value,
          cover: seed.coverFile,
        })),
        memberPortraits: memberSeeds.filter(seed => seed.portraitFile).length,
        membersWithoutPortrait: memberSeeds.filter(seed => !seed.portraitFile).map(seed => seed.doc._id),
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

const projectId = process.env.SANITY_PROJECT_ID?.trim()
const dataset = process.env.SANITY_DATASET?.trim() || 'production'
const token = process.env.SANITY_API_READ_TOKEN?.trim()
if (!projectId || !token) {
  throw new Error('SANITY_PROJECT_ID and SANITY_API_READ_TOKEN (write-capable) are required')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-10-15',
  token,
  useCdn: false,
})

const imageCache = new Map<string, { _type: string; asset: { _type: string; _ref: string }; alt: string }>()

async function uploadImage(
  file: string,
  alt: string,
): Promise<{ _type: string; asset: { _type: string; _ref: string }; alt: string }> {
  const cached = imageCache.get(file)
  if (cached) return { ...cached, alt }

  const absolute = resolve(repoRoot, file)
  const asset = await client.assets.upload('image', await readFile(absolute), {
    filename: basename(file),
  })
  const image = {
    _type: 'altImage',
    asset: { _type: 'reference', _ref: asset._id },
    alt,
  }
  imageCache.set(file, image)
  console.log(`uploaded ${file}`)
  return image
}

async function existingImage(id: string, field: string) {
  const doc = await client.getDocument(id)
  const image = doc?.[field]
  if (image && typeof image === 'object') {
    const ref = (image as { asset?: { _ref?: string } }).asset?._ref
    if (ref) return image
  }
  return undefined
}

await withWebhookPaused(projectId, token, async () => {
  const documents: SeedDocument[] = []

  for (const seed of projectSeeds) {
    const image =
      (await existingImage(seed.doc._id, 'coverImage')) ??
      (seed.coverFile ? await uploadImage(seed.coverFile, seed.coverAlt) : undefined)
    documents.push({ ...seed.doc, ...(image ? { coverImage: image } : {}) })
  }

  for (const seed of memberSeeds) {
    const image =
      (await existingImage(seed.doc._id, 'portrait')) ??
      (seed.portraitFile
        ? await uploadImage(
            seed.portraitFile,
            (seed.doc.name as Array<{ value: string }>)[0]?.value ?? 'Member portrait',
          )
        : undefined)
    documents.push({ ...seed.doc, ...(image ? { portrait: image } : {}) })
  }

  for (const seed of committeeSeeds) {
    const image =
      (await existingImage(seed.doc._id, 'image')) ??
      (seed.imageFile ? await uploadImage(seed.imageFile, `Portrait of ${seed.doc.memberRef ?? 'committee member'}`) : undefined)
    documents.push({ ...seed.doc, ...(image ? { image } : {}) })
  }

  const transaction = client.transaction()
  for (const document of documents) transaction.createOrReplace(document)
  for (const id of SAMPLE_DOCUMENT_IDS) transaction.delete(id)

  if (projectSeeds.length > 0) {
    const current = projectSeeds.find(seed => seed.doc.year === 2019) ?? projectSeeds[0]
    transaction.patch('homePage', patch =>
      patch.set({
        currentTitle: [
          {
            _key: 'en',
            _type: 'internationalizedArrayStringValue',
            language: 'en',
            value: (current.doc.title as Array<{ value: string }>)[0]?.value ?? 'Current project',
          },
        ],
        currentHref: `/projects/${(current.doc.slug as { current: string }).current}`,
      }),
    )
  }

  await transaction.commit()
  console.log(
    `imported ${projectSeeds.length} projects, ${memberSeeds.length} members, ${committeeSeeds.length} committee entries; removed sample documents`,
  )
})
