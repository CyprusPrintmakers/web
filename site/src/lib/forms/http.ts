import { formSchema, type CvFile } from './schema'
import type { FormInput, Result } from './validate'
import { wantsJson } from './validate'
import type { Locale } from '../i18n/locales'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export type ParsedForm = {
  input: FormInput
  cvBase64: string | undefined
  lang: Locale
}

export async function parseForm(request: Request): Promise<ParsedForm> {
  const formData = await request.formData()

  const localeRaw = String(formData.get('locale') ?? 'en')
  const lang: Locale = localeRaw === 'el' ? 'el' : localeRaw === 'en' ? 'en' : 'en'

  const cvFile = formData.get('cv')
  let cv: CvFile | undefined
  let cvBase64: string | undefined
  if (cvFile instanceof File && cvFile.size > 0) {
    cv = { name: cvFile.name, type: cvFile.type, size: cvFile.size }
    cvBase64 = Buffer.from(await cvFile.arrayBuffer()).toString('base64')
  }

  const wire = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? '') || undefined,
    message: String(formData.get('message') ?? '') || undefined,
    tier: String(formData.get('tier') ?? '') || undefined,
    practice: String(formData.get('practice') ?? '') || undefined,
    consent: formData.get('consent') !== null,
    cv,
    honeypot: String(formData.get('honeypot') ?? ''),
    website: String(formData.get('website') ?? ''),
    renderedAt: String(formData.get('renderedAt') ?? '') || undefined,
  }

  // The schema is the wire contract; field-level localised errors are applied
  // by the validators in validate.ts.
  const parsed = formSchema.parse(wire)
  return { input: parsed as FormInput, cvBase64, lang }
}

const page = (lang: Locale, title: string, body: string, backHref: string): string => `
<!doctype html>
<html lang="${lang}">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body>
<main>
  <h1>${escapeHtml(title)}</h1>
  ${body}
  <p><a href="${backHref}" lang="${lang === 'el' ? 'el' : 'en'}">${lang === 'el' ? 'Επιστροφή' : 'Back'}</a></p>
</main>
</body>
</html>`

export function respond(
  request: Request,
  result: Result,
  lang: Locale,
  backHref: string,
): Response {
  const json = wantsJson(request.headers.get('accept') ?? '')

  if (result.ok || result.silent) {
    // Silent bot submissions get the same 200 as real ones — no signal.
    if (json) return Response.json({ ok: true }, { status: 200 })

    const body = `<p>${lang === 'el' ? 'Ευχαριστούμε — η υποβολή σας στάλθηκε.' : 'Thank you — your submission has been sent.'}</p>`
    return new Response(
      page(lang, lang === 'el' ? 'Ευχαριστούμε' : 'Thank you', body, backHref),
      { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
    )
  }

  if (json) return Response.json({ ok: false, errors: result.errors }, { status: 400 })

  const list = `<ul>${Object.values(result.errors)
    .map(message => `<li>${escapeHtml(message)}</li>`)
    .join('')}</ul>`
  return new Response(
    page(
      lang,
      lang === 'el' ? 'Ελέγξτε τη φόρμα' : 'Please check the form',
      list,
      backHref,
    ),
    { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } },
  )
}
