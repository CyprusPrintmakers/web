import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { internationalizedArray } from 'sanity-plugin-internationalized-array'
import { schemaTypes } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Cyprus Printmakers Association',
  // Evaluated for `astro check` even when no project exists; the Studio is
  // only built when @sanity/astro is active with a real SANITY_PROJECT_ID.
  projectId: process.env.SANITY_PROJECT_ID ?? 'project-not-configured',
  dataset: process.env.SANITY_DATASET ?? 'production',
  plugins: [
    structureTool({ structure }),
    internationalizedArray({
      languages: [
        { id: 'en', title: 'English' },
        { id: 'el', title: 'Greek' },
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string', 'text', 'portableText'],
    }),
  ],
  schema: { types: schemaTypes },
})
