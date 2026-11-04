import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'
import { parseAboutPage, parseCommitteePage, parseContactPage } from './lib/archive'
import {
  buildAboutPatch,
  buildCommitteeGreekPatches,
  buildContactPatch,
  buildHomeHeroPatch,
  buildMemberNamePatches,
  buildSettingsPatch,
} from './lib/content-import'
import { withWebhookPaused } from './lib/sanity-hooks'
import { loadMemberDrafts } from './lib/inputs'

/**
 * Migrates the archived page copy that the collection import does not cover:
 * the about page, contact details, the home intro paragraph, and the Greek
 * names the old committee page recorded for seven members.
 */

const siteDir = fileURLToPath(new URL('..', import.meta.url))
const repoRoot = resolve(siteDir, '..')
const archiveDir = resolve(repoRoot, 'wix-archive')
const dryRun = process.argv.includes('--dry-run')

const readPage = (name: string) => readFile(resolve(archiveDir, 'pages', name), 'utf8')

const [aboutHtml, contactHtml, committeeHtml] = await Promise.all([
  readPage('about.html'),
  readPage('contact.html'),
  readPage('executive-committee.html'),
])

const about = parseAboutPage(aboutHtml)
const contact = parseContactPage(contactHtml)
const committee = parseCommitteePage(committeeHtml)
const members = loadMemberDrafts()

const aboutPatch = buildAboutPatch(about)
const contactPatch = buildContactPatch(contact)
const settingsPatch = buildSettingsPatch(contact)
const heroPatch = buildHomeHeroPatch(about)
const memberNamePatches = buildMemberNamePatches(members, committee)
const committeePatches = buildCommitteeGreekPatches(members, committee)

if (dryRun) {
  console.log(
    JSON.stringify(
      {
        about: aboutPatch,
        contact: contactPatch,
        settings: settingsPatch,
        hero: heroPatch,
        committeeTranslations: committee,
        memberGreekNames: memberNamePatches.map(entry => entry._id),
        committeePatches,
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

await withWebhookPaused(projectId, token, async () => {
  const transaction = client.transaction()
    .patch('aboutPage', patch => patch.set(aboutPatch))
    .patch('contactPage', patch => patch.set(contactPatch))
    .patch('siteSettings', patch => patch.set(settingsPatch))
    .patch('homePage', patch => patch.set(heroPatch))

  for (const entry of memberNamePatches) {
    transaction.patch(entry._id, patch => patch.set({ name: entry.name }))
  }

  for (const entry of committeePatches) {
    transaction.patch(entry._id, patch => patch.set({ name: entry.name, role: entry.role }))
  }

  await transaction.commit()
  console.log(
    `imported about + contact copy and the home intro; added Greek names for ${memberNamePatches.length} members`,
  )
})
