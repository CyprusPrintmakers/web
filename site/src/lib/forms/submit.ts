import { buildContactMail, buildMembershipMails, type Mail } from './email'
import { validateContact, validateMembership, type FormInput, type Result } from './validate'
import type { Locale } from '../i18n/locales'

export type Mailer = (mail: Mail) => Promise<void>

export type SubmitDeps = {
  send: Mailer
  now: number
  input: FormInput
  lang: Locale
  cvBase64?: string
  /** Committee inbox; defaults to $MEMBERSHIP_TO_EMAIL / $CONTACT_TO_EMAIL. */
  to?: string
}

/**
 * The committee mail is the receipt that matters; the applicant confirmation is
 * a courtesy. Resend's test sender rejects arbitrary recipients, so a failed
 * confirmation must not turn a delivered submission into an error.
 */
async function deliver(send: Mailer, mails: Mail[]): Promise<void> {
  const [primary, ...confirmations] = mails
  await send(primary)

  for (const mail of confirmations) {
    try {
      await send(mail)
    } catch (error) {
      console.error('[forms] confirmation email failed', error)
    }
  }
}

function committeeInbox(deps: SubmitDeps, kind: 'membership' | 'contact'): string {
  if (deps.to !== undefined) return deps.to
  const env =
    kind === 'membership'
      ? process.env.MEMBERSHIP_TO_EMAIL
      : process.env.CONTACT_TO_EMAIL
  return env ?? ''
}

export async function submitMembership(deps: SubmitDeps): Promise<Result> {
  const result = validateMembership(deps.input, deps.lang, deps.now)
  if (!result.ok) return result

  const mails = buildMembershipMails(
    deps.input,
    deps.lang,
    committeeInbox(deps, 'membership'),
    deps.cvBase64,
  )
  await deliver(deps.send, mails)

  return { ok: true }
}

export async function submitContact(deps: SubmitDeps): Promise<Result> {
  const result = validateContact(deps.input, deps.lang, deps.now)
  if (!result.ok) return result

  const mails = buildContactMail(deps.input, deps.lang, committeeInbox(deps, 'contact'))
  await deliver(deps.send, mails)

  return { ok: true }
}
