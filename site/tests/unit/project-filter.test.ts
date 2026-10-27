import { describe, expect, it } from 'vitest'
import { filterByYear, yearsOf } from '../../src/lib/projects/filter'
import { createContentLoader, loadFixtures } from '../../src/lib/content/source'
import type { Project } from '../../src/lib/content/types'

const projects: Project[] = (await createContentLoader(loadFixtures)()).projects

describe('project year filter', () => {
  it('lists years descending and de-duplicated', () => {
    expect(yearsOf(projects)).toEqual([2019, 2017, 2009])
  })

  it('filters by year', () => {
    expect(filterByYear(projects, 2019).map(p => p.slug)).toEqual(['printmaking-days-2019'])
  })

  it('returns everything for a null year', () => {
    expect(filterByYear(projects, null)).toHaveLength(3)
  })

  it('orders the index newest first', () => {
    expect(projects.map(p => p.year)).toEqual([...projects.map(p => p.year)].sort((a, b) => b - a))
  })
})
