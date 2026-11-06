import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createContentLoader,
  getContent,
  loadFixtures,
  resolveContentSource,
} from '../../src/lib/content/source'
import {
  assertRequiredFields,
  isFullyTranslated,
} from '../../src/lib/content/translation'
import { imageAttrs, type ImageDoc } from '../../src/lib/media'
import { t } from '../../src/lib/i18n/ui'

const load = createContentLoader(loadFixtures)

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('content loader', () => {
  it('loads fixture content and normalises translation flags', async () => {
    const content = await load()

    expect(content.projects.length).toBeGreaterThan(0)
    expect(content.members[0].name[0].language).toBe('en')
  })

  it('has the fixture inventory later tasks depend on', async () => {
    const content = await load()

    expect(content.members.map(member => member.slug)).toEqual([
      'georgiou',
      'athanasiou',
      'andreas-petrou',
    ])
    expect(content.committee).toHaveLength(2)

    expect(content.projects).toHaveLength(3)
    expect(content.projects.map(project => project.year)).toEqual([2019, 2017, 2009])
    const project2019 = content.projects.find(
      project => project.slug === 'printmaking-days-2019',
    )
    expect(project2019?.gallery.length).toBeGreaterThan(0)

    expect(content.news).toHaveLength(2)
    expect(content.news[0].publishedAt > content.news[1].publishedAt).toBe(true)

    expect(content.settings.contact.address.join(' ')).toContain('Agiou 7')
    expect(content.settings.contact.email).toBe('cyprintmakers@gmail.com')
    expect(content.settings.contact.phone).toBe('0035799351153')
    expect(content.settings.contact.phoneHref).toBe('tel:+35799351153')
    expect(content.settings.inkEffect).toBe(true)

    expect(content.home.title.find(entry => entry.language === 'en')?.value).toBe(
      'CYPRUS PRINTMAKERS ASSOCIATION',
    )
    expect(t('current', 'el')).toBe('ΤΩΡΑ')

    expect(content.membership.tiers).toHaveLength(3)
    expect(content.membership.tiers.map(tier => tier.name.find(entry => entry.language === 'en')?.value)).toEqual([
      'Individual',
      'Group (up to 4 persons)',
      'Corporate',
    ])
    const corporate = content.membership.tiers[2]
    expect(corporate.levels?.map(level => level.name)).toEqual([
      'Silver',
      'Gold',
      'Platinum',
    ])
    expect(content.membership.tiersConfirmed).toBe(false)
    expect(
      content.membership.tiers[0].name.find(entry => entry.language === 'el')?.value,
    ).not.toBe('Individual')
    expect(
      content.membership.privacyNote.find(entry => entry.language === 'en')?.value,
    ).toContain('Read the full privacy policy')
    expect(
      content.membership.privacyNote.find(entry => entry.language === 'el')?.value,
    ).toContain('πολιτική απορρήτου')

    for (const page of [
      content.settings,
      content.home,
      content.about,
      content.contact,
      content.membership,
      content.support,
    ]) {
      expect(page.translations).toEqual({ en: true, el: true })
    }
    for (const doc of [...content.committee, ...content.projects, ...content.news]) {
      expect(doc.translations).toEqual({ en: true, el: true })
    }
  })

  it('reports a missing required field with the document id', async () => {
    const raw = await loadFixtures()
    const [project] = raw.projects
    const brokenProject = {
      ...project,
      title: project.title.filter(entry => entry.language !== 'en'),
    }

    const broken = createContentLoader(async () => ({
      ...raw,
      projects: [brokenProject],
    }))

    await expect(broken()).rejects.toThrow(
      `project ${project._id} missing required field title for en`,
    )
  })

  it('computes translation completeness per locale and kind', async () => {
    const content = await load()
    const maria = content.members.find(member => member.slug === 'georgiou')
    const andreas = content.members.find(member => member.slug === 'andreas-petrou')

    expect(maria?.translations).toEqual({ en: true, el: true })
    expect(isFullyTranslated(maria!, 'member', 'en')).toBe(true)
    expect(isFullyTranslated(maria!, 'member', 'el')).toBe(true)

    expect(andreas?.translations).toEqual({ en: true, el: false })
    expect(isFullyTranslated(andreas!, 'member', 'en')).toBe(true)
    expect(isFullyTranslated(andreas!, 'member', 'el')).toBe(false)
  })

  it('treats an English-only process step body as untranslated for Greek', async () => {
    const raw = await loadFixtures()
    const membership = {
      ...raw.membership,
      processSteps: raw.membership.processSteps.map((step, index) =>
        index === 0
          ? { ...step, body: step.body.filter(entry => entry.language !== 'el') }
          : step,
      ),
    }
    const content = await createContentLoader(async () => ({ ...raw, membership }))()

    expect(content.membership.translations).toEqual({ en: true, el: false })
    expect(isFullyTranslated(content.membership, 'membershipPage', 'el')).toBe(false)
  })

  it('reports a missing Greek nested process field with an indexed label', async () => {
    const raw = await loadFixtures()
    const membership = {
      ...raw.membership,
      processSteps: raw.membership.processSteps.map((step, index) =>
        index === 0
          ? { ...step, body: step.body.filter(entry => entry.language !== 'el') }
          : step,
      ),
    }

    expect(() => assertRequiredFields(membership, 'membershipPage', 'el')).toThrow(
      `membershipPage ${membership._id} missing required field process[0].body for el`,
    )
  })

  it('treats English-only tier benefits as untranslated for Greek', async () => {
    const raw = await loadFixtures()
    const membership = {
      ...raw.membership,
      tiers: raw.membership.tiers.map((tier, index) =>
        index === 0
          ? {
              ...tier,
              benefits: tier.benefits?.filter(entry => entry.language !== 'el'),
            }
          : tier,
      ),
    }
    const content = await createContentLoader(async () => ({ ...raw, membership }))()

    expect(content.membership.translations).toEqual({ en: true, el: false })
    expect(isFullyTranslated(content.membership, 'membershipPage', 'el')).toBe(false)
  })

  it('leaves a tier without benefits fully translated', async () => {
    const raw = await loadFixtures()
    const membership = {
      ...raw.membership,
      tiers: raw.membership.tiers.map((tier, index) =>
        index === 0 ? { name: tier.name, price: tier.price } : tier,
      ),
    }
    const content = await createContentLoader(async () => ({ ...raw, membership }))()

    expect(content.membership.translations).toEqual({ en: true, el: true })
    expect(isFullyTranslated(content.membership, 'membershipPage', 'el')).toBe(true)
  })

  it('treats an English-only committee bio as untranslated for Greek', async () => {
    const raw = await loadFixtures()
    const committee = raw.committee.map((member, index) =>
      index === 0
        ? { ...member, bio: member.bio?.filter(entry => entry.language !== 'el') }
        : member,
    )
    const content = await createContentLoader(async () => ({ ...raw, committee }))()
    const member = content.committee.find(item => item._id === raw.committee[0]._id)

    expect(member?.translations).toEqual({ en: true, el: false })
    expect(isFullyTranslated(member!, 'committeeMember', 'el')).toBe(false)
  })

  it('leaves a committee member without a bio fully translated', async () => {
    const raw = await loadFixtures()
    const committee = raw.committee.map((member, index) =>
      index === 0 ? { ...member, bio: undefined } : member,
    )
    const content = await createContentLoader(async () => ({ ...raw, committee }))()
    const member = content.committee.find(item => item._id === raw.committee[0]._id)

    expect(member?.translations).toEqual({ en: true, el: true })
    expect(isFullyTranslated(member!, 'committeeMember', 'el')).toBe(true)
  })
})

