import { globSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (files: string[]) =>
  files.map(file => readFileSync(file, 'utf8')).join('')

const cssFiles = readdirSync('src/styles').map(file => `src/styles/${file}`)
const componentFiles = globSync('src/**/*.astro')
const scriptFiles = globSync('src/**/*.ts')

const source =
  read(cssFiles) + read(componentFiles) + read(scriptFiles)

const allowedRadii = ['0', '34px', '50%', 'var(--radius-pill)']

describe('design guard', () => {
  it('scans styles, components and scripts', () => {
    expect(scriptFiles.length).toBeGreaterThan(0)
  })

  it('uses no shadows or gradients', () => {
    expect(source).not.toMatch(/box-shadow|drop-shadow|gradient/i)
  })

  it('only allows the documented radii', () => {
    for (const match of source.matchAll(
      /border-radius:\s*([^;}\n]+)\s*(?:;|$)/gim,
    )) {
      expect(allowedRadii).toContain(match[1].trim())
    }
  })
})
