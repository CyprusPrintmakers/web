import { defineField, defineType } from 'sanity'

/**
 * Sanity custom validators receive the root document, so a field nested inside
 * `tiers` can still read `tiersConfirmed`. Exported for unit tests.
 */
export type PriceGateContext = {
  document?: { tiersConfirmed?: unknown } | undefined
}

export function priceGate(
  value: string | undefined,
  context: PriceGateContext,
): true | string {
  if (!context.document?.tiersConfirmed) return true

  return typeof value === 'string' && value.trim() !== ''
    ? true
    : 'The fees are confirmed, so this tier needs a price'
}

export default [
  defineType({
    name: 'altImage',
    title: 'Image',
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        title: 'Alternative text',
        type: 'string',
        description: 'Describe what the image shows, for screen readers.',
        validation: Rule => Rule.required(),
      }),
    ],
  }),
  defineType({
    name: 'portableText',
    title: 'Portable text',
    type: 'array',
    of: [{ type: 'block' }, { type: 'altImage' }],
  }),
  defineType({
    name: 'seo',
    title: 'SEO',
    type: 'object',
    fields: [
      defineField({ name: 'title', title: 'Meta title', type: 'string' }),
      defineField({ name: 'description', title: 'Meta description', type: 'text', rows: 2 }),
      defineField({ name: 'image', title: 'Social card image', type: 'altImage' }),
    ],
  }),
  defineType({
    name: 'socialLink',
    title: 'Social link',
    type: 'object',
    fields: [
      defineField({
        name: 'platform',
        title: 'Platform',
        type: 'string',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'url',
        title: 'URL',
        type: 'url',
        validation: Rule => Rule.required(),
      }),
    ],
  }),
  defineType({
    name: 'contactDetails',
    title: 'Contact details',
    type: 'object',
    fields: [
      defineField({
        name: 'address',
        title: 'Postal address',
        type: 'array',
        of: [{ type: 'string' }],
        validation: Rule => Rule.required().min(1),
      }),
      defineField({
        name: 'phone',
        title: 'Phone (display)',
        type: 'string',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'phoneHref',
        title: 'Phone link',
        type: 'string',
        description: 'Starts with tel: so the site can link to it.',
        validation: Rule => Rule.required().regex(/^tel:/),
      }),
      defineField({
        name: 'email',
        title: 'Email',
        type: 'string',
        validation: Rule => Rule.required().email(),
      }),
    ],
  }),
  defineType({
    name: 'partner',
    title: 'Partner',
    type: 'object',
    fields: [
      defineField({
        name: 'name',
        title: 'Name',
        type: 'string',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'url',
        title: 'URL',
        type: 'url',
      }),
      defineField({ name: 'logo', title: 'Logo', type: 'altImage' }),
    ],
  }),
  defineType({
    name: 'tier',
    title: 'Tier',
    type: 'object',
    fields: [
      defineField({
        name: 'name',
        title: 'Name',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'benefits',
        title: 'Benefits',
        type: 'internationalizedArrayPortableText',
      }),
      defineField({
        name: 'price',
        title: 'Price',
        type: 'string',
        description:
          'Only required once the fees are confirmed; hidden on the site until then.',
        validation: Rule => Rule.custom((value, context) => priceGate(value, context as PriceGateContext)),
      }),
      defineField({
        name: 'levels',
        title: 'Levels',
        type: 'array',
        of: [{ type: 'tierLevel' }],
      }),
    ],
  }),
  defineType({
    name: 'tierLevel',
    title: 'Tier level',
    type: 'object',
    fields: [
      defineField({
        name: 'name',
        title: 'Name',
        type: 'string',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'price',
        title: 'Price',
        type: 'string',
        validation: Rule => Rule.custom((value, context) => priceGate(value, context as PriceGateContext)),
      }),
    ],
  }),
  defineType({
    name: 'processStep',
    title: 'Process step',
    type: 'object',
    fields: [
      defineField({
        name: 'title',
        title: 'Title',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'body',
        title: 'Body',
        type: 'internationalizedArrayPortableText',
        validation: Rule => Rule.required(),
      }),
    ],
  }),
  defineType({
    name: 'dateRange',
    title: 'Dates',
    type: 'object',
    fields: [
      defineField({ name: 'start', title: 'Start', type: 'date' }),
      defineField({ name: 'end', title: 'End', type: 'date' }),
      defineField({ name: 'label', title: 'Label', type: 'string' }),
    ],
  }),
  defineType({
    name: 'link',
    title: 'Link',
    type: 'object',
    fields: [
      defineField({
        name: 'label',
        title: 'Label',
        type: 'string',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'href',
        title: 'URL',
        type: 'string',
        validation: Rule => Rule.required(),
      }),
    ],
  }),
]
