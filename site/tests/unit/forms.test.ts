import { describe, expect, it } from 'vitest'
import { wantsJson, validateContact, validateMembership } from '../../src/lib/forms/validate'
import type { FormInput } from '../../src/lib/forms/validate'
import { submitMembership } from '../../src/lib/forms/submit'
import type { Mail } from '../../src/lib/forms/email'

const cv = (size: number, type = 'application/pdf', name = 'cv.pdf') => ({
  name,
  type,
  size,
})

const valid: FormInput = {
  name: 'Maria Georgiou',
  email: 'maria@example.com',
  consent: true,
  tier: 'individual',
  cv: cv(1000),
}

const greekForm: FormInput = {
  ...valid,
  name: 'Μαρία Γεωργίου',
  cv: cv(1000, 'application/pdf', 'cv.pdf'),
}

describe('wantsJson', () => {
  it('detects a JSON-preferring accept header', () => {
    expect(wantsJson('application/json')).toBe(true)
    expect(wantsJson('text/html,application/xhtml+xml')).toBe(false)
    expect(wantsJson('')).toBe(false)
  })
})

describe('validateMembership', () => {
  it('reports required fields with localised messages', () => {
    const result = validateMembership(
      { name: '', email: 'x', consent: false },
      'en',
    )
    expect(result.ok).toBe(false)
    if (!result.ok && !result.silent) {
      expect(result.errors).toMatchObject({
        name: 'Enter your name',
        email: 'Enter a valid email address',
        consent: 'Please accept the privacy notice',
      })
    }
  })

  it('rejects an oversized CV', () => {
    const result = validateMembership({ ...valid, cv: cv(5_000_000) }, 'en')
    expect(result.ok).toBe(false)
    if (!result.ok && !result.silent) {
      expect(result.errors.cv).toMatch(/larger than 4 MB/)
    }
  })

  it('rejects an unsupported CV type in greek', () => {
    const result = validateMembership(
      { ...valid, cv: cv(1000, 'image/png') },
      'el',
    )
    expect(result.ok).toBe(false)
    if (!result.ok && !result.silent) {
      expect(result.errors.cv).toMatch(/PDF/)
    }
  })

  it('rejects an empty CV file', () => {
    const result = validateMembership({ ...valid, cv: cv(0) }, 'en')
    expect(result.ok).toBe(false)
    if (!result.ok && !result.silent) {
      expect(result.errors.cv).toBeTruthy()
    }
  })

  it('silently drops honeypot submissions via either field name', () => {
    expect(validateMembership({ ...valid, honeypot: 'bot' }, 'en')).toEqual({
      ok: false,
      silent: true,
    })
    expect(validateMembership({ ...valid, website: 'bot' }, 'en')).toEqual({
      ok: false,
      silent: true,
    })
  })

  it('silently drops instant submissions', () => {
    expect(validateMembership({ ...valid, renderedAt: Date.now() }, 'en')).toEqual({
      ok: false,
      silent: true,
    })
  })

  it('allows a no-JS submit without renderedAt', () => {
    const result = validateMembership({ ...valid }, 'en')
    expect(result.ok).toBe(true)
  })

  it('allows a human-paced submit', () => {
    const result = validateMembership(
      { ...valid, renderedAt: Date.now() - 10_000 },
      'en',
    )
    expect(result.ok).toBe(true)
  })
})

describe('validateContact', () => {
  it('requires name, email and message', () => {
    const result = validateContact({ name: '', email: 'x' }, 'el')
    expect(result.ok).toBe(false)
    if (!result.ok && !result.silent) {
      expect(result.errors).toMatchObject({
        name: 'Εισαγάγετε το όνομά σας',
        email: 'Εισαγάγετε μια έγκυρη διεύθυνση email',
        message: 'Εισαγάγετε μήνυμα',
      })
    }
  })

  it('accepts a valid message', () => {
    expect(
      validateContact(
        { name: 'A', email: 'a@example.com', message: 'Hello' },
        'en',
      ).ok,
    ).toBe(true)
  })
})

describe('submitMembership', () => {
  it('sends the committee mail first, then the localised applicant confirmation', async () => {
    const sent: Mail[] = []
    const result = await submitMembership({
      send: async mail => {
        sent.push(mail)
      },
      now: Date.now(),
      input: greekForm,
      lang: 'el',
    })

    expect(result.ok).toBe(true)
    expect(sent).toHaveLength(2)
    expect(sent[0].subject).toContain('[EL]')
    expect(sent[1].subject).toContain('Η αίτησή σας')
    expect(sent[0].attachments?.[0].filename).toBe('cv.pdf')
    expect(sent[1].attachments).toBeUndefined()
  })

  it('never sends when validation fails', async () => {
    const sent: Mail[] = []
    const result = await submitMembership({
      send: async mail => {
        sent.push(mail)
      },
      now: Date.now(),
      input: { name: '', email: 'x', consent: false },
      lang: 'en',
    })

    expect(result.ok).toBe(false)
    expect(sent).toHaveLength(0)
  })
})
