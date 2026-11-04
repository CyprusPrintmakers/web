import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync('src/styles/tokens.css', 'utf8')
const base = readFileSync('src/styles/base.css', 'utf8')

describe('type scale', () => {
  it('defines the four fluid sizes and the measure', () => {
    for (const name of [
      '--text-small',
      '--text-note',
      '--text-body',
      '--text-title',
      '--text-display',
      '--measure',
    ]) {
      expect(tokens).toContain(`${name}:`)
    }
    expect(tokens).toContain('clamp(')
    expect(tokens).toContain('--measure: 65ch')
  })

  it('drives the utilities from the tokens instead of fixed px', () => {
    expect(base).toMatch(/\.t-body\s*{[^}]*var\(--text-body\)/)
    expect(base).toMatch(/\.t-display\s*{[^}]*var\(--text-display\)/)
    expect(base).toMatch(/\.t-title\s*{[^}]*var\(--text-title\)/)
    expect(base).toMatch(/\.t-note\s*{[^}]*var\(--text-note\)/)
    expect(base).toMatch(/\.t-label\s*{[^}]*var\(--text-small\)/)
  })
})
