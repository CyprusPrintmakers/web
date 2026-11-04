import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  parseAboutPage,
  parseCommitteePage,
  parseContactPage,
  parseYearProjects,
  type ArchiveProject,
} from '../../scripts/lib/archive'
import {
  buildAboutPatch,
  buildCommitteeGreekPatches,
  buildCommitteeSeeds,
  buildContactPatch,
  buildMemberNamePatches,
  buildMemberSeeds,
  buildProjectSeeds,
  buildSettingsPatch,
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

  it('keeps the PDF posters and programmes attached to their project section', () => {
    const html = `
      <section>
        <h2>PRINTMAKING DAYS 2009</h2>
        <p>The 2009 programme included a photopolymer workshop.</p>
        <p><a href="https://example.com/ugd/poster.pdf">PHOTOPOLYMER WORKSHOP - Yiannis Gourzis</a></p>
      </section>
    `

    const [project] = parseYearProjects(html, 2009)
    expect(project.links).toEqual([
      {
        href: 'https://example.com/ugd/poster.pdf',
        label: 'PHOTOPOLYMER WORKSHOP - Yiannis Gourzis',
      },
    ])
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
      links: [],
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

  it('maps archive PDF links onto the project document', () => {
    const html = `
      <section>
        <h2>PRINTMAKING DAYS 2009</h2>
        <p>A workshop programme from 2009.</p>
        <p><a href="https://example.com/ugd/poster.pdf">PHOTOPOLYMER WORKSHOP</a></p>
      </section>
    `
    const [seed] = buildProjectSeeds(parseYearProjects(html, 2009), manifest)

    expect(seed.doc.links).toEqual([
      {
        _key: 'link-1',
        _type: 'link',
        label: 'PHOTOPOLYMER WORKSHOP',
        href: 'https://example.com/ugd/poster.pdf',
      },
    ])
  })
})

const longParagraph = (text: string) =>
  `${text} ${'The association has organised exhibitions, workshops and open studios since the workshop was founded in 1996. '.repeat(2)}`.trim()

describe('archive page parsers', () => {
  it('reads the about headline, three intro paragraphs and three history paragraphs', () => {
    const html = `
      <p>HOME</p><p>ABOUT</p>
      <h6><span>CYPRIOT PRINTMAKERS &amp; MODEL PRINTMAKING WORKSHOP, CYPRUS CHAMBER OF FINE ARTS (CCFA)</span></h6>
      <p>${longParagraph('The idea of establishing a Model Printmaking Workshop was initiated by the need to practise contemporary printmaking.')}</p>
      <p>${longParagraph('The Model Printmaking Workshop of the Cyprus Chamber of Fine Arts was established in 1996.')}</p>
      <p>${longParagraph('The workshop is located in the area of Pallouriotissa, Nicosia, and provides the necessary infrastructure.')}</p>
      <p>${longParagraph('Since its inception, the workshop has hosted a significant number of notable events.')}</p>
      <p>${longParagraph('In December 2010, the members went on to found a non-for-profit company called Cypriot Printmakers.')}</p>
      <p>${longParagraph('Within this framework, several events have taken place with many more in the making.')}</p>
      <p>0035799351153</p>
    `

    const about = parseAboutPage(html)

    expect(about.headline).toBe(
      'Cypriot Printmakers & Model Printmaking Workshop, Cyprus Chamber of Fine Arts (CCFA)',
    )
    expect(about.body).toHaveLength(3)
    expect(about.body[1]).toContain('established in 1996')
    expect(about.history).toHaveLength(3)
    expect(about.history[2]).toContain('several events have taken place')
  })

  it('reads the workshop note and splits the address into display lines', () => {
    const html = `
      <p>HOME</p>
      <p>The workshop is located in the area of Palouriotissa in Nicosia.</p>
      <p>AIGEOS 7, PALOURIOTISSA 1035,</p>
      <p>NICOSIA</p>
      <p>CYPRUS</p>
      <p>0035799351153</p>
    `

    expect(parseContactPage(html)).toEqual({
      openingNote: 'The workshop is located in the area of Palouriotissa in Nicosia.',
      address: ['Aigeos 7', 'Palouriotissa 1035', 'Nicosia', 'Cyprus'],
    })
  })

  it('pairs committee names with their roles and decodes the Greek entities', () => {
    const html = `
      <h4>Efklides Papadopoulos / &Epsilon;&upsilon;&kappa;&lambda;&epsilon;ί&delta;&eta;&sigmaf; &Pi;&alpha;&pi;&alpha;&delta;ό&pi;&omicron;&upsilon;&lambda;&omicron;&sigmaf;</h4>
      <h6>Chair / &Pi;&rho;ό&epsilon;&delta;&rho;&omicron;&sigmaf;</h6>
      <h4>Anni Erotocritou / Άννη Ερωτοκρίτου</h4>
      <h6>Member / Μέλος</h6>
    `

    expect(parseCommitteePage(html)).toEqual([
      {
        name: 'Efklides Papadopoulos',
        greekName: 'Ευκλείδης Παπαδόπουλος',
        role: 'Chair',
        greekRole: 'Πρόεδρος',
      },
      {
        name: 'Anni Erotocritou',
        greekName: 'Άννη Ερωτοκρίτου',
        role: 'Member',
        greekRole: 'Μέλος',
      },
    ])
  })
})

describe('page import patches', () => {
  it('replaces the invented Greek about copy with the English archive text', () => {
    const patch = buildAboutPatch({
      headline: 'Cypriot Printmakers & Model Printmaking Workshop',
      body: ['One.', 'Two.'],
      history: ['Three.'],
    })

    expect(patch.headline).toHaveLength(1)
    expect(patch.headline[0].value).toBe('Cypriot Printmakers & Model Printmaking Workshop')
    expect(patch.body[0].value).toHaveLength(2)
    expect(patch.partners.map(partner => partner.name)).toEqual([
      'Cyprus Chamber of Fine Arts (CCFA)',
      'Cultural Services, Ministry of Education and Culture',
      'University of Cyprus',
    ])
  })

  it('builds a map link from the archive address', () => {
    const patch = buildContactPatch({
      openingNote: 'The workshop is located in the area of Palouriotissa in Nicosia.',
      address: ['Aigeos 7', 'Palouriotissa 1035', 'Nicosia', 'Cyprus'],
    })

    expect(patch.openingNote).toHaveLength(1)
    expect(decodeURIComponent(patch.mapUrl)).toContain('Aigeos 7, Palouriotissa 1035, Nicosia, Cyprus')
  })

  it('writes the real contact details into site settings', () => {
    const patch = buildSettingsPatch({
      openingNote: 'x',
      address: ['Aigeos 7', 'Palouriotissa 1035', 'Nicosia', 'Cyprus'],
    })

    expect(patch.contact.address).toEqual(['Aigeos 7', 'Palouriotissa 1035', 'Nicosia', 'Cyprus'])
    expect(patch.contact.phoneHref).toBe('tel:+35799351153')
  })

  it('attaches Greek names to the members the old committee page listed', () => {
    const patches = buildMemberNamePatches(
      [
        {
          _id: 'member-annie-erotocritou',
          slug: 'annie-erotocritou',
          name: 'Annie Erotocritou',
          email: 'a@example.com',
          status: 'active' as const,
        },
      ],
      [
        {
          name: 'Anni Erotocritou',
          greekName: 'Άννη Ερωτοκρίτου',
          role: 'Member',
          greekRole: 'Μέλος',
        },
      ],
    )

    expect(patches).toHaveLength(1)
    expect(patches[0]._id).toBe('member-annie-erotocritou')
    expect(patches[0].name).toEqual([
      { _key: 'en', _type: 'internationalizedArrayStringValue', language: 'en', value: 'Annie Erotocritou' },
      { _key: 'el', _type: 'internationalizedArrayStringValue', language: 'el', value: 'Άννη Ερωτοκρίτου' },
    ])
  })

  it('gives committee records both languages when the archive has them', () => {
    const seeds = buildCommitteeSeeds(
      [
        {
          _id: 'member-annie-erotocritou',
          slug: 'annie-erotocritou',
          name: 'Annie Erotocritou',
          email: 'a@example.com',
          status: 'active' as const,
        },
      ],
      manifest,
      [
        {
          name: 'Anni Erotocritou',
          greekName: 'Άννη Ερωτοκρίτου',
          role: 'Member',
          greekRole: 'Μέλος',
        },
      ],
    )

    const member = seeds.find(seed => seed.doc.memberRef === 'annie-erotocritou')
    expect(member?.doc.name).toEqual([
      { _key: 'en', _type: 'internationalizedArrayStringValue', language: 'en', value: 'Annie Erotocritou' },
      { _key: 'el', _type: 'internationalizedArrayStringValue', language: 'el', value: 'Άννη Ερωτοκρίτου' },
    ])
  })
})

describe('committee localisation patches', () => {
  it('patches the committee record with the Greek name and a corrected Greek role', () => {
    const patches = buildCommitteeGreekPatches(
      [
        {
          _id: 'member-michalis-phantaros',
          slug: 'michalis-phantaros',
          name: 'Michalis Phantaros',
          email: 'm@example.com',
          status: 'active' as const,
        },
      ],
      [
        {
          name: 'Michalis Phantaros',
          greekName: 'Μιχάλης Φαντάρος',
          role: 'Treasurer',
          greekRole: 'Ταμείας',
        },
      ],
    )

    expect(patches[0]._id).toBe('committee-michalis-phantaros')
    expect(patches[0].role).toEqual([
      { _key: 'en', _type: 'internationalizedArrayStringValue', language: 'en', value: 'Treasurer' },
      { _key: 'el', _type: 'internationalizedArrayStringValue', language: 'el', value: 'Ταμίας' },
    ])
  })
})
