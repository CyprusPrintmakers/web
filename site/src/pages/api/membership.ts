import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { submitMembership } from '../../lib/forms/submit'
import type { Mail } from '../../lib/forms/email'
import { parseForm, respond } from '../../lib/forms/http'

export const prerender = false

function mailer(): (mail: Mail) => Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  const client = new Resend(key)
  return async mail => {
    const { error } = await client.emails.send({
      from: 'Cyprus Printmakers <forms@resend.dev>',
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      attachments: mail.attachments,
    })
    if (error) throw new Error(`Resend: ${error.message}`)
  }
}

export const POST: APIRoute = async ({ request }) => {
  const { input, cvBase64, lang } = await parseForm(request)

  const result = await submitMembership({
    send: mailer(),
    now: Date.now(),
    input,
    lang,
    cvBase64,
  })

  return respond(request, result, lang, '/membership')
}
