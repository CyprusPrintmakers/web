/**
 * Parsers for the archived Wix site (wix-archive/, fixtures in __fixtures__/).
 *
 * The live site's real shapes, recorded 2026-10-27:
 * - Dynamic project pages live at /projects/<year>; each holds one project
 *   (e.g. 2019 = "EPALE WORKSHOP"). Gallery images are Wix media references
 *   embedded in a JSON payload, not plain <img> tags.
 * - Year landing pages at /<year> list project titles as plain text — the
 *   "Read More" links on /projects-1 carry no hrefs.
 */

const MEDIA_RE = /\/media\/([0-9a-f]{6,}[a-z0-9_~]*)/g

export type ProjectDraft = {
  _id: string
  slug: string
  year: number
  title: string
  subtitle?: string
  description?: string
  images: string[]
}

export type MemberDraft = {
  _id: string
  slug: string
  name: string
  email: string
  bio?: string
  status: 'active' | 'alumni'
}

function decodeEntities(value: string): string {
  return value
    .replace(/&laquo;/g, '\u00ab')
    .replace(/&raquo;/g, '\u00bb')
    .replace(/&#8203;/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&[a-z]+;/gi, ' ')
    .trim()
}

export function mediaUrls(html: string): string[] {
  const ids = new Set<string>()
  for (const match of html.matchAll(MEDIA_RE)) {
    const id = match[1]
    // Skip tiny UI icons Wix re-serves at fixed 30px/60px sizes.
    if (id.endsWith('.wix_mp')) continue
    ids.add(`https://static.wixstatic.com/media/${id}`)
  }
  return [...ids]
}

export function parseProjectPage(html: string, url: string): ProjectDraft {
  const slug = new URL(url).pathname.split('/').filter(Boolean).pop() ?? ''
  const year = Number(slug)
  if (!/^\d{4}$/.test(slug) || Number.isNaN(year)) {
    throw new Error(`project page ${url} does not follow the recorded /projects/<year> shape`)
  }

  const headings = [...html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/g)]
    .map(m => decodeEntities(m[1].replace(/<[^>]+>/g, ' ').trim()))
    .filter(text => text !== '')
  const isQuotation = (text: string) => /^[\u00ab"']/.test(text)
  const isChrome = (text: string) =>
    /^cyprus printmakers association$|^projects$|^(home|about|members|contact|news)$/i.test(text)
  const title =
    headings.find(text => text && !/^\d{4}$/.test(text) && !isQuotation(text) && !isChrome(text)) ??
    ''

  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map(m => decodeEntities(m[1].replace(/<[^>]+>/g, ' ')))
    .filter(text => {
      if (text.length < 15 || text.includes('{') || text.includes('@keyframes')) return false
      // Navigation chrome renders as run-together caps inside <p> blocks.
      if (/^(HOME|ABOUT|MEMBERS|PROJECTS|CONTACT|EXECUTIVE)\b/.test(text)) return false
      if (/EXECUTIVE COMMITTEE/.test(text)) return false
      // Year-list nav: 2019 2018 2017 ...
      const yearTokens = text.match(/\b20\d{2}\b/g)?.length ?? 0
      if (yearTokens >= 3) return false
      // Real prose carries lowercase; run-together nav items do not.
      return /[a-z\u03b1-\u03c9]/.test(text)
    })

  return {
    _id: `project-${slug}`,
    slug,
    year,
    title,
    description: paragraphs[0],
    images: mediaUrls(html),
  }
}

export function parseYearPage(html: string): string[] {
  const text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ')
  const nodes = [...text.matchAll(/>([^<>]{10,120})</g)].map(m => decodeEntities(m[1]))

  const chrome = /^(home|about|members|projects|contact|more|news|support|2019|2018|2017|2016|2015|2014|2013|2012|2011|2010|2009|ipc|#1cy|gr|conference|information|keynote|speakers|videos|executive|committee|use tab|cyprus printmakers association|00357|cyprintmakers)/i

  const titles: string[] = []
  for (const node of nodes) {
    if (chrome.test(node)) continue
    if (/^\d{4}$/.test(node)) continue
    if (titles.some(existing => existing.toLowerCase() === node.toLowerCase())) continue
    titles.push(node)
  }
  return titles
}

const CSV_COLUMNS = ['name', 'email', 'bio', 'status'] as const

function parseCsvRecords(csv: string): string[][] {
  const records: string[][] = []
  let fields: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]

    if (quoted) {
      if (char === '"') {
        if (csv[index + 1] === '"') {
          current += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        current += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
      continue
    }

    if (char === ',') {
      fields.push(current)
      current = ''
      continue
    }

    if (char === '\n') {
      fields.push(current)
      records.push(fields)
      fields = []
      current = ''
      continue
    }

    if (char === '\r') continue

    current += char
  }

  if (current !== '' || fields.length > 0) {
    fields.push(current)
    records.push(fields)
  }

  return records.filter(record => record.some(cell => cell.trim() !== ''))
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseMembersCsv(csv: string): MemberDraft[] {
  const [header, ...rows] = parseCsvRecords(csv)
  if (header.join(',') !== CSV_COLUMNS.join(',')) {
    throw new Error(`unexpected CSV header: ${header.join(',')}`)
  }

  return rows.map(fields => {
    const [name, email, bio, status] = fields
    if (!EMAIL_RE.test(email ?? '')) {
      throw new Error(`invalid email for member "${name}": ${email}`)
    }
    const slug = (name ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    return {
      _id: `member-${slug}`,
      slug,
      name: name ?? '',
      email: email ?? '',
      bio: bio || undefined,
      status: status === 'alumni' ? 'alumni' : 'active',
    }
  })
}
