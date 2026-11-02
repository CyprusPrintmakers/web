import { defineField, defineType } from 'sanity'
import { computeTranslations } from '../../lib/content/translation'
import type { ContentKind } from '../../lib/content/types'

type PrepareSelection = Record<string, unknown>

type IntlEntry = { language?: unknown; value?: unknown }

/**
 * Must list exactly the fields `translation.ts` requires per kind — the badge
 * is computed by running the same required-field map over the preview
 * selection, so a missing select key would show a false ✗.
 */
const PREVIEW_SELECT: Record<ContentKind, Record<string, string>> = {
  siteSettings: { siteName: 'siteName' },
  homePage: {
    title: 'title',
    currentLabel: 'currentLabel',
    currentTitle: 'currentTitle',
  },
  aboutPage: { headline: 'headline', body: 'body', history: 'history' },
  contactPage: { openingNote: 'openingNote', officeHours: 'officeHours' },
  membershipPage: {
    intro: 'intro',
    formIntro: 'formIntro',
    privacyNote: 'privacyNote',
    tiers: 'tiers',
    processSteps: 'processSteps',
  },
  supportPage: { intro: 'intro', notes: 'notes', tiers: 'tiers' },
  member: { name: 'name', discipline: 'discipline', bio: 'bio' },
  committeeMember: { name: 'name', role: 'role', bio: 'bio' },
  project: { title: 'title', summary: 'summary', body: 'body', venue: 'venue' },
  newsPost: { title: 'title', excerpt: 'excerpt', body: 'body' },
}

const PREVIEW_TITLE_FIELD: Partial<Record<ContentKind, string>> = {
  siteSettings: 'siteName',
  homePage: 'title',
  aboutPage: 'headline',
  member: 'name',
  committeeMember: 'name',
  project: 'title',
  newsPost: 'title',
}

const PREVIEW_FALLBACK: Record<ContentKind, string> = {
  siteSettings: 'Site settings',
  homePage: 'Home',
  aboutPage: 'About',
  contactPage: 'Contact',
  membershipPage: 'Membership',
  supportPage: 'Support',
  member: 'Member',
  committeeMember: 'Committee member',
  project: 'Project',
  newsPost: 'News post',
}

function isNonEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== ''
  return Array.isArray(value) && value.length > 0
}

