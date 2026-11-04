import type { Locale } from '../i18n/locales'
import {
  applicantContactSubject,
  applicantMembershipSubject,
  committeeContactSubject,
  committeeMembershipSubject,
  committeeReplyNote,
} from '../i18n/email'
import type { FormInput } from './validate'

export type Mail = {
  to: string
  subject: string
  html: string
  attachments?: { filename: string; content: string }[]
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const row = (label: string, value: string): string =>
  `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`

const document = (title: string, body: string): string =>
  `<!doctype html><html><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`

export function buildMembershipMails(
  input: FormInput,
  lang: Locale,
  to: string,
  cvBase64 = '',
): Mail[] {
  const fields = [
    row('Name', input.name ?? ''),
    row('Email', input.email ?? ''),
    ...(input.phone ? [row('Phone', input.phone)] : []),
    ...(input.message ? [row('Why they want to join', input.message)] : []),
    ...(input.cv ? [row('CV', input.cv.name ?? 'attached')] : []),
  ].join('')

  const committee: Mail = {
    to,
    subject: committeeMembershipSubject(lang),
    html: document(
      'New membership application',
      `<table>${fields}</table><p>${committeeReplyNote(lang)}</p>`,
    ),
    attachments: input.cv
      ? [{ filename: input.cv.name || 'cv.pdf', content: cvBase64 }]
      : undefined,
  }

  const applicant: Mail = {
    to: input.email ?? '',
    subject: applicantMembershipSubject(lang),
    html: document(
      lang === 'el' ? 'Ευχαριστούμε για την αίτησή σας' : 'Thank you for your application',
      `<p>${
        lang === 'el'
          ? 'Πληροφορίες: εδώ'
          : 'We have received your application and will be in touch.'
      }</p>`,
    ),
  }

  return [committee, applicant]
}

export function buildContactMail(
  input: FormInput,
  lang: Locale,
  to: string,
): Mail[] {
  const fields = [
    row('Name', input.name ?? ''),
    row('Email', input.email ?? ''),
    ...(input.phone ? [row('Phone', input.phone)] : []),
    row('Message', input.message ?? ''),
  ].join('')

  const committee: Mail = {
    to,
    subject: committeeContactSubject(lang),
    html: document(
      'New contact message',
      `<table>${fields}</table><p>${committeeReplyNote(lang)}</p>`,
    ),
  }

  const applicant: Mail = {
    to: input.email ?? '',
    subject: applicantContactSubject(lang),
    html: document(
      lang === 'el' ? 'Το μήνυμά σας στάλθηκε' : 'Your message has been sent',
      `<p>${
        lang === 'el'
          ? 'Θα επικοινωνήσουμε μαζί σας σύντομα.'
          : 'We will get back to you soon.'
      }</p>`,
    ),
  }

  return [committee, applicant]
}
