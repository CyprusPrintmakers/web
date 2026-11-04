import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseYearProjects, type ArchiveProject } from '../../scripts/lib/archive'
import {
  buildCommitteeSeeds,
  buildMemberSeeds,
  buildProjectSeeds,
  coverForProject,
  SAMPLE_DOCUMENT_IDS,
  type ImportManifest,
} from '../../scripts/lib/content-import'

const yearHtml = readFileSync(new URL('../../scripts/__fixtures__/wix-year.html', import.meta.url), 'utf8')

const manifest: ImportManifest = {
  projectCovers: [
    { year: 2019, file: 'wix-archive/rescrape/projects/2019.jpg', width: 1280, height: 720 },
    { year: 2017, file: 'wix-archive/rescrape/projects/2017.png', width: 2000, height: 650 },
  ],
  yearImages: [
    { file: 'wix-archive/rescrape/year/2017/2017-extra-1.png', width: 1141, height: 548, source: 'a' },
    { file: 'wix-archive/rescrape/year/2017/2017-extra-2.jpg', width: 1920, height: 1080, source: 'b' },
    { file: 'wix-archive/rescrape/year/2017/2017-extra-3.jpg', width: 2048, height: 1044, source: 'c' },
  ],
  memberPortraits: [
    { name: 'Aznive Papazian', slug: 'aznive-papazian', file: 'wix-archive/rescrape/members/aznive-papazian.jpg', width: 1576, height: 887 },
  ],
  membersWithoutPortrait: ['Nicolas Mouros'],
}

describe('archive year parser', () => {
  it('groups project sections and keeps subtitles out of the title list', () => {
    const projects = parseYearProjects(yearHtml, 2019)

    expect(projects.map(project => project.title)).toEqual([
      'PRINTMAKING EXHIBITION - GLORIA GALLERY',
      'RCB Eco Team KX WORKSHOP',
      'EPALE WORKSHOP',
    ])
    expect(projects[1].paragraphs).toEqual([
      'Protection of the Marine Environment',
      'Printmaking Workshop - Limassol',
    ])
    expect(projects[0].slug).toBe('printmaking-exhibition-gloria-gallery-2019')
  })
})

describe('content import seeds', () => {
  it('maps the first project of a year to the year cover', () => {
    const projects = parseYearProjects(yearHtml, 2019)
    const seeds = buildProjectSeeds(projects, manifest)

    expect(seeds).toHaveLength(3)
    expect(new Set(seeds.map(seed => seed.doc._id)).size).toBe(3)
    expect(seeds[0].coverFile).toBe('wix-archive/rescrape/projects/2019.jpg')
    expect(seeds[1].coverFile).toBeUndefined()
    expect(seeds[0].doc.title).toEqual([
      {
        _key: 'en',
        _type: 'internationalizedArrayStringValue',
        language: 'en',
        value: 'PRINTMAKING EXHIBITION - GLORIA GALLERY',
      },
    ])
  })

  it('uses the 2017 extras before the wide year cover', () => {
    const project: ArchiveProject = {
      year: 2017,
      slug: 'coming-together-2017',
      title: 'COMING TOGETHER',
      summary: 'x',
      paragraphs: ['x'],
    }
    expect(coverForProject(project, 0, manifest)).toContain('2017-extra-1')
    expect(coverForProject(project, 3, manifest)).toBe('wix-archive/rescrape/projects/2017.png')
  })

  it('builds member seeds with portraits and a Printmaker discipline', () => {
    const seeds = buildMemberSeeds(
      [
        {
          _id: 'member-aznive-papazian',
          slug: 'aznive-papazian',
          name: 'Aznive Papazian',
          email: 'aznive@example.com',
          bio: 'Aznive is a printmaker.',
          status: 'active',
        },
      ],
      manifest,
    )

    expect(seeds[0].doc._type).toBe('member')
    expect(seeds[0].doc.discipline).toEqual([
      {
        _key: 'en',
        _type: 'internationalizedArrayStringValue',
        language: 'en',
        value: 'Printmaker',
      },
    ])
    expect(seeds[0].portraitFile).toContain('aznive-papazian.jpg')
  })

  it('builds the seven committee entries with member links', () => {
    const members = [
      {
        _id: 'member-efklides-papadopoulos',
        slug: 'efklides-papadopoulos',
        name: 'Efklides Papadopoulos',
        email: 'e@example.com',
        status: 'active' as const,
      },
      {
        _id: 'member-annie-erotocritou',
        slug: 'annie-erotocritou',
        name: 'Annie Erotocritou',
        email: 'a@example.com',
        status: 'active' as const,
      },
    ]
    const seeds = buildCommitteeSeeds(members, manifest)

    expect(seeds).toHaveLength(7)
    expect(seeds[0].doc.memberRef).toBe('efklides-papadopoulos')
    expect(seeds[4].doc.memberRef).toBe('annie-erotocritou')
  })

  it('lists the sample documents that the live import replaces', () => {
    expect(SAMPLE_DOCUMENT_IDS).toContain('member-georgiou')
    expect(SAMPLE_DOCUMENT_IDS).toContain('news-printmaking-days-2026')
  })
})
