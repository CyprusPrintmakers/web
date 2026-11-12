import type { PortableTextBlock } from '@portabletext/types'
import type { Locale } from '../i18n/locales'
import type { IntlValue } from '../i18n/localized'
import type { ImageDoc } from '../media'

export type { ImageDoc, IntlValue }

export type RichText = PortableTextBlock[]

export type IntlRich = {
  _key: string
  language: Locale
  value: RichText
}

export type Translations = Record<Locale, boolean>

export type Seo = {
  title?: string
  description?: string
  image?: ImageDoc
}

export type SocialLink = {
  platform: string
  url: string
}

export type ContactDetails = {
  address: string[]
  phone: string
  phoneHref: string
  email: string
}

export type Link = {
  label: string
  href: string
}

export type DateRange = {
  start?: string
  end?: string
  label?: string
}

export type Partner = {
  name: string
  url?: string
  logo?: ImageDoc
}

export type TierLevel = {
  name: string
  price?: string
}

export type Tier = {
  name: IntlValue[]
  benefits?: IntlRich[]
  price?: string
  levels?: TierLevel[]
}

export type ProcessStep = {
  title: IntlValue[]
  body: IntlRich[]
}

type Entity = {
  _id: string
  slug: string
  translations: Translations
}

export type SiteSettings = Entity & {
  siteName: IntlValue[]
  contact: ContactDetails
  socialLinks: SocialLink[]
  defaultSeo: Seo
  footerNote: string
  inkEffect?: boolean
}

export type HomePage = Entity & {
  title: IntlValue[]
  currentLabel: IntlValue[]
  currentTitle: IntlValue[]
  currentHref: string
  heroBody?: IntlValue[]
  coverImage?: ImageDoc
  seo: Seo
}

export type AboutPage = Entity & {
  headline: IntlValue[]
  body: IntlRich[]
  history: IntlRich[]
  partners: Partner[]
  seo: Seo
}

export type ContactPage = Entity & {
  openingNote: IntlValue[]
  officeHours: IntlValue[]
  mapUrl?: string
  seo: Seo
}

export type MembershipPage = Entity & {
  intro: IntlValue[]
  tiers: Tier[]
  processSteps: ProcessStep[]
  formIntro: IntlValue[]
  privacyNote: IntlValue[]
  fee: string
  bankDetails: IntlValue[]
  donation: IntlValue[]
  ctaHref: string
  tiersConfirmed: boolean
  seo: Seo
}

export type MemberStatus = 'active' | 'alumni'

export type Member = Entity & {
  name: IntlValue[]
  discipline: IntlValue[]
  bio: IntlRich[]
  portrait?: ImageDoc
  email?: string
  website?: string
  instagram?: string
  joinedYear?: number
  membershipType?: string
  status: MemberStatus
  featured: boolean
  order: number
}

export type CommitteeMember = Entity & {
  name: IntlValue[]
  role: IntlValue[]
  bio?: IntlRich[]
  image?: ImageDoc
  order: number
  memberRef?: string
}

export type Project = Entity & {
  title: IntlValue[]
  summary: IntlValue[]
  body: IntlRich[]
  venue: IntlValue[]
  year: number
  coverImage?: ImageDoc
  gallery: ImageDoc[]
  participants: string[]
  dates: DateRange
  links: Link[]
  featured: boolean
}

export type NewsPost = Entity & {
  title: IntlValue[]
  excerpt: IntlValue[]
  body: IntlRich[]
  publishedAt: string
  coverImage?: ImageDoc
  relatedProject?: string
  featured: boolean
  author: string
}

export type Content = {
  settings: SiteSettings
  home: HomePage
  about: AboutPage
  contact: ContactPage
  membership: MembershipPage
  members: Member[]
  committee: CommitteeMember[]
  projects: Project[]
  news: NewsPost[]
}

export type RawOf<T extends { translations: Translations }> = Omit<
  T,
  'translations'
>

export type RawContent = {
  settings: RawOf<SiteSettings>
  home: RawOf<HomePage>
  about: RawOf<AboutPage>
  contact: RawOf<ContactPage>
  membership: RawOf<MembershipPage>
  members: RawOf<Member>[]
  committee: RawOf<CommitteeMember>[]
  projects: RawOf<Project>[]
  news: RawOf<NewsPost>[]
}

export type ContentKind =
  | 'siteSettings'
  | 'homePage'
  | 'aboutPage'
  | 'contactPage'
  | 'membershipPage'
  | 'member'
  | 'committeeMember'
  | 'project'
  | 'newsPost'

export type ContentEntity =
  | SiteSettings
  | HomePage
  | AboutPage
  | ContactPage
  | MembershipPage
  | Member
  | CommitteeMember
  | Project
  | NewsPost

export type RawContentEntity =
  | RawOf<SiteSettings>
  | RawOf<HomePage>
  | RawOf<AboutPage>
  | RawOf<ContactPage>
  | RawOf<MembershipPage>
  | RawOf<Member>
  | RawOf<CommitteeMember>
  | RawOf<Project>
  | RawOf<NewsPost>
