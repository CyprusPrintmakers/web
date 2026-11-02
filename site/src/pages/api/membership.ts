import type { APIRoute } from 'astro'
import { submitMembership } from '../../lib/forms/submit'
import { resendMailer } from '../../lib/forms/mailer'
import { parseForm, respond } from '../../lib/forms/http'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const { input, cvBase64, lang } = await parseForm(request)

  const result = await submitMembership({
    send: resendMailer(),
    now: Date.now(),
    input,
    lang,
    cvBase64,
  })

  return respond(request, result, lang, '/membership')
}
