import type { StructureResolver } from 'sanity/structure'

/**
 * Fixed document ids shared with the seed script; the Studio offers these
 * singletons through the desk only, so there is nothing to create or delete.
 */
export const SINGLETON_IDS = [
  'siteSettings',
  'homePage',
  'aboutPage',
  'contactPage',
  'membershipPage',
] as const

const SINGLETON_TITLES: Record<(typeof SINGLETON_IDS)[number], string> = {
  siteSettings: 'Site settings',
  homePage: 'Home',
  aboutPage: 'About',
  contactPage: 'Contact',
  membershipPage: 'Membership',
}

export const structure: StructureResolver = S =>
  S.list()
    .title('Cyprus Printmakers')
    .items([
      S.listItem()
        .title('Pages')
        .id('pages')
        .child(
          S.list()
            .title('Pages')
            .items(
              SINGLETON_IDS.map(id =>
                S.listItem()
                  .id(id)
                  .title(SINGLETON_TITLES[id])
                  .child(S.document().schemaType(id).documentId(id)),
              ),
            ),
        ),
      S.divider(),
      S.listItem()
        .title('People')
        .id('people')
        .child(
          S.list()
            .title('People')
            .items([
              S.documentTypeListItem('member').title('Members'),
              S.documentTypeListItem('committeeMember').title('Committee'),
            ]),
        ),
      S.divider(),
      S.documentTypeListItem('project').title('Projects'),
      S.documentTypeListItem('newsPost').title('News'),
    ])
