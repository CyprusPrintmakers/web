import type { RawContent } from './types'
import settings from './fixtures/settings.json'
import home from './fixtures/home.json'
import about from './fixtures/about.json'
import contact from './fixtures/contact.json'
import membership from './fixtures/membership.json'
import support from './fixtures/support.json'
import people from './fixtures/members.json'
import projects from './fixtures/projects.json'
import news from './fixtures/news.json'

/**
 * Checked-in content so the site builds and tests run before a Sanity project
 * exists. Nothing here touches the network.
 */
export async function loadFixtures(): Promise<RawContent> {
  return {
    settings,
    home,
    about,
    contact,
    membership,
    support,
    members: people.members,
    committee: people.committee,
    projects,
    news,
  } as unknown as RawContent
}
