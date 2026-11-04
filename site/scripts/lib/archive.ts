/**
 * Parsers for the archived Wix pages.
 *
 * Year pages: each is a sequence of `<section>` blocks; a project block is a
 * section with an `<h2>` title and one or more `<p>` paragraphs. Subtitles
 * live in `<p>`, not `<h2>`, so taking only h2s keeps "PROTECTION OF THE
 * MARINE ENVIRONMENT" attached to its RCB project instead of becoming a
 * project of its own.
 *
 * Page copy: the about and contact pages keep their content in plain `<p>`
 * blocks among the navigation and footer, so those parsers look for the
 * known sentences instead of relying on position. The committee page lists
 * each person as `<h4>Name / Greek name</h4>` followed by
 * `<h6>Role / Greek role</h6>`.
 */

import { decodeHTML } from 'entities'

export type ArchiveProject = {
  year: number
  slug: string
  title: string
  summary: string
  paragraphs: string[]
}

function decodeEntities(value: string): string {
  return value
    .replace(/&laquo;/g, '\u00ab')
    .replace(/&raquo;/g, '\u00bb')
    .replace(/&#8203;/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function textOf(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
}

/** Full entity decoding, needed for the Greek names on the committee page. */
function decodeMarkup(value: string): string {
  return decodeHTML(value.replace(/<[^>]+>/g, ' '))
    .replace(/\u200b/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function paragraphsOf(html: string): string[] {
  const withoutScripts = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  return [...withoutScripts.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .map(match => decodeMarkup(match[1]))
    .filter(text => text !== '')
}

function titleCase(value: string): string {
  const smallWords = /\b(Of|And|The|For|In|On|At|To|A|An)\b/g
  return value
    .toLowerCase()
    .replace(/(^|[\s(])([a-z])/g, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase())
    .replace(smallWords, word => word.toLowerCase())
    .replace(/\(ccfa\)/gi, '(CCFA)')
    .replace(/^([a-z])/, letter => letter.toUpperCase())
}

export type ArchiveAbout = {
  headline: string
  body: string[]
  history: string[]
}

export function parseAboutPage(html: string): ArchiveAbout {
  // The navigation and footer paragraphs are all under 100 characters; the
  // six content paragraphs are longer.
  const paragraphs = paragraphsOf(html).filter(text => text.length >= 100)
  if (paragraphs.length !== 6) {
    throw new Error(`about page: expected 6 content paragraphs, found ${paragraphs.length}`)
  }

  // The association's long name sits in its own h6 above the lead sentence.
  const headlineText = [...html.matchAll(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi)]
    .map(match => decodeMarkup(match[1]))
    .find(text => /^cypriot printmakers/i.test(text))
  if (!headlineText) throw new Error('about page: could not find the association headline')

  return {
    headline: titleCase(headlineText),
    body: paragraphs.slice(0, 3),
    history: paragraphs.slice(3),
  }
}

export type ArchiveContact = {
  openingNote: string
  address: string[]
}

export function parseContactPage(html: string): ArchiveContact {
  const paragraphs = paragraphsOf(html)

  const openingNote = paragraphs.find(text => /^the workshop is located/i.test(text))
  const addressStart = paragraphs.findIndex(text => /^aigeos\b/i.test(text))
  if (!openingNote || addressStart === -1) {
    throw new Error('contact page: could not find the workshop note or the street address')
  }

  const address = paragraphs
    .slice(addressStart, addressStart + 3)
    .join(', ')
    .split(',')
    .map(line => titleCase(line.trim()))
    .filter(Boolean)

  return { openingNote, address }
}

export type ArchiveCommitteeMember = {
  name: string
  greekName: string
  role: string
  greekRole: string
}

export function parseCommitteePage(html: string): ArchiveCommitteeMember[] {
  const withoutScripts = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  const headings = [...withoutScripts.matchAll(/<h[46]\b[^>]*>([\s\S]*?)<\/h[46]>/gi)]
    .map(match => decodeMarkup(match[1]))
    .filter(Boolean)

  const committee: ArchiveCommitteeMember[] = []
  for (let index = 0; index < headings.length - 1; index += 1) {
    const person = headings[index].match(/^(.+?) \/ (.+)$/)
    const role = headings[index + 1].match(/^(chair|vice chair|secretary|treasurer|member) \/ (.+)$/i)
    if (!person || !role) continue

    committee.push({
      name: person[1].trim(),
      greekName: person[2].trim(),
      role: titleCase(role[1]),
      greekRole: role[2].trim(),
    })
    index += 1
  }

  return committee
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const CHROME =
  /^(cyprus printmakers association|home|about|members|executive committee members|projects|contact|contact us|news|support|join the conference|information|keynote speakers|videos|follow us|subscribe|sign up|address|phone|email|top of page|bottom of page|first name|write a message|thanks for submitting!?|\d{4})$/i

const PARAGRAPH_CHROME =
  /^(top of page|bottom of page|first name|write a message|thanks for submitting!?|cyprus printmakers association|home|about|members|projects|contact|news|support)$/i

export function parseYearProjects(html: string, year: number): ArchiveProject[] {
  const withoutScripts = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  const sections = withoutScripts.split(/<section\b/i).slice(1)
  const projects: ArchiveProject[] = []
  const usedSlugs = new Set<string>()

  for (const section of sections) {
    const heading = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    if (!heading) continue

    const title = textOf(heading[1])
    if (title === '' || CHROME.test(title)) continue

    const paragraphs = [...section.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
      .map(match => textOf(match[1]))
      .filter(text => text.length > 1 && !PARAGRAPH_CHROME.test(text))

    let slug = `${slugify(title)}-${year}`
    let suffix = 2
    while (usedSlugs.has(slug)) {
      slug = `${slugify(title)}-${year}-${suffix}`
      suffix += 1
    }
    usedSlugs.add(slug)

    projects.push({
      year,
      slug,
      title,
      summary: paragraphs[0] ?? title,
      paragraphs: paragraphs.length > 0 ? paragraphs : [title],
    })
  }

  return projects
}