function localizedTitle(values: unknown, fallback: string): string {
  if (!Array.isArray(values)) return fallback

  const entries = values.filter(
    (entry): entry is IntlEntry => typeof entry === 'object' && entry !== null,
  )
  const english = entries.find(entry => entry.language === 'en' && isNonEmpty(entry.value))
  const any = entries.find(entry => isNonEmpty(entry.value))
  const value = english?.value ?? any?.value

  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

/**
 * Collection views show the same completeness signal the build enforces:
 * `EN ✓ EL ✗` straight out of translation.ts's required-field map.
 */
function preview(kind: ContentKind) {
  return (selection: PrepareSelection) => {
    const titleField = PREVIEW_TITLE_FIELD[kind]

    const translations = computeTranslations(selection, kind)

    return {
      title: titleField
        ? localizedTitle(selection[titleField], PREVIEW_FALLBACK[kind])
        : PREVIEW_FALLBACK[kind],
      subtitle: `EN ${translations.en ? '✓' : '✗'} EL ${translations.el ? '✓' : '✗'}`,
    }
  }
}

function slugField() {
  return defineField({
    name: 'slug',
    title: 'Slug',
    type: 'slug',
    description:
      'Used in URLs. Uniqueness is enforced by the seed and import scripts through deterministic document ids.',
    validation: Rule => Rule.required(),
  })
}

const seoField = () => defineField({ name: 'seo', title: 'SEO', type: 'seo' })

const tiersField = () =>
  defineField({
    name: 'tiers',
    title: 'Tiers',
    type: 'array',
    of: [{ type: 'tier' }],
  })

export default [
  defineType({
    name: 'siteSettings',
    title: 'Site settings',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'siteName',
        title: 'Site name',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'contact',
        title: 'Contact details',
        type: 'contactDetails',
      }),
      defineField({
        name: 'socialLinks',
        title: 'Social links',
        type: 'array',
        of: [{ type: 'socialLink' }],
      }),
      defineField({
        name: 'defaultSeo',
        title: 'Default SEO',
        type: 'seo',
      }),
      defineField({
        name: 'footerNote',
        title: 'Footer note',
        type: 'string',
      }),
    ],
    preview: {
      select: PREVIEW_SELECT.siteSettings,
      prepare: preview('siteSettings'),
    },
  }),
  defineType({
    name: 'homePage',
    title: 'Home page',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'title',
        title: 'Title',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'currentLabel',
        title: 'Current label',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'currentTitle',
        title: 'Current title',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'currentHref',
        title: 'Current link',
        type: 'string',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'coverImage',
        title: 'Cover image',
        type: 'altImage',
      }),
      seoField(),
    ],
    preview: {
      select: PREVIEW_SELECT.homePage,
      prepare: preview('homePage'),
    },
  }),
  defineType({
    name: 'aboutPage',
    title: 'About page',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'headline',
        title: 'Headline',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'body',
        title: 'Body',
        type: 'internationalizedArrayPortableText',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'history',
        title: 'History',
        type: 'internationalizedArrayPortableText',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'partners',
        title: 'Partners',
        type: 'array',
        of: [{ type: 'partner' }],
      }),
      seoField(),
    ],
    preview: {
      select: PREVIEW_SELECT.aboutPage,
      prepare: preview('aboutPage'),
    },
  }),
  defineType({
    name: 'contactPage',
    title: 'Contact page',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'openingNote',
        title: 'Opening note',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'officeHours',
        title: 'Office hours',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'mapUrl',
        title: 'Map URL',
        type: 'url',
      }),
      seoField(),
    ],
    preview: {
      select: PREVIEW_SELECT.contactPage,
      prepare: preview('contactPage'),
    },
  }),
  defineType({
    name: 'membershipPage',
    title: 'Membership page',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'intro',
        title: 'Intro',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      tiersField(),
      defineField({
        name: 'processSteps',
        title: 'Process steps',
        type: 'array',
        of: [{ type: 'processStep' }],
      }),
      defineField({
        name: 'formIntro',
        title: 'Form intro',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'privacyNote',
        title: 'Privacy note',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'ctaHref',
        title: 'Call-to-action link',
        type: 'string',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'tiersConfirmed',
        title: 'Fees confirmed',
        type: 'boolean',
        description:
          'When false, tier prices stay hidden on the site and remain optional here.',
        initialValue: false,
      }),
      seoField(),
    ],
    preview: {
      select: PREVIEW_SELECT.membershipPage,
      prepare: preview('membershipPage'),
    },
  }),
  defineType({
    name: 'supportPage',
    title: 'Support page',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'intro',
        title: 'Intro',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      tiersField(),
      defineField({
        name: 'notes',
        title: 'Notes',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'tiersConfirmed',
        title: 'Fees confirmed',
        type: 'boolean',
        description:
          'When false, tier prices stay hidden on the site and remain optional here.',
        initialValue: false,
      }),
      seoField(),
    ],
    preview: {
      select: PREVIEW_SELECT.supportPage,
      prepare: preview('supportPage'),
    },
  }),
  defineType({
    name: 'member',
    title: 'Member',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'name',
        title: 'Name',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'discipline',
        title: 'Discipline',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'bio',
        title: 'Bio',
        type: 'internationalizedArrayPortableText',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'portrait',
        title: 'Portrait',
        type: 'altImage',
      }),
      defineField({
        name: 'email',
        title: 'Email',
        type: 'string',
        validation: Rule => Rule.email(),
      }),
      defineField({
        name: 'website',
        title: 'Website',
        type: 'url',
      }),
      defineField({
        name: 'instagram',
        title: 'Instagram handle',
        type: 'string',
      }),
      defineField({
        name: 'joinedYear',
        title: 'Joined year',
        type: 'number',
        validation: Rule => Rule.integer().min(1990).max(2100),
      }),
      defineField({
        name: 'membershipType',
        title: 'Membership type',
        type: 'string',
      }),
      defineField({
        name: 'status',
        title: 'Status',
        type: 'string',
        options: {
          list: [
            { title: 'Active', value: 'active' },
            { title: 'Alumni', value: 'alumni' },
          ],
          layout: 'radio',
        },
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'featured',
        title: 'Featured',
        type: 'boolean',
        initialValue: false,
      }),
      defineField({
        name: 'order',
        title: 'Sort order',
        type: 'number',
        validation: Rule => Rule.integer().required(),
      }),
    ],
    preview: {
      select: PREVIEW_SELECT.member,
      prepare: preview('member'),
    },
  }),
  defineType({
    name: 'committeeMember',
    title: 'Committee member',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'name',
        title: 'Name',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'role',
        title: 'Role',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'bio',
        title: 'Bio',
        type: 'internationalizedArrayPortableText',
      }),
      defineField({
        name: 'image',
        title: 'Image',
        type: 'altImage',
      }),
      defineField({
        name: 'order',
        title: 'Sort order',
        type: 'number',
        validation: Rule => Rule.integer().required(),
      }),
      defineField({
        name: 'memberRef',
        title: 'Linked member slug',
        type: 'string',
        description: 'Slug of the member page this committee entry belongs to.',
      }),
    ],
    preview: {
      select: PREVIEW_SELECT.committeeMember,
      prepare: preview('committeeMember'),
    },
  }),
  defineType({
    name: 'project',
    title: 'Project',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'title',
        title: 'Title',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'summary',
        title: 'Summary',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'body',
        title: 'Body',
        type: 'internationalizedArrayPortableText',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'venue',
        title: 'Venue',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'year',
        title: 'Year',
        type: 'number',
        validation: Rule => Rule.integer().required().min(1990).max(2100),
      }),
      defineField({
        name: 'coverImage',
        title: 'Cover image',
        type: 'altImage',
      }),
      defineField({
        name: 'gallery',
        title: 'Gallery',
        type: 'array',
        of: [{ type: 'altImage' }],
      }),
      defineField({
        name: 'participants',
        title: 'Participants',
        type: 'array',
        of: [{ type: 'string' }],
      }),
      defineField({
        name: 'dates',
        title: 'Dates',
        type: 'dateRange',
      }),
      defineField({
        name: 'links',
        title: 'Links',
        type: 'array',
        of: [{ type: 'link' }],
      }),
    ],
    preview: {
      select: PREVIEW_SELECT.project,
      prepare: preview('project'),
    },
  }),
  defineType({
    name: 'newsPost',
    title: 'News post',
    type: 'document',
    fields: [
      slugField(),
      defineField({
        name: 'title',
        title: 'Title',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'excerpt',
        title: 'Excerpt',
        type: 'internationalizedArrayString',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'body',
        title: 'Body',
        type: 'internationalizedArrayPortableText',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'publishedAt',
        title: 'Published at',
        type: 'datetime',
        validation: Rule => Rule.required(),
      }),
      defineField({
        name: 'coverImage',
        title: 'Cover image',
        type: 'altImage',
      }),
      defineField({
        name: 'relatedProject',
        title: 'Related project slug',
        type: 'string',
        description: 'Slug of the project this post is about.',
      }),
      defineField({
        name: 'featured',
        title: 'Featured',
        type: 'boolean',
        initialValue: false,
      }),
      defineField({
        name: 'author',
        title: 'Author',
        type: 'string',
      }),
    ],
    preview: {
      select: PREVIEW_SELECT.newsPost,
      prepare: preview('newsPost'),
    },
  }),
]
