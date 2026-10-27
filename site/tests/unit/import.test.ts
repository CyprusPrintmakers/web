import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseMembersCsv, parseProjectPage, parseYearPage } from '../../scripts/lib/wix'

const projectHtml = readFileSync(
  new URL('../../scripts/__fixtures__/wix-project.html', import.meta.url),
  'utf8',
)
const yearHtml = readFileSync(
  new URL('../../scripts/__fixtures__/wix-year.html', import.meta.url),
  'utf8',
)
const csv = readFileSync(new URL('../../scripts/data/members.csv', import.meta.url), 'utf8')

const projectUrl = 'https://www.cyprintmakers.com/projects/2019'

describe('wix archive parsers', () => {
  it('parses a dynamic project page into a draft', () => {
    const draft = parseProjectPage(projectHtml, projectUrl)

    expect(draft.title).toMatch(/EPALE/)
    expect(draft.slug).toBe('2019')
    expect(draft.year).toBe(2019)
    expect(draft.images.length).toBeGreaterThan(0)
    expect(draft.images[0]).toMatch(/^https:\/\/static\.wixstatic\.com\/media\//)
    expect(draft._id).toBe('project-2019')
  })

  it('parses a year landing page into project titles', () => {
    const titles = parseYearPage(yearHtml)

    expect(titles.length).toBeGreaterThan(2)
    expect(titles.some(title => /printmaking/i.test(title))).toBe(true)
    expect(titles).not.toContain('HOME')
  })

  it('parses the members CSV into active member drafts', () => {
    const members = parseMembersCsv(csv)

    expect(members).toHaveLength(18)
    expect(members[0]).toMatchObject({ status: 'active' })
    for (const member of members) {
      expect(member.email).toMatch(/@/)
      expect(member.name).toBeTruthy()
      expect(member._id).toMatch(/^member-/)
    }
  })

  it('rejects malformed CSV rows instead of importing them silently', () => {
    const broken = 'name,email,bio,status\n"Broken",not-an-email,,"active"\n'
    expect(() => parseMembersCsv(broken)).toThrow(/invalid email/)
  })
})
