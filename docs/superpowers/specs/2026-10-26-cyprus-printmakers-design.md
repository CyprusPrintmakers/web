# Cyprus Printmakers Association — Website Design

**Date:** 2026-10-26
**Status:** draft v4 — approved questions settled, bilingual build scoped
**Delivery target:** `https://cyprintmakers.densetheory.cc` (staging)
**Production:** `https://www.cyprintmakers.com` — deferred to a separate phase after sign-off
**Languages:** English and Greek, both at launch
**Chosen approach:** Astro (static) + Sanity (hosted headless CMS) on Vercel

> **Revision note (v4).** The committee wants **English and Greek at launch**, not English only. That changes the route structure, the content model, the form handling, the QA pass and the content volume — §6 has the localisation design. Using `sanity-plugin-internationalized-array` field-level translation keeps images and facts shared and only duplicates prose. **"Adhere to the Figma wireframes as closely as possible"** is now an explicit rule (§10), with a deviations log so any departure is deliberate and reviewable. Account default confirmed: projects start under the developer's accounts and transfer to the association later.
>
> **Revision note (v3).** (1) The build ships to `densetheory.cc` staging; production is later and the Wix site is untouched. (2) Membership and sponsorship tiers are real but their values are placeholders. (3) The 2009–2019 archive and its detail pages are in scope. (4) GitHub is owned by the association.
>
> **Revision note (v2).** `cyprintmakers.com` is not a placeholder: it is a live Wix site with 26 pages, 11 project URLs, a conference microsite, a contact form, and real content. Parts of the Figma mockups reuse copy and pricing from another organisation (`phytorio`).

---

## 1. Intent

Build the association's new website from the Figma mockups in `0. Mockups` and ship it to the existing staging address, `https://cyprintmakers.densetheory.cc`. The site is built to be the eventual replacement for `www.cyprintmakers.com`, but nothing about the live Wix site, its DNS or its email changes during this phase.

The site has to do four jobs:

1. **Present the association** — who it is, its history, its committee.
2. **Publish work** — member directory, project/exhibition archive, news.
3. **Recruit members** — explain membership and sponsorship, and accept applications.
4. **Preserve the archive** — the 2009–2019 projects and their detail pages, carried over from the current site.

A volunteer committee with no developer on staff must be able to update news, members, projects and page copy in a browser, in either language, without paying a platform fee.

The whole site exists twice: English and Greek. Both are first-class at launch, not a later phase, and neither is a machine translation of the other.

### Why now

The Wix site was last meaningfully updated in 2023–2024, carries a 2017 conference microsite in its main navigation, and no longer matches the identity in the mockups. The mockups are finished enough to build from, and the association already owns the domain and the staging host. Building on staging first means the committee can review and edit real content for as long as it takes, with no risk to the live site.

---

## 2. Goals

- A faithful implementation of the desktop mockups: white paper, Geologica, black rules, pill controls, prints as the only colour. Where the mockup has no answer — hover, focus, a language switcher — the closest-neighbour choice is made and logged (§10).
- English and Greek at launch, each with real URLs, `lang`, and `hreflang`.
- Mobile designed properly from the desktop composition (the mobile exports are broken; §10).
- Committee members can add/edit news, members, projects and key page text through a browser.
- Publishing is fast: save in the CMS → rebuild → live in ~1–2 minutes.
- The 2009–2019 project archive survives, with its detail pages.
- Zero recurring software cost: Sanity non-profit plan, Vercel Hobby, Resend Free.
- Static HTML, responsive images, semantic markup, WCAG AA.
- Staging is clearly staging: noindex, a visible environment badge, and no placeholder price presented as a real price.

## 3. Non-goals

- No e-commerce, print sales, donations or payment processing. The PayPal block in the Support mockup belongs to another organisation and is out of scope (§12 assumed 2).
- No production cutover, DNS change or Wix cancellation in this phase (§13 is a later phase).
- No member accounts, login or gated content.
- No site-wide search (members and projects get filters).
- No newsletter/mailing-list system.
- No page builder or drag-and-drop layout editing.
- No analytics dashboard or third-party tracking at launch.
- No third language, no automatic machine translation, no per-language versioning of the design.

## 4. Anti-goals

