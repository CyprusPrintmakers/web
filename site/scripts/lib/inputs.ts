import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { parseMembersCsv, parseProjectPage, parseYearPage, type ProjectDraft } from './wix'

export type NdJsonLine = Record<string, unknown>

export function printNdJson(label: string, payload: unknown): void {
  process.stdout.write(`${JSON.stringify({ [label]: payload })}\n`)
}

export async function loadProjectDrafts(): Promise<ProjectDraft[]> {
  const html = await readFile(
    new URL('../__fixtures__/wix-project.html', import.meta.url),
    'utf8',
  )
  return [parseProjectPage(html, 'https://www.cyprintmakers.com/projects/2019')]
}

export async function loadYearTitles(): Promise<string[]> {
  const yearHtml = await readFile(
    new URL('../__fixtures__/wix-year.html', import.meta.url),
    'utf8',
  )
  return parseYearPage(yearHtml)
}

export function loadMemberDrafts() {
  const require = createRequire(import.meta.url)
  const { readFileSync } = require('node:fs') as typeof import('node:fs')
  return parseMembersCsv(readFileSync(new URL('../data/members.csv', import.meta.url), 'utf8'))
}