describe('source selection', () => {
  it('defaults to fixtures with no project id', () => {
    vi.stubEnv('CONTENT_SOURCE', '')
    vi.stubEnv('SANITY_PROJECT_ID', '')

    expect(resolveContentSource()).toBe('fixtures')
  })

  it('uses sanity when a project id is present', () => {
    vi.stubEnv('CONTENT_SOURCE', '')
    vi.stubEnv('SANITY_PROJECT_ID', 'project-123')

    expect(resolveContentSource()).toBe('sanity')
  })

  it('lets CONTENT_SOURCE win over a project id', () => {
    vi.stubEnv('CONTENT_SOURCE', 'fixtures')
    vi.stubEnv('SANITY_PROJECT_ID', 'project-123')

    expect(resolveContentSource()).toBe('fixtures')
  })

  it('loads fixtures through getContent when CONTENT_SOURCE is fixtures', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'fixtures')
    vi.stubEnv('SANITY_PROJECT_ID', 'project-123')

    const content = await getContent()
    expect(content.members).toHaveLength(3)
  })
})

describe('imageAttrs', () => {
  const urlFor = () => 'https://cdn.sanity.io/images/p/d/example.jpg'

  it('degrades to reserved dimensions and empty alt without an image', () => {
    expect(imageAttrs(undefined, { urlFor })).toEqual({
      src: undefined,
      alt: '',
      width: 1200,
      height: 800,
    })
  })

  it('reads dimensions and alt from the image document', () => {
    const imageDoc: ImageDoc = {
      _type: 'image',
      asset: { _ref: 'image-abc-1200x800-jpg' },
      dimensions: { width: 1200, height: 800 },
    }

    expect(imageAttrs(imageDoc, { urlFor })).toMatchObject({
      width: 1200,
      height: 800,
      alt: '',
    })
    expect(imageAttrs({ ...imageDoc, alt: 'A print' }, { urlFor })).toEqual({
      src: 'https://cdn.sanity.io/images/p/d/example.jpg',
      alt: 'A print',
      width: 1200,
      height: 800,
    })
  })

  it('applies crop multiplicatively to intrinsic dimensions', () => {
    const imageDoc: ImageDoc = {
      _type: 'image',
      asset: { _ref: 'image-abc-1200x800-jpg' },
      dimensions: { width: 1200, height: 800 },
    }

    expect(
      imageAttrs(
        { ...imageDoc, crop: { top: 0.1, bottom: 0.1, left: 0, right: 0 } },
        { urlFor },
      ).height,
    ).toBe(640)
    expect(
      imageAttrs({ ...imageDoc, crop: { left: 0.25, right: 0.25 } }, { urlFor })
        .width,
    ).toBe(600)
  })

  it('uses the provided fallback when dimensions are absent', () => {
    expect(
      imageAttrs(
        { _type: 'image' },
        { urlFor, fallback: { width: 640, height: 480 } },
      ),
    ).toEqual({ src: undefined, alt: '', width: 640, height: 480 })
  })
})