- The committee cannot publish a news post without a developer.
- Member emails, CVs or application data become publicly readable.
- A live URL, ranking or email address is lost at cutover.
- The staging site changes or breaks the live Wix site.
- A placeholder tier price is read as the real fee.
- Greek is visibly second-class: stub pages, English paragraphs sitting under Greek headings with no marking, or a layout that breaks on longer Greek strings.
- The design drifts into generic cards/shadows/gradients that contradict the mockups.
- A layout "improvement" silently departs from the mockup with no record of why.
- Copy borrowed from another organisation ships as if it were the association's.
- The site depends on one volunteer's laptop or an unmaintained server.

---

## 5. Approaches considered

| Approach | Editor experience | Cost | Why not chosen |
|---|---|---|---|
| **A. Astro + Sanity** *(chosen)* | Structured forms + live preview with click-to-edit | €0 on the non-profit plan | — |
| B. Astro/Hugo + Decap or Tina | Form-based, Git commits | €0 | OAuth proxy, weaker preview, no roles, noisy history |
| C. Webflow Premium | True canvas editing | ~€25–40/mo | Recurring cost, custom filtering hacks, CV workaround, lock-in |
| D. Instatic (self-hosted) | True canvas editing, static HTML output | ~€5–7/mo | v0.0.x, you run the box, no localisation, file inputs discard the file, no submission emails |

**Why A won:** it keeps the existing Vercel deployment model, the design is bespoke enough that a canvas editor would mostly rebuild the same CSS, and Sanity's **non-profit plan** removes the two objections that mattered — it is free, and it provides Editor/Contributor roles plus private datasets.

**Localisation is the second reason.** Sanity lets one document hold English and Greek prose side by side while images, dates and facts stay shared, so a member's portrait is uploaded once. Webflow charges for localisation on top of the site plan and its copy is tuned for template layouts; Decap/Tina would mean parallel file trees and two commits per edit.

**Caveat found in review:** on Sanity **Free**, the only roles are Administrator and Viewer. Every committee editor would be a full Administrator (can delete content, manage tokens). Free datasets are also public. The non-profit plan is therefore not a nice-to-have; it is a prerequisite for safe multi-editor use. Apply early (§6).

**Why not D:** Instatic remains the fallback if Sanity's editing experience disappoints. It lost on maturity, hosting burden, localisation, and — decisively — its file input collects only the filename, so the CV upload needs custom work anyway.

---

## 6. Architecture

```text
Figma mockups ──► design tokens ──► Astro components
                                        │
Sanity Content Lake ──GROQ──► Astro build ──► static HTML/CSS/JS ──► Vercel CDN
       ▲                                                            │
       │                                                            │
  Sanity Studio (/admin) ◄── Presentation preview ◄── SSR preview route
       │
       └── publish webhook ──► Vercel Deploy Hook ──► rebuild
```

- **Astro 7** (`astro@^7.4`), TypeScript, `output: 'static'`. Every public page prerendered.
- **`@astrojs/vercel`** adapter for three non-prerendered routes: draft preview, membership handler, contact handler.
- **Sanity** as the content source, queried at build time with GROQ.
- **Sanity Studio** embedded at `/admin` via `@sanity/astro` (`studioBasePath: '/admin'`).
- **Publishing:** Sanity webhook → Vercel Deploy Hook → rebuild.
- **Preview:** one SSR route (`/preview/[...slug]`) renders drafts using a read token and stega; the Studio's Presentation tool points at it. The public site is never rendered with drafts.
- **Images:** Sanity CDN via `@sanity/image-url`, hotspot/crop, responsive `srcset`.
- **Styling:** plain CSS with custom properties, scoped in `.astro` components. No Tailwind.
- **Client JS:** vanilla, only for filters and form validation. Target < 30 KB.

### Localisation

**URLs.** English is the default locale and sits unprefixed; Greek is prefixed:

| English | Greek |
|---|---|
| `/` | `/el` |
| `/members` | `/el/members` |
| `/members/[slug]` | `/el/members/[slug]` |
| …every route in §8 | …`/el` + the same path |

`/el` redirects to `/el/`. Astro's built-in i18n routing (`defaultLocale: 'en'`, `locales: ['en','el']`, `prefixDefaultLocale: false`) drives the link helpers; the pages themselves are mirrored under `src/pages/` and `src/pages/[lang]/` and share components, so a design change lands in both languages at once.

**Head and switching.** Every page emits `<html lang>` matching its locale, a self-referencing canonical, and `hreflang` alternates plus `x-default` pointing at the English URL. The language switcher is a small addition to the nav row — the only new element the mockup does not contain (§10) — linking to the equivalent page in the other language, or to that language's home when the page is untranslated.

**Content.** Translation is field-level, not document-level, using `sanity-plugin-internationalized-array` (`internationalizedArrayString`, `internationalizedArrayText`, `internationalizedArrayPortableText`). One document per entity, so a member's portrait, a project's gallery, dates, slugs, prices and contact facts are stored once; only prose is duplicated. The alternative — one document per language — would duplicate every image upload and double the Studio paperwork for a volunteer committee.

**Fallback rule.** If a Greek prose field is empty:

- the page still renders at its Greek URL, with the English text shown inside a `lang="en"` element so screen readers announce the language switch;
- the page carries `noindex` until every required Greek field is filled;
- the Studio shows a warning on the Greek field, and the editor list marks the document "EN only" rather than hiding it.

This is deliberate. A 404 is worse for a Greek visitor than English text, and silently serving English as if it were Greek is worse still.

**Strings and formatting.** Interface strings (nav, buttons, form labels, validation messages, email copy) live in `src/i18n/en.ts` and `src/i18n/el.ts`, not in the CMS — they are code, and translating them is a commit. Dates use `Intl.DateTimeFormat` with `en-GB` and `el-CY`.

**Type.** Geologica ships a Greek subset, so there is no second typeface. Self-host `latin` and `greek` subsets at 400 with `unicode-range`, and the browser downloads only the one it needs.

**Length.** Greek runs longer than English, most visibly in nav labels, buttons and tier names. The layout accepts wrapping in the nav row rather than shrinking type or dropping items; there is no Greek reference in Figma, so Greek is composed within the same system.

### Sanity plan

| | Free | Non-profit (apply) |
|---|---|---|
| Cost | €0 | €0 within quotas |
| Roles | Administrator, Viewer | Administrator, Editor, Contributor, Viewer |
| Datasets | 2, public only | 3, private allowed |
| Seats | 20 | 25 |
| Webhooks | 2 | 4 |
| Comments/tasks | — | included |

Apply with the project ID after the Sanity project exists; decision in up to 14 business days. Build on Free in the meantime, storing no private data.

**If it is slow or denied:** the build does not block. On Free, the developer holds the only Administrator seat and committee access waits; member emails stay out of the dataset, so the directory ships without them until approval. If it is denied outright, the fallback is one paid Growth seat (~€15/mo) shared by the editors who need write access, or a single shared admin login with the risk accepted. Either way the cost assumption moves from €0 to at most ~€15/mo, and the committee decides which.

### Repository and environments

| Environment | URL | Purpose |
|---|---|---|
| Local | `localhost:4321` | development |
| Preview | `*.vercel.app` per branch | review of each change |
| **Staging (this phase's target)** | `cyprintmakers.densetheory.cc` | committee review, real content entry, editing training |
| Production (later phase) | `www.cyprintmakers.com` | cutover only after sign-off (§13) |

- New site lives in `site/` at the repo root; `Cyprus-Printmakers-Website/` stays untouched as the current staging placeholder until the new site replaces it.
- **Repo of record is this repository**, with a new GitHub repo under the association and the developer as collaborator. It currently has no remote and no commits.
- **The 1.8 GB of exports in `0. Mockups/` are not committed.** They are design source, not site source, and would bloat every clone. `.gitignore` covers `0. Mockups/` and the nested `Cyprus-Printmakers-Website/` checkout; the exports stay local and get one backup copy elsewhere. The eight desktop exports worth keeping as reference are re-exported as flat images into `docs/` if they are needed later.
- New Vercel project (`cyprus-printmakers-site`), root directory `site`.
- **The live Wix site, its DNS, its MX records and its email are not touched in this phase.** No redirects are deployed to `cyprintmakers.com`, and no nameserver changes are made.
- `densetheory.cc` is already on Vercel DNS, which makes it usable as the Resend sending domain for application and contact email during staging. At cutover the sending domain moves to `cyprintmakers.com` (§13).
- Staging is `noindex, nofollow`, behind `robots.txt` disallow, with a discreet "staging" marker in the footer so nobody mistakes it for the live site or forwards a placeholder price as real.

**Domain handover.** `cyprintmakers.densetheory.cc` currently points at the old `cyprus-printmakers` Vercel project, which serves the placeholder. Vercel will not attach one domain to two projects, so the switch is: remove the domain from the old project, add it to `cyprus-printmakers-site`, wait for TLS. That is a few minutes of downtime on a placeholder page nobody is linking to — done once, at the point the new site is good enough to look at. The old project stays intact and can have the domain back in the same few minutes if anything is wrong.


---

## 7. Content model

One dataset (`production`). Singletons locked to one document. **Prose fields are translated; facts and media are not.** Slugs are shared between languages — the locale prefix distinguishes the URL, which avoids maintaining two slug maps and two redirect tables at cutover.

### Singletons

| Type | Shared fields | Translated (EN / EL) |
|---|---|---|
| `siteSettings` | contact (address, phone, email), social links, default SEO, footer note | site name |
| `homePage` | current-exhibition href, optional cover image, SEO | current-exhibition label and title |
| `aboutPage` | partners[] (name, logo, url) | headline, body, history |
| `contactPage` | map link | opening note, office hours |
| `membershipPage` | tiers[].price, `tiersConfirmed`, cta href, SEO | intro, tier names and benefits, process steps, form copy, privacy note |
| `supportPage` | tiers[].price, `tiersConfirmed`, SEO | intro, sponsorship tier names and benefits, notes |
| `infoPage` *(collection, phase 2)* | slug, SEO | title, body |

### Collections

| Type | Shared fields | Translated (EN / EL) |
|---|---|---|
| `member` | slug, portrait, email, website, instagram, joined year, membership type, status, featured, order | name, discipline, bio |
| `committeeMember` | image, order, optional `member` ref | name, role, bio |
| `project` | slug, year, cover image, gallery[], participants[], dates, links[] | title, summary, body, venue |
| `newsPost` | slug, published date, cover, related project, featured, author | title, excerpt, body |

The Studio shows the English field and its Greek counterpart in the same form, so a translator never has to hunt for a second document. Fields required for the Greek launch are marked, and the document list shows a translation state per entry (§6, fallback rule).

### Deliberate choices

- **Home is a cover, not an editorial page.** The mockup contains nav, the mark/wordmark, the `CURRENT:` line and a blank name block — no statement, hero or featured grid. v1 modelled a magazine home that the design does not ask for.
- **One source of truth per fact.** Contact details live only in `siteSettings` and render in both the footer and `/contact`. The `CURRENT:` line lives only on `homePage`, because the mockup shows it there and a site-wide banner would need an off switch nobody asked for. The mark is a fixed asset in the repo, not a CMS field — there is no vector, and swapping the mark is a design change, not a content edit.
- **Interface strings are not content.** Nav labels, buttons, validation messages and email copy live in code. Translating a button is a commit, not a CMS edit; the CMS stays limited to prose the committee owns.
- **Slugs are shared across languages.** `/projects/printmaking-days-2019` and `/el/projects/printmaking-days-2019` resolve to the same document. One slug map, one redirect table, no risk of the two languages drifting apart.
- **Committee is its own collection**, not an array in About, because it is also shown on `/members` in the mockup and people may exist as both member and committee member. One document, optionally linked to a member.
- **No generic page builder.** Explicit fields per page. An `infoPage` collection exists only in phase 2, to absorb legacy pages cleanly.
- **Pricing tiers are arrays inside their page, gated by `tiersConfirmed`.** While the flag is off, the page renders the tier names and benefits but no amount, with an explicit "fees to be confirmed" line. This lets the committee review the layout on staging without inventing a price that could be screenshotted, forwarded or mistaken for the real one.
- **Portable Text**, not raw HTML.
- **No private data in a public dataset.** With the non-profit plan the dataset is private; still, CVs go by email, not into Sanity.

---

## 8. Routes

New IA, from the mockup nav: `MEMBERS · PROJECTS · SUPPORT · NEWS · ABOUT · CONTACT`, plus the current-exhibition link.

| English | Greek | Phase | Rendering | Content |
|---|---|---|---|---|
| `/` | `/el` | 1 | static | cover, current exhibition |
| `/about` | `/el/about` | 1 | static | `aboutPage` |
| `/contact` | `/el/contact` | 1 | static | `contactPage` + form |
| `/support` | `/el/support` | 1 | static | `supportPage`, sponsorship tiers |
| `/membership` | `/el/membership` | 1 | static | `membershipPage`, tiers + application |
| `/members` | `/el/members` | 1 | static + filter | committee + A–Z directory |
| `/members/[slug]` | `/el/members/[slug]` | 1 | static | one member |
| `/projects` | `/el/projects` | 1 | static + year filter | all projects 2009–2019 + current |
| `/projects/[slug]` | `/el/projects/[slug]` | 1 | static | one project |
| `/news` | `/el/news` | 1 | static | list |
| `/news/[slug]` | `/el/news/[slug]` | 1 | static | one post |
| `/info/[slug]` | `/el/info/[slug]` | 2 | static | legacy informational pages, at cutover |
| `/admin` | — | 1 | Studio SPA | Sanity Studio, one admin for both languages |
| `/api/membership` | — | 1 | SSR | application handler (locale sent in the payload) |
| `/api/contact` | — | 1 | SSR | contact handler |
| `/preview/[...slug]` | — | 1 | SSR | draft renderer |
| `/sitemap-index.xml` | same file | 1 | static | both locales with `hreflang` |
| `/robots.txt` | — | 1 | static | generated |
| `/rss.xml` | `/el/rss.xml` | 1 | static | per-language feed |

Phase 1 is what this document asks to build. Phase 2 is the production migration in §13.

**Archive detail pages are in scope.** The 2009–2019 projects carry over with their own URLs, images and text, not just a year filter over thumbnails. Slugs are chosen at import so the cutover redirect map is a one-to-one substitution.

**Filters** are progressive enhancement: full list in HTML, JS hides non-matches. Members A–Z + text match; projects by year.

---

## 9. Forms and email

### Contact

The live site has a contact form; the mockup's contact page does not. **Decision: keep a contact form on `/contact`** (name, email, message). Removing a working contact channel is a regression, and the cost is one handler that shares its code with the membership form. No attachment.

### Membership application

The live site has no membership tiers and its `/become-a-member` page is the Wix contact form. The mockup introduces two sets of tiers (membership and sponsorship) and a CV upload. The committee has confirmed the tiers are real but the values are not settled, so:

- **Tier names, benefits and structure are built now.** Amounts are hidden behind `tiersConfirmed` until the committee signs them off (§7).
- **The application form is built with CV upload (scope L).** The original brief asked for a CV, and an arts association assessing membership needs one. Scope falls back to M (no CV) only if the committee objects.
- **No payment.** The form applies for membership; how fees are collected is the committee's offline process, out of scope.
- **Tier copy on staging is names only.** The mockup's tier names survive (Individual, Group, Corporate Silver / Gold / Platinum); phytorio's benefit sentences and the amounts do not. The page carries a visible "terms to be confirmed" note and the form's tier selector offers those names plus "Not sure yet".

Handler:

```text
POST /api/membership (multipart)
  → size check (CV ≤ 4 MB, total ≤ 4.5 MB — Vercel Hobby limit)
  → honeypot + minimum-time check
  → Zod validation (name, email, tier, practice, consent, locale)
  → Resend: committee email with CV attached, language labelled
  → Resend: applicant confirmation in the applicant's language
  → inline success/error in the page's language
```

Fields: name, email, phone, membership tier, discipline/practice, message, CV, consent checkbox with a link to the privacy notice. The hidden `locale` field comes from the route, not the user, and decides the confirmation email's language; the committee email notes which language to reply in. Server-side validation messages are localised from the same dictionary as the client, so a Greek applicant never sees an English error.

The confirmation email is transactional and may be in English and Greek side by side if the committee prefers one template over two.

Nothing is stored; the committee inbox is the system of record. No CV in Sanity. If the CV exceeds 4 MB, tell the applicant to email it to the address shown. The privacy notice — what is collected, who reads it, how long the email is kept — must be written by the committee before launch; it is a content dependency, not a code one.

### Email and DNS

Resend Free (3,000/month, 100/day). **Staging sends from `densetheory.cc`**, which is already on Vercel DNS, so the SPF/DKIM records are a five-minute job and nothing touches the association's live domain. At cutover (§13), `cyprintmakers.com` is added as a second verified domain and the env var is switched.

Do not move the `cyprintmakers.com` nameservers in this phase. Nameservers are Wix (`ns8/ns9.wixdns.net`) and MX points to GoDaddy (`smtp.secureserver.net`, `mailstore1.secureserver.net`), so a careless DNS migration breaks the association's email. That is a cutover-time problem with a cutover-time plan (§13), not a staging-time one.

Recipients default to `cyprintmakers@gmail.com`; a committee address list is preferred so the inbox is not one person's.

### Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `SANITY_PROJECT_ID` / `SANITY_DATASET` | all | project |
| `SANITY_API_READ_TOKEN` | server | draft preview |
| `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` | **preview only** | gates stega/drafts |
| `RESEND_API_KEY` | server | email |
| `CONTACT_TO_EMAIL` / `MEMBERSHIP_TO_EMAIL` | server | recipients |
| `SANITY_WEBHOOK_SECRET` | server | webhook verification |

Visual editing must never be enabled on production; if it is, visitors get draft content.

---

## 10. Design implementation

Brand extraction: `docs/brand-style-guide.md`.

### Fidelity rule

The desktop exports in `0. Mockups/HTML/DESKTOP/` are the authority for composition: what sits where, how big it is, what rule separates it, what the eye sees first. They are not a suggestion and not a starting point for a redesign.

Where the export shows something, match it. Where it does not — a hover state, a focus ring, a form error, a 404, a language switcher, anything Greek — make the closest-neighbour choice: reuse an existing token, an existing spacing step, an existing rule weight, and do not invent a new visual language for it.

Every deliberate departure goes in `docs/design-deviations.md` with the reason, so the committee can review the list rather than discovering changes in the browser. If accessibility and the mockup conflict, accessibility wins and the departure is logged.

Known departures, all logged at build time:

| Departure | Why |
|---|---|
| Language switcher in the nav row | Bilingual launch; the mockup predates the decision. Sized and spaced as a nav item. |
| Hover / focus / active states | Absent from the mockup; designed once from existing tokens. |
| `#b3b3b3` text replaced with `#6e6e6e` where it must be read | The mockup's grey fails WCAG AA at body size. |
| Greek wrapping in the nav and tier names | Greek strings run longer; type size and spacing hold, lines wrap. |
| Mobile layouts | The mobile exports reuse desktop coordinates and cannot be used (§below). |
| Form validation and success states | Not in the mockup. |
| 404 and error pages | Not in the mockup. |
| Staging badge | Staging only; removed at cutover. |

### Tokens and type

- Geologica 400 only, self-hosted WOFF2 with `latin` and `greek` subsets, 36/32/24/20 px desktop ramp, separate mobile ramp.
- Tokens: `--ink #000`, `--paper #fff`, `--muted #b3b3b3` (decorative only), `--muted-text #6e6e6e` (AA), `--graphite #3e3e3e`, `--control #d9d9d9`, 1 px rules, 34 px pill radius.
- 12-column grid, 1514 px max, 60/24 px padding, 8 px spacing base.
- Nav as a horizontal row above the brand lockup; `CURRENT:` pinned at the bottom; hard 1 px image frames; no shadows or rounded cards.
- `#b3b3b3` never used for text that must be read.

**Mobile is designed, not exported.** The mobile HTML exports reuse desktop coordinates and are unusable. Flat mobile screenshots from Figma would remove the largest guess; without them, mobile is designed against the desktop composition, in the same grid logic, and reviewed on device.

---

## 11. Quality

- **Accessibility:** WCAG 2.2 AA — contrast, focus-visible, keyboard nav, skip link, labelled forms, alt text required in schema, reduced motion, landmarks, correct `lang` on every page and on any English fallback block.
- **Performance:** static HTML; < 30 KB JS; LCP preload; AVIF/WebP; font subset per script (only the Greek file downloads on Greek pages); Lighthouse ≥ 95 on key templates in both languages.
- **SEO:** per-document and per-locale title/description, self-canonicals, `hreflang` alternates with `x-default`, OG images, sitemap, per-language RSS, JSON-LD. Staging is `noindex`; the production baseline and redirect map are phase 2 (§13).
- **Bilingual QA:** every page checked in both languages — overflow, wrapping, truncation, form validation copy, date format, and the switcher landing on the right page. A page is not "done" in English until it has been seen in Greek.
- **Testing:** `astro check` + build as merge gate; Playwright for nav, filters, 404, form validation with a mocked endpoint, one smoke test per locale tree, and a staging-guard test asserting `noindex`; unit tests for validation and slug helpers.
- **Backups:** weekly `sanity dataset export`; code in GitHub (association-owned); the Wix media archive kept offline before any Wix cancellation.

---

## 12. Decisions

### Resolved

| # | Decision |
|---|---|
| 1 | **Delivery target is staging.** `https://cyprintmakers.densetheory.cc`. |
| 2 | **Production is a later, separately approved phase.** `www.cyprintmakers.com` and the Wix site stay live and untouched until then (§13). |
| 3 | **English and Greek, both at launch.** Neither is deferred. |
| 4 | **Membership and sponsorship tiers are real**, values are placeholders; amounts stay hidden until confirmed. |
| 5 | **The 2009–2019 archive is in scope**, including detail pages. |
| 6 | **GitHub is association-owned**; the developer holds delegated access. Accounts default to the developer and transfer later. |
| 7 | **The Figma wireframes are the design authority.** Departures are deliberate, minimal and logged (§10). |
| 8 | **Copying the current site's text and images onto staging is authorised** — it is the association's own content. |
| 9 | **The staging-ready bar in §14 is agreed:** the builder carries the archive and drafts English page copy; Greek translation, final tier terms, the privacy notice and new content follow after handover. |

### Assumed — correct me if wrong

1. **English is the default locale at `/`, Greek at `/el`.** Greek is a first-class translation, not the default. If the association would rather Greek be primary, the prefixes swap — cheap now, tedious later.
2. **Translation is field-level in one document; images and facts are shared; slugs are shared.** A member's portrait and email are entered once, and `/projects/x` and `/el/projects/x` are the same record (§6, §7).
3. **Greek copy is written by a person, not translated by machine.** Empty Greek fields fall back to English, visibly marked, with the page `noindex` until complete (§6).
4. **`/membership` and `/support` carry different tier sets.** Membership on `/membership`, sponsorship on `/support`. The PayPal donation block is dropped. If support means only sponsorship, or only donations, one page collapses.
5. **The application form includes a CV (scope L).** Falls back to M — same form, no upload — if the committee prefers.
6. **Members get detail pages.** If the committee wants names and emails only, the route drops out.
7. **The contact form stays.** Removing a working contact channel is a regression.
8. **Member emails stay public**, as today, on the assumption members consented when they joined. If consent is unclear the field becomes CMS-only.

### Deferred to phase 2

Production cutover, DNS/MX handling, redirects from the 26 Wix URLs and the 11 dynamic project URLs, the IPC conference microsite, Search Console, and Wix cancellation. §13 covers the plan; none of it is built or deployed now.

### Still needed from the committee

- **A Greek translator and a Greek approver** — named people, not "someone will do it". This is now the longest content dependency, roughly doubling the prose to be written and checked.
- Final tier benefits and amounts; the mockup's tier *names* are used until told otherwise.
- The privacy notice for the application form, in both languages.
- Member records, project texts, committee bios, images, and a single content approver.
- Whether `68823.png` is the real mark, or a vector exists.
- Flat mobile screenshots from Figma, if they can be exported — otherwise mobile is designed against the desktop composition.

---

## 13. Phase 2 — production migration

Not part of this build. Recorded so the phase-1 work does not paint us into a corner, and so the committee knows what "go live" still costs.

### Inventory

- 26 static Wix pages + 11 project URLs, plus images hosted on `static.wixstatic.com`.
- Media: download originals from the Wix CDN; record alt text and captions.
- Content: project and member content is entered during phase 1; About, committee, news and conference text are checked against the Wix originals at cutover.
- Rights: confirm the association owns the copy and images; the 2023 build was by `avocadots`, and the Figma may be theirs.

### Redirect map (draft)

| Old | New |
|---|---|
| `/` | `/` |
| `/about` | `/about` |
| `/members` | `/members` |
| `/executive-committee` | `/members#committee` |
| `/project`, `/projects-1` | `/projects` |
| `/2009` … `/2019` | `/projects?year=YYYY` |
| `/news` | `/news` |
| `/contact` | `/contact` |
| `/become-a-member` | `/membership` or `/contact` |
| `/ipc-1cy-gr-conference` | `/info/ipc-1cy-gr-conference` |
| `/information`, `/keynote-speakers`, `/videos` | `/info/...` |
| `/copy-of-ipc-1cy-gr-conference` | 301 to `/info/ipc-1cy-gr-conference` |
| dynamic project URLs | `/projects/[slug]` (slug map required) |

All 301s live in `vercel.json` or Astro's redirect config, tested before cutover.

### Cutover

1. Freeze Wix edits 48 hours before launch.
2. Final content check and redirect test against the production build on a Vercel preview domain.
3. Remove the staging guard: `noindex`, `robots.txt` disallow, staging badge.
4. Add `cyprintmakers.com` to Resend and switch the sending domain; keep the old domain verified for a month.
5. Point `www` and the apex at Vercel; leave MX/TXT untouched.
6. Verify TLS, redirects, forms, sitemap, Search Console.
7. Keep Wix paid for 30 days as rollback; then cancel.

**Risk:** the apex A records and `www` CNAME are on Wix DNS. If Wix will not let us repoint them, DNS moves to Cloudflare/Vercel and every MX/TXT record must be recreated. Confirm this before promising a date.

---

## 14. Build sequence

### Phase 1 — staging build (this document's scope)

| Milestone | Output |
|---|---|
| **0. Foundations + accounts** | Repo, Astro project with i18n routing, Vercel project on `densetheory.cc`, tokens, both font subsets, layout, staging guard; Sanity project created and non-profit plan applied for |
| **1. CMS** | Schemas with translated fields, translation-state projection, Studio at `/admin`, seed content, image pipeline, webhook rebuild |
| **2. Static pages** | Home (cover), About, Contact, Support, Membership (UI, tiers gated) — built once, rendered in both locales |
| **3. Collections** | News, Members + committee, Projects; filters; detail pages; 2009–2019 archive import; per-language RSS/sitemap |
| **4. Forms** | Contact + membership handlers, Resend via `densetheory.cc`, localised validation and confirmation, states |
| **5. Preview** | Draft preview route, Presentation tool, stega, staging guard test |
| **6. Greek pass** | Every template reviewed in Greek — nav wrapping, tier names, date format, form errors, switcher round-trips; deviations logged |
| **7. Staging launch** | Accessibility/performance pass in both languages, content entry, editor onboarding, handover |

### What "staging ready" means

Staging is ready when the committee can use it, not when it is perfect:

- Every phase-1 route renders on `cyprintmakers.densetheory.cc` **in both languages**, responsive, with no lorem ipsum.
- **Archive:** every project currently published on the Wix site has a detail page, with text and images carried over by the builder and checked by the committee.
- **Members:** the committee is complete and the directory is seeded with the members already listed publicly today.
- **News:** existing posts imported; the most recent few are live.
- **Pages:** About, Contact, Support and Membership copy is drafted in English from the current site, with anything the committee must replace marked in the Studio; Greek follows as the translator supplies it.
- **Forms** deliver to the committee address in either language; one committee member can log into `/admin` and publish a change unaided.

New project write-ups, final tier terms, the privacy notice, the bulk of the Greek text and new photography are added by the committee *after* staging opens. Holding staging for them would delay handover with no benefit — but Greek pages that are still untranslated stay `noindex` until they are done, so the gaps are visible, not hidden.

### Phase 2 — production (separate approval)

Content reconciliation against the Wix originals in both languages, redirect map, DNS/MX plan, Search Console baseline, cutover, rollback window, Wix cancellation.

**Size:** a project, not a small change — 17 routes across two locales, four collections, a CMS with field-level translation, two serverless endpoints, a draft-preview system, and a 2009–2019 archive import. Several weeks of focused work; content entry, Greek translation and approval, tier copy and the non-profit approval are the long poles, not the code. Bilingual roughly doubles the prose and adds a QA pass to every template.

---

## 15. What is left to the builder

- GROQ queries and TypeScript types, including the translation-state projection.
- Component decomposition and CSS organisation.
- The shared page-component pattern behind `src/pages/` and `src/pages/[lang]/`.
- Portable Text renderer choice.
- News pagination size.
- Mobile ramp and grid behaviour per breakpoint.
- Studio desk structure, translation badges, previews, validation messages.
- Redirect implementation details and test strategy (phase 2).
