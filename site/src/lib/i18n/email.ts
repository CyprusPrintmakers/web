import type { Locale } from './locales'

/** Localised subject lines for outbound mail, kept beside the UI strings. */
export function applicantMembershipSubject(lang: Locale): string {
  return lang === 'el'
    ? 'Η αίτησή σας στην Ένωση Κυπρίων Χαρακτικών'
    : 'Your Cyprus Printmakers Association application'
}

export function applicantContactSubject(lang: Locale): string {
  return lang === 'el'
    ? 'Το μήνυμά σας στάλθηκε'
    : 'Your message has been sent'
}

export function committeeMembershipSubject(lang: Locale): string {
  const tag = lang === 'el' ? '[EL]' : '[EN]'
  return `${tag} New membership application`
}

export function committeeContactSubject(lang: Locale): string {
  const tag = lang === 'el' ? '[EL]' : '[EN]'
  return `${tag} New contact message`
}

export function committeeReplyNote(lang: Locale): string {
  return lang === 'el'
    ? 'Ο αιτών έγραψε στα ελληνικά — απαντήστε στα ελληνικά.'
    : 'The applicant wrote in English — please reply in English.'
}
