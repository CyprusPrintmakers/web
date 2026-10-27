import { pickLocalized } from '../i18n/localized'
import type { Locale } from '../i18n/locales'
import type { Member } from '../content/types'

/**
 * Case-, accent- and final-sigma-insensitive fold: `ς` and `σ` must match,
 * since Greek surnames end in ς but searches are typed with σ.
 */
function foldCase(value: string, lang: Locale): string {
  return value
    .toLocaleLowerCase(lang)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ς/g, 'σ')
}

function matches(haystack: string, needle: string, lang: Locale): boolean {
  if (needle === '') return true
  return foldCase(haystack, lang).includes(foldCase(needle, lang))
}

/** The last whitespace-separated word of the localised name. */
export function surname(localizedName: string): string {
  const parts = localizedName.trim().split(/\s+/)
  return parts[parts.length - 1] ?? ''
}

export function filterMembers(
  members: Member[],
  query: string,
  letter: string | null,
  lang: Locale,
): Member[] {
  return members.filter(member => {
    const name = pickLocalized(member.name, lang).text
    const discipline = pickLocalized(member.discipline, lang).text
    const surnameLetter = surname(name).charAt(0)

    if (letter !== null && surnameLetter.localeCompare(letter, lang, { sensitivity: 'base' }) !== 0)
      return false

    return matches(`${name} ${discipline}`, query.trim(), lang)
  })
}

export function groupByLetter(members: Member[], lang: Locale): Map<string, Member[]> {
  const groups = new Map<string, Member[]>()

  for (const member of members) {
    const name = pickLocalized(member.name, lang).text
    const letter = surname(name).charAt(0).toLocaleUpperCase(lang)
    const bucket = groups.get(letter)
    if (bucket) bucket.push(member)
    else groups.set(letter, [member])
  }

  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, lang))
  return new Map(sorted)
}
