import type { APIRoute } from 'astro'
import { submitContact } from '../../lib/forms/submit'
import { resendMailer } from '../../lib/forms/mailer'
import { parseForm, respond } from '../../lib/forms/http'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const { input, lang } = await parseForm(request)

  const result = await submitContact({
    send: resendMailer(),
    now: Date.now(),
    input,
    lang,
  })

  return respond(request, result, lang, '/contact')
}
