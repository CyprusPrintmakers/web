import { describe, expect, it } from 'vitest'
import { filterMembers, groupByLetter } from '../../src/lib/members/filter'
import { createContentLoader, loadFixtures } from '../../src/lib/content/source'
import type { Member } from '../../src/lib/content/types'

const all: Member[] = (await createContentLoader(loadFixtures)()).members

describe('member filter', () => {
  it('returns everyone for an empty query and no letter', () => {
    expect(filterMembers(all, '', null, 'en')).toHaveLength(3)
  })

  it('matches a query case- and accent-insensitively', () => {
    expect(filterMembers(all, 'geo', null, 'en').map(m => m.slug)).toEqual(['georgiou'])
    expect(filterMembers(all, 'GEOR', null, 'en').map(m => m.slug)).toEqual(['georgiou'])
  })

  it('filters by Greek surname letter using Greek collation', () => {
    expect(filterMembers(all, '', 'Α', 'el').map(m => m.slug)).toEqual(['athanasiou'])
  })

  it('never matches Greek names with a Latin letter in the Greek view', () => {
    expect(filterMembers(all, '', 'A', 'el')).toHaveLength(0)
  })

  it('matches a final sigma against a typed regular sigma', () => {
    const papas = {
      ...all[0],
      slug: 'papas',
      _id: 'member-papas',
      name: [
        { _key: 'n-en', language: 'en', value: 'Papas' },
        { _key: 'n-el', language: 'el', value: 'Γιώργος Παππάς' },
      ],
    } as Member

    expect(filterMembers([papas], 'παππας', null, 'el').map(m => m.slug)).toEqual(['papas'])
    expect(filterMembers([papas], 'ΠΑΠΠΑΣ', null, 'el').map(m => m.slug)).toEqual(['papas'])
    expect(filterMembers([papas], 'georgos', null, 'el')).toHaveLength(0)
  })

  it('matches accented queries against plain names', () => {
    expect(filterMembers(all, 'Άθανασίου', null, 'el').map(m => m.slug)).toEqual([
      'athanasiou',
    ])
  })

  it('groups by the surname letter and sorts keys with locale collation', () => {
    const keys = [...groupByLetter(all, 'el').keys()]
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b, 'el')))
    expect(keys).toContain('Α')
    expect(groupByLetter(all, 'en').get('G')?.map(m => m.slug)).toEqual(['georgiou'])
  })

  it('files Greek names under their Greek initial, not the English one', () => {
    const el = groupByLetter(all, 'el')
    expect(el.get('Α')?.map(m => m.slug)).toEqual(['athanasiou'])
    expect(el.get('A')).toBeUndefined()
  })
})
