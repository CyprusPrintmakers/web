import { createSchema } from 'sanity'
import { describe, expect, it } from 'vitest'
import { schemaTypes } from '../../src/sanity/schemaTypes'
import { priceGate } from '../../src/sanity/schemaTypes/objects'
import { SINGLETON_IDS } from '../../src/sanity/structure'

type SchemaField = { name: string; type: string }

type SchemaType = {
  name?: string
  type?: string
  of?: { type?: string; name?: string }[]
  fields?: SchemaField[]
}

const asSchemaType = (value: unknown) => value as SchemaType

const byName = (name: string) =>
  schemaTypes.map(asSchemaType).find(schemaType => schemaType.name === name)

function fieldNames(schemaType: SchemaType): string[] {
  return (schemaType.fields ?? []).map(field => field.name)
}

function fieldType(schemaType: SchemaType, field: string): string | undefined {
  return (schemaType.fields ?? []).find(entry => entry.name === field)?.type
}

describe('sanity schema', () => {
  it('compiles with the built-in types and reserved names intact', () => {
    expect(() => createSchema({ name: 'default', types: schemaTypes })).not.toThrow()
    expect(schemaTypes.map(schemaType => asSchemaType(schemaType).name)).not.toContain(
      'image',
    )
  })

  it('registers every document type the loader consumes', () => {
    const names = schemaTypes.map(schemaType => asSchemaType(schemaType).name)

    expect(names).toEqual(
      expect.arrayContaining([
        'siteSettings',
        'homePage',
        'aboutPage',
        'contactPage',
        'membershipPage',
        'supportPage',
        'member',
        'committeeMember',
        'project',
        'newsPost',
      ]),
    )
  })

  it('types member fields through the internationalized array plugin', () => {
    const member = byName('member')!

    expect(fieldNames(member)).toEqual(
      expect.arrayContaining([
        'name',
        'slug',
        'discipline',
        'bio',
        'portrait',
        'email',
        'status',
      ]),
    )
    expect(fieldType(member, 'name')).toBe('internationalizedArrayString')
    expect(fieldType(member, 'bio')).toBe('internationalizedArrayPortableText')
    expect(fieldType(member, 'portrait')).toBe('altImage')
    expect(fieldType(member, 'email')).toBe('string')
  })

  it('defines the portableText object type the plugin resolves against', () => {
    const portableText = byName('portableText')!

    expect(portableText.type).toBe('array')
    expect(portableText.of?.map(entry => entry.type)).toEqual(['block', 'altImage'])
  })

  it('requires alt on the non-reserved altImage object type', () => {
    const image = byName('altImage')!
    const alt = (image.fields ?? []).find(field => field.name === 'alt')

    expect(alt?.type).toBe('string')
    expect(typeof (alt as unknown as { validation?: unknown }).validation).toBe('function')
  })

  it('keeps the singleton document ids stable for the seed script', () => {
    expect(SINGLETON_IDS).toEqual([
      'siteSettings',
      'homePage',
      'aboutPage',
      'contactPage',
      'membershipPage',
      'supportPage',
    ])
  })

  it('gates tier price on tiersConfirmed', () => {
    expect(priceGate(undefined, { document: { tiersConfirmed: false } })).toBe(true)
    expect(priceGate('€50', { document: { tiersConfirmed: true } })).toBe(true)
    expect(typeof priceGate(undefined, { document: { tiersConfirmed: true } })).toBe(
      'string',
    )
    expect(priceGate('  ', { document: { tiersConfirmed: true } })).toBeTruthy()
  })
})
