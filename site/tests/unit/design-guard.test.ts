import { globSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readdirSync('src/styles')
  .map(file => readFileSync(`src/styles/${file}`, 'utf8'))
  .join('')
const components = globSync('src/**/*.astro')
  .map(file => readFileSync(file, 'utf8'))
  .join('')

const source = css + components

describe('design guard', () => {
  it('uses no shadows or gradients', () => {
    expect(source).not.toMatch(/box-shadow|linear-gradient|radial-gradient/)
  })

  it('only allows the documented radii', () => {
    for (const match of source.matchAll(/border-radius:\s*([^;]+);/g)) {
      expect(['0', '34px', '50%', 'var(--radius-pill)']).toContain(match[1].trim())
    }
  })
})
