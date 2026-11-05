import type { ArchiveAbout, ArchiveContact, ArchiveProject, ArchiveCommitteeMember } from './archive'
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

type IntlBilingualValue = {
  _key: 'en' | 'el'
  _type: 'internationalizedArrayStringValue'
  language: 'en' | 'el'
  value: string
}

/** English plus a Greek value when the archive actually records one. */
const intlBilingual = (english: string, greek?: string): IntlBilingualValue[] => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', language: 'en', value: english },
  ...(greek
    ? [
        {
          _key: 'el' as const,
          _type: 'internationalizedArrayStringValue' as const,
          language: 'el' as const,
          value: greek,
        },
      ]
    : []),
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
          links: project.links.map((link, linkIndex) => ({
            _key: `link-${linkIndex + 1}`,
            _type: 'link',
            label: link.label,
            href: link.href,
          })),
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
  translations: ArchiveCommitteeMember[] = [],
): MemberSeed[] {
  const portraits = new Map(manifest.memberPortraits.map(portrait => [portrait.slug, portrait.file]))
  const greekByName = new Map(translations.map(entry => [normalizedName(entry.name), entry.greekName]))
  return members.map((member, index) => ({
    doc: {
      _id: member._id,
      _type: 'member',
      slug: { _type: 'slug', current: member.slug },
      name: intlBilingual(member.name, greekByName.get(normalizedName(member.name))),
      discipline: intlString('Printmaker'),
      bio: intlRich(
        bioParagraphs(member.bio, `${member.name} is a member of the Cyprus Printmakers Association.`),
      ),
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

/** The archive spells two names differently from the members list. */
const NAME_ALIASES: Record<string, string> = {
  'anni erotocritou': 'annie erotocritou',
  'hurig torossian': 'hourig torossian',
}

export function normalizedName(value: string): string {
  const key = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  return NAME_ALIASES[key] ?? key
}

export function buildCommitteeSeeds(
  members: MemberDraft[],
  manifest: ImportManifest,
  translations: ArchiveCommitteeMember[] = [],
): CommitteeSeed[] {
  const byName = new Map(members.map(member => [normalizedName(member.name), member]))
  const greekByName = new Map(translations.map(entry => [normalizedName(entry.name), entry]))
  const portraits = new Map(manifest.memberPortraits.map(portrait => [portrait.slug, portrait.file]))
  return COMMITTEE.map((entry, index) => {
    const member = byName.get(normalizedName(entry.name))
    const greek = greekByName.get(normalizedName(entry.name))
    const slug = member?.slug ?? normalizedName(entry.name).replace(/[^a-z0-9]+/g, '-')
    return {
      doc: {
        _id: `committee-${slug}`,
        _type: 'committeeMember',
        slug: { _type: 'slug', current: slug },
        name: intlBilingual(member?.name ?? entry.name, greek?.greekName),
        role: intlBilingual(entry.role, greekRoleOf(greek?.greekRole)),
        bio: intlRich(
          bioParagraphs(
            member?.bio,
            `${entry.name} is a member of the Cyprus Printmakers Association committee.`,
          ),
        ),
        order: (index + 1) * 10,
        memberRef: member?.slug,
      },
      imageFile: member ? portraits.get(member.slug) : undefined,
    }
  })
}

export const ABOUT_PARTNERS = [
  'Cyprus Chamber of Fine Arts (CCFA)',
  'Cultural Services, Ministry of Education and Culture',
  'University of Cyprus',
]

export function buildAboutPatch(about: ArchiveAbout) {
  return {
    headline: intlString(about.headline),
    body: intlRich(about.body),
    history: intlRich(about.history),
    partners: ABOUT_PARTNERS.map((name, index) => ({
      _key: `partner-${index + 1}`,
      _type: 'partner',
      name,
    })),
  }
}

export function buildContactPatch(contact: ArchiveContact) {
  return {
    openingNote: intlString(contact.openingNote),
    // The archive gives no opening hours; the committee has to confirm them.
    officeHours: intlString('Visits by appointment'),
    mapUrl: `https://maps.google.com/?q=${encodeURIComponent(contact.address.join(', '))}`,
  }
}

export function buildSettingsPatch(contact: ArchiveContact) {
  return {
    contact: {
      _type: 'contactDetails',
      address: contact.address,
      phone: '0035799351153',
      phoneHref: 'tel:+35799351153',
      email: 'cyprintmakers@gmail.com',
    },
  }
}

export function buildHomeHeroPatch(about: ArchiveAbout) {
  return {
    heroBody: [
      {
        _key: 'en',
        _type: 'internationalizedArrayTextValue',
        language: 'en',
        value: about.body[1],
      },
    ],
  }
}

/** Greek names only exist for the seven committee members on the old site. */
export function buildMemberNamePatches(
  members: MemberDraft[],
  translations: ArchiveCommitteeMember[],
): Array<{ _id: string; name: IntlBilingualValue[] }> {
  const byName = new Map(members.map(member => [normalizedName(member.name), member]))
  return translations.flatMap(entry => {
    const member = byName.get(normalizedName(entry.name))
    if (!member) return []
    return [{ _id: member._id, name: intlBilingual(member.name, entry.greekName) }]
  })
}

/** The old committee page spells the treasurer's role "Ταμείας"; "Ταμίας" is correct. */
const GREEK_ROLE_FIXES: Record<string, string> = {
  Ταμείας: 'Ταμίας',
}

const greekRoleOf = (value?: string): string | undefined =>
  value ? (GREEK_ROLE_FIXES[value] ?? value) : undefined

/** The archive keeps paragraph breaks in its `<br>` tags; the CSV joins them. */
export function bioParagraphs(bio: string | undefined, fallback: string): string[] {
  const paragraphs = (bio ?? '')
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)

  return paragraphs.length > 0 ? paragraphs : [fallback]
}

export function buildCommitteeGreekPatches(
  members: MemberDraft[],
  translations: ArchiveCommitteeMember[],
): Array<{ _id: string; name: IntlBilingualValue[]; role: IntlBilingualValue[] }> {
  const byName = new Map(members.map(member => [normalizedName(member.name), member]))
  return translations.flatMap(entry => {
    const member = byName.get(normalizedName(entry.name))
    if (!member) return []
    return [
      {
        _id: `committee-${member.slug}`,
        name: intlBilingual(member.name, entry.greekName),
        role: intlBilingual(entry.role, greekRoleOf(entry.greekRole)),
      },
    ]
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
