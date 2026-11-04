import type { ArchiveProject } from './archive'
import type { MemberDraft } from './wix'

export type ImportManifest = {
  projectCovers: Array<{ year: number; file: string; width: number; height: number; alt?: string }>
  yearImages: Array<{ file: string; width: number; height: number; source: string }>
  memberPortraits: Array<{ name: string; slug: string; file: string; width: number; height: number }>
  membersWithoutPortrait?: string[]
}

export type SeedDocument = { _id: string; _type: string } & Record<string, unknown>

export type ProjectSeed = { doc: SeedDocument; coverFile?: string; coverAlt: string }

export type MemberSeed = { doc: SeedDocument; portraitFile?: string }

export type CommitteeSeed = { doc: SeedDocument; imageFile?: string }

type IntlStringValue = {
  _key: string
  _type: 'internationalizedArrayStringValue'
  language: 'en'
  value: string
}

type PortableBlock = {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: []
  children: Array<{ _type: 'span'; _key: string; text: string; marks: [] }>
}

const intlString = (value: string): IntlStringValue[] => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', language: 'en', value },
]

const portableBlocks = (paragraphs: string[]): PortableBlock[] =>
  paragraphs.map((text, index) => ({
    _type: 'block',
    _key: `b${index}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `s${index}`, text, marks: [] }],
  }))

const intlRich = (paragraphs: string[]) => [
  {
    _key: 'en',
    _type: 'internationalizedArrayPortableTextValue' as const,
    language: 'en' as const,
    value: portableBlocks(paragraphs),
  },
]

function venueOf(paragraphs: string[]): string {
  const text = paragraphs.join(' ')
  if (/limassol/i.test(text)) return 'Limassol, Cyprus'
  if (/larnaca/i.test(text)) return 'Larnaca, Cyprus'
  if (/paphos/i.test(text)) return 'Paphos, Cyprus'
  if (/nicosia/i.test(text)) return 'Nicosia, Cyprus'
  return 'Cyprus'
}

/**
 * One cover per year from the old `/project` index; 2017 has three extra
 * project images, so those go to its first three projects and the wide year
 * cover goes to the fourth.
 */
export function coverForProject(
  project: ArchiveProject,
  index: number,
  manifest: ImportManifest,
): string | undefined {
  const yearCover = manifest.projectCovers.find(cover => cover.year === project.year)
  // The 2018 cover is the Athens Printfest invitation, not the teachers' workshop.
  if (project.year === 2018) {
    return /ATHENS PRINTFEST 2018/i.test(project.title) ? yearCover?.file : undefined
  }
  if (project.year === 2017) {
    const extras = manifest.yearImages
      .filter(image => image.file.includes('/year/2017/'))
      .sort((a, b) => a.file.localeCompare(b.file))
    return extras[index]?.file ?? (index === 3 ? yearCover?.file : undefined)
  }
  return index === 0 ? yearCover?.file : undefined
}

export function buildProjectSeeds(
  projects: ArchiveProject[],
  manifest: ImportManifest,
): ProjectSeed[] {
  const byYear = new Map<number, ArchiveProject[]>()
  for (const project of projects) {
    const list = byYear.get(project.year) ?? []
    list.push(project)
    byYear.set(project.year, list)
  }

  const seeds: ProjectSeed[] = []
  for (const [year, list] of byYear) {
    list.forEach((project, index) => {
      const paragraphs = project.paragraphs.length > 0 ? project.paragraphs : [project.title]
      seeds.push({
        doc: {
          _id: `project-${project.slug}`,
          _type: 'project',
          slug: { _type: 'slug', current: project.slug },
          title: intlString(project.title),
          summary: intlString(project.summary.slice(0, 280)),
          body: intlRich(paragraphs),
          venue: intlString(venueOf(paragraphs)),
          year,
          gallery: [],
          participants: [],
          dates: {},
          links: [],
        },
        coverFile: coverForProject(project, index, manifest),
        coverAlt: project.title,
      })
    })
  }
  return seeds
}

export function buildMemberSeeds(
  members: MemberDraft[],
  manifest: ImportManifest,
): MemberSeed[] {
  const portraits = new Map(manifest.memberPortraits.map(portrait => [portrait.slug, portrait.file]))
  return members.map((member, index) => ({
    doc: {
      _id: member._id,
      _type: 'member',
      slug: { _type: 'slug', current: member.slug },
      name: intlString(member.name),
      discipline: intlString('Printmaker'),
      bio: intlRich(member.bio ? [member.bio] : [`${member.name} is a member of the Cyprus Printmakers Association.`]),
      email: member.email,
      status: member.status,
      featured: false,
      order: (index + 1) * 10,
    },
    portraitFile: portraits.get(member.slug),
  }))
}

const COMMITTEE: Array<{ name: string; role: string }> = [
  { name: 'Efklides Papadopoulos', role: 'Chair' },
  { name: 'Evgenia Vasiloude', role: 'Vice Chair' },
  { name: 'Stathis Paparoditis', role: 'Secretary' },
  { name: 'Michalis Phantaros', role: 'Treasurer' },
  { name: 'Annie Erotocritou', role: 'Member' },
  { name: 'Kyriakos Theocharous', role: 'Member' },
  { name: 'Hourig Torossian', role: 'Member' },
]

function nameKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildCommitteeSeeds(
  members: MemberDraft[],
  manifest: ImportManifest,
): CommitteeSeed[] {
  const byName = new Map(members.map(member => [nameKey(member.name), member]))
  const portraits = new Map(manifest.memberPortraits.map(portrait => [portrait.slug, portrait.file]))
  return COMMITTEE.map((entry, index) => {
    const member = byName.get(nameKey(entry.name))
    const slug = member?.slug ?? nameKey(entry.name).replace(/[^a-z0-9]+/g, '-')
    return {
      doc: {
        _id: `committee-${slug}`,
        _type: 'committeeMember',
        slug: { _type: 'slug', current: slug },
        name: intlString(member?.name ?? entry.name),
        role: intlString(entry.role),
        bio: intlRich(
          member?.bio
            ? [member.bio]
            : [`${entry.name} is a member of the Cyprus Printmakers Association committee.`],
        ),
        order: (index + 1) * 10,
        memberRef: member?.slug,
      },
      imageFile: member ? portraits.get(member.slug) : undefined,
    }
  })
}

export const SAMPLE_DOCUMENT_IDS = [
  'member-georgiou',
  'member-athanasiou',
  'member-andreas-petrou',
  'committee-maria-georgiou',
  'committee-eleni-athanasiou',
  'project-printmaking-days-2019',
  'project-printmaking-days-2017',
  'project-printmaking-days-2009',
  'news-printmaking-days-2026',
  'news-spring-workshops-2025',
]
