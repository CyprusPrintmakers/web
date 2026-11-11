import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { internationalizedArray } from 'sanity-plugin-internationalized-array'
import { schemaTypes } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'

// Default to the production project so a plain `sanity build` (which powers
// the auto-updating Studio) works without a local .env. The embedded Astro
// Studio is only active in development.
const projectId = process.env.SANITY_PROJECT_ID ?? 'hyel0os7'

type PreviewDocument = { _type?: string; slug?: { current?: string } }

const resolvePreviewHref = ({ document }: { document?: unknown }): string => {
  const doc = document as PreviewDocument | undefined
  const slug = doc?.slug?.current
  switch (doc?._type) {
    case 'homePage':
      return '/'
    case 'aboutPage':
      return '/about'
    case 'member':
      return `/members/${slug}`
    case 'project':
      return `/projects/${slug}`
    case 'newsPost':
      return `/news/${slug}`
    default:
      return '/'
  }
}

const plugins = [
  structureTool({ structure }),
  internationalizedArray({
    languages: [
      { id: 'en', title: 'English' },
      { id: 'el', title: 'Greek' },
    ],
    defaultLanguages: ['en'],
    fieldTypes: ['string', 'text', 'portableText'],
  }),
]

// Presentation is only registered once the draft preview surface is enabled;
// until then it would open a 503 iframe and fail to connect to visual editing.
if (
  projectId &&
  process.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === 'true'
) {
  plugins.push(
    presentationTool({
      previewUrl: {
        origin: process.env.PUBLIC_SITE_URL ?? 'https://cyprintmakers.densetheory.cc',
        preview: '/preview',
      },
    }),
  )
}

export default defineConfig({
  name: 'default',
  title: 'Cyprus Printmakers Association',
  projectId,
  dataset: process.env.SANITY_DATASET ?? 'production',
  plugins,
  document: {
    productionUrl: async (_prev: string | undefined, context) => {
      const origin = process.env.PUBLIC_SITE_URL ?? 'https://cyprintmakers.densetheory.cc'
      return `${origin}/preview${resolvePreviewHref({ document: context.document })}`
    },
  },
  schema: { types: schemaTypes },
})
