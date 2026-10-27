import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { internationalizedArray } from 'sanity-plugin-internationalized-array'
import { schemaTypes } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'

// Evaluated for `astro check` even when no project exists; the Studio is
// only built when @sanity/astro is active with a real SANITY_PROJECT_ID.
const projectId = process.env.SANITY_PROJECT_ID ?? 'project-not-configured'

const resolvePreviewHref = ({ document }): string => {
  const slug = document?.slug?.current
  switch (document?._type) {
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

// The Presentation tool only makes sense with a live project backing it.
if (process.env.SANITY_PROJECT_ID) {
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
    productionUrl: async (context) => {
      const { document } = context
      const origin = process.env.PUBLIC_SITE_URL ?? 'https://cyprintmakers.densetheory.cc'
      return `${origin}/preview${resolvePreviewHref({ document })}`
    },
  },
  schema: { types: schemaTypes },
})
