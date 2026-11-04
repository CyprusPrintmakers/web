/**
 * Parser for the archived Wix year pages. Each year page is a sequence of
 * `<section>` blocks; a project block is a section with an `<h2>` title and
 * one or more `<p>` paragraphs. Subtitles live in `<p>`, not `<h2>`, so
 * taking only h2s keeps "PROTECTION OF THE MARINE ENVIRONMENT" attached to
 * its RCB project instead of becoming a project of its own.
 */

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

    const paragraphs = [...section.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
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
