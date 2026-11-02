import { Resend } from 'resend'
import type { Mail } from './email'

const DEFAULT_FROM = 'Cyprus Printmakers <forms@resend.dev>'

export function resendMailer(): (mail: Mail) => Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not configured')

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM
  const client = new Resend(key)

  return async mail => {
    const { error } = await client.emails.send({
      from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      ...(mail.attachments ? { attachments: mail.attachments } : {}),
    })
    if (error) throw new Error(`Resend: ${error.message}`)
  }
}