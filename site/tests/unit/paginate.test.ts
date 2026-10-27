import { describe, expect, it } from 'vitest'
import { paginate } from '../../src/lib/news/paginate'

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

describe('paginate', () => {
  it('slices 25 items into pages of 10', () => {
    expect(paginate(range(25), 1, 10).items).toHaveLength(10)
    expect(paginate(range(25), 2, 10).items).toHaveLength(10)
    expect(paginate(range(25), 3, 10).items).toHaveLength(5)
    expect(paginate(range(25), 4, 10).items).toEqual([])
  })

  it('counts pages, never fewer than one', () => {
    expect(paginate(range(25), 1, 10).pages).toBe(3)
    expect(paginate(range(0), 1, 10).pages).toBe(1)
    expect(paginate(range(10), 1, 10).pages).toBe(1)
    expect(paginate(range(11), 1, 10).pages).toBe(2)
  })

  it('slices on page boundaries', () => {
    expect(paginate(range(25), 2, 10).items[0]).toBe(10)
    expect(paginate(range(25), 3, 10).items[0]).toBe(20)
  })
})
