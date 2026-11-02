# Cyprus Printmakers Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual (English/Greek) Cyprus Printmakers Association site in `site/` — Astro 7 static output, Sanity content, Resend forms — and ship it to `cyprintmakers.densetheory.cc`.

**Architecture:** Every public page is prerendered at build time from Sanity (or from checked-in fixtures when `CONTENT_SOURCE=fixtures`, so tests never touch the network). Two SSR endpoints (`/api/membership`, `/api/contact`) and one SSR preview route exist on Vercel. English lives at `/`, Greek at `/el/…`; one document holds both languages field-by-field.

**Tech Stack:** Astro 7, TypeScript, `@astrojs/vercel`, `@sanity/astro`, `sanity-plugin-internationalized-array`, `@portabletext/to-html`, `@sanity/image-url`, Resend, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-26-cyprus-printmakers-design.md`

## Global Constraints

- **Astro 7** (`astro@^7.4`), `output: 'static'`. SSR only for `/api/*` and `/preview/*`, each via `export const prerender = false`.
- **Node 22.x on Vercel**; local Node 24 is fine. npm, not pnpm or bun.
- **Zero recurring cost:** Sanity non-profit plan, Vercel Hobby, Resend Free.
- **Design authority:** `0. Mockups/HTML/DESKTOP/*/index.html` plus `docs/brand-style-guide.md`. Any departure is recorded in `docs/design-deviations.md`.
- **Tokens (exact):** `--ink #000`, `--paper #fff`, `--muted #b3b3b3` (decorative only), `--muted-text #6e6e6e`, `--graphite #3e3e3e`, `--control #d9d9d9`; 1 px rules; pill radius 34 px; 12-column grid; max width 1514 px; padding 60 px desktop / 24 px mobile; spacing base 8 px.
- **Type:** Geologica 400 only, self-hosted WOFF2, `latin` + `greek` subsets, sizes 36 / 32 / 24 / 20 px desktop.
- **No Tailwind.** Plain CSS custom properties, scoped in `.astro` components.
- **No shadows, gradients, or rounded cards.** `#b3b3b3` never used for text that must be read.
- **Client JS < 30 KB total.** Vanilla only; no framework islands.
- **WCAG 2.2 AA.** `lang` correct on every page and on every English fallback block.
- **CV cap 4 MB**, total request ≤ 4.5 MB (Vercel Hobby body limit). Nothing uploaded is stored.
- **Staging is `noindex`** whenever `PUBLIC_STAGING=true`, plus a footer badge that is removed at cutover.
- **All prose is Portable Text.** No raw HTML fields. No private data in Sanity.
- **English at `/`, Greek at `/el`.** Slugs are shared between languages.
- **Content source is deterministic, never a network fallback.** `CONTENT_SOURCE` wins when set; otherwise `getContent()` uses `sanity` if `SANITY_PROJECT_ID` is present and `fixtures` if it is not. A local checkout with no `.env` builds fixtures without credentials; Vercel always has `SANITY_PROJECT_ID`, so a deployed build is Sanity-backed. Task 18's smoke test asserts a Sanity-only string, so a misconfigured deploy cannot silently ship fixtures.

## Review Focus

These are the failure modes most likely to reach a real visitor. Each has a test in the task that owns the code.

1. **A Greek page with some fields untranslated** — must show the English text wrapped in `lang="en"`, keep its layout, and carry `noindex`; never a blank heading or a 404. *(Tasks 2, 3, 15)*
2. **A CMS document that is missing, unpublished or has a renamed slug** — must fail the build with the document id, or omit the page and its links together; never a rendered page with an empty body. *(Task 4)*
3. **A CV over 4 MB, empty, or not a PDF/DOC** — must produce a localised, specific error and send no partial email. *(Task 12)*
4. **Long Greek strings at 320 px** — nav, tier names and buttons must wrap without horizontal scrolling. *(Tasks 3, 17)*
5. **An image with no alt text or no hotspot** — must render with a neutral fallback and reserved dimensions, no layout shift and no broken box. *(Tasks 3, 4, 6)*

## Human Prerequisites

These require account access and cannot be done by an agent. Everything else can proceed without them.

| # | Who | What |
|---|---|---|
| 1 | Elias | Create the Sanity project (organisation: association, or personal + transfer). Provide `projectId`, `dataset=production`. Apply for the non-profit plan. |
| 2 | Elias | Create the Resend account, verify `densetheory.cc`. Provide `RESEND_API_KEY`. |
| 3 | Elias | Create the Vercel project `cyprus-printmakers-site` (root `site`) and add the env vars from `.env.example`. |
| 4 | Elias | At Task 18 only: move `cyprintmakers.densetheory.cc` from the old project to the new one. |
| 5 | Committee | Name a Greek translator and approver; supply the privacy notice. |

Until 1 and 2 exist, work proceeds on fixtures and the form handlers use a fake mailer in tests.

---

## Milestone A — Foundations

### Task 1: Project scaffold, fonts and tokens

**Files:**
- Create: `site/package.json`, `site/astro.config.mjs`, `site/tsconfig.json`, `site/.env.example`, `site/.gitignore`
- Create: `site/src/styles/tokens.css`, `site/src/styles/base.css`
- Create: `site/public/fonts/Geologica-Regular-latin.woff2`, `site/public/fonts/Geologica-Regular-greek.woff2`, `site/public/fonts/OFL.txt`
- Create: `site/public/mark.png` (optimised from `0. Mockups/HTML/ASSETS/68823.png` to 800 px on the long edge; the source is 1514 × 2085 and 12.6 MB, far above its 158 × 192 display size)
- Create: `site/src/pages/index.astro` (temporary hello page, replaced in Task 6)
- Create: `docs/qa/2026-10-26-cyprus-printmakers-qa.md`
- Modify: `.gitignore` at repo root

**Interfaces:**
- Produces: working `npm run build`, `npm run check`, `npm run test`.

- [ ] **Step 1: Write `.gitignore` and `.env.example`**

Root `.gitignore` must ignore `0. Mockups/`, `Cyprus-Printmakers-Website/`, `node_modules`, `dist`, `.vercel`, `.env*` (but keep `site/.env.example`). `.env.example` lists every variable from the spec §9 with a comment per line, plus `PUBLIC_SITE_URL` (canonical origin, defaults to the staging host) and `PUBLIC_STAGING`.

Create `docs/qa/2026-10-26-cyprus-printmakers-qa.md` with empty sections: `Deferred checks`, `Wix archive`, `Bilingual pass`, `Accessibility`, `Performance`. Later tasks append to it; nothing in this plan records results inline.

- [ ] **Step 2: Create `package.json` and install**

```json
{
  "name": "cyprus-printmakers-site",
  "private": true,
  "type": "module",
  "engines": { "node": "22.x" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "build:fixtures": "CONTENT_SOURCE=fixtures astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Install: `astro@^7.4 @astrojs/vercel@^11 @astrojs/sitemap@^3 @astrojs/rss@^4 @astrojs/react@^7 react react-dom @sanity/astro@^3.6 sanity@^6 styled-components @sanity/client@^8 @sanity/image-url sanity-plugin-internationalized-array@^5 @portabletext/to-html@^6 resend@^6 zod@^4` and dev: `typescript vitest @playwright/test @astrojs/check`.

`tsconfig.json` is `{ "extends": "astro/tsconfigs/strict" }` with `"include": [".astro/types.d.ts", "**/*"]` and `"exclude": ["dist"]`.

- [ ] **Step 3: Fetch the two font subsets**

Request `https://fonts.googleapis.com/css2?family=Geologica:wght@400&display=swap` with a Chrome user agent, take the `greek` and `latin` WOFF2 URLs, download them into `site/public/fonts/`. Verify each file starts with `wOF2` and parses as a valid WOFF2 (`file` reports Web Open Font Format Version 2). Do not gate on a byte size: Geologica's genuine Greek subset is 6.3 KB, so a size threshold would reject the correct file.

Geologica ships under the SIL Open Font License 1.1. Download `OFL.txt` from the same font package and commit it as `site/public/fonts/OFL.txt`; Task 18's README records the licence and the upstream source.

- [ ] **Step 4: Write `tokens.css` and `base.css`**

`tokens.css` declares the Global Constraints tokens verbatim plus `--step: 8px`, `--max: 1514px`, `--pad: 60px`, `--pad-sm: 24px`, `--radius-pill: 34px`. `base.css` sets the `@font-face` rules with `unicode-range` copied from the Google CSS response, `font-display: swap`, a reset, `:focus-visible` outline, `prefers-reduced-motion`, and the type ramp as classes `.t-display`, `.t-title`, `.t-body`, `.t-small`.

- [ ] **Step 5: Write `astro.config.mjs`**

```js
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: process.env.PUBLIC_SITE_URL ?? 'https://cyprintmakers.densetheory.cc',
  i18n: { defaultLocale: 'en', locales: ['en', 'el'], routing: { prefixDefaultLocale: false } },
  integrations: [sitemap()],
})
```

Add `adapter`, `sitemap` imports. No Sanity integration yet — that lands in Task 5 so this task stays runnable.

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: `dist/index.html` exists and contains `<html lang="en">`.

- [ ] **Step 7: Commit**

```bash
git add .gitignore site docs/qa
git commit -m "chore(site): scaffold Astro project with design tokens and fonts"
```

---

### Task 2: Locale core (pure functions, TDD)

**Files:**
- Create: `site/src/lib/i18n/locales.ts`, `site/src/lib/i18n/localized.ts`, `site/src/lib/i18n/ui.ts`, `site/src/lib/i18n/format.ts`
- Test: `site/tests/unit/i18n.test.ts`

**Interfaces:**
- Produces: `type Locale = 'en' | 'el'`; `LOCALES: Locale[]`; `localePath(path: string, lang: Locale): string`; `pickLocalized(value: IntlValue[] | undefined, lang: Locale): { text: string; isFallback: boolean }`; `formatDate(iso: string, lang: Locale): string`; `t(key: UIKey, lang: Locale): string`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(localePath('/', 'el')).toBe('/el')
expect(localePath('/members', 'el')).toBe('/el/members')
expect(localePath('/members', 'en')).toBe('/members')
expect(localePath('/el/members', 'en')).toBe('/members')

expect(pickLocalized([{ _key: 'a', language: 'en', value: 'Hello' }], 'el'))
  .toEqual({ text: 'Hello', isFallback: true })
expect(pickLocalized([{ _key: 'a', language: 'el', value: 'Γεια' }], 'el'))
  .toEqual({ text: 'Γεια', isFallback: false })
expect(pickLocalized([{ _key: 'a', language: 'el', value: '   ' }], 'el'))
  .toEqual({ text: '', isFallback: true })
expect(pickLocalized(undefined, 'en')).toEqual({ text: '', isFallback: true })

expect(formatDate('2019-05-03', 'el')).toContain('Μαΐου')
expect(formatDate('2019-05-03', 'en')).toBe('3 May 2019')
expect(t('nav.members', 'en')).toBe('MEMBERS')
expect(t('nav.members', 'el')).toBe('ΜΕΛΗ')
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`locales.ts`: `Locale`, `LOCALES`, `isLocale()`, `localePath()` — strips an existing `/el` prefix, then prefixes for `el`; `/` becomes `/el` and `/el` becomes `/`, never `//`.

`localized.ts`: `IntlValue = { _key: string; language: Locale; value: string }`; `pickLocalized()` trims, treats whitespace-only as missing, and falls back to `en`.

`ui.ts`: a `const en = {...} as const`, `type UIKey = keyof typeof en`, and `const el: Record<UIKey, string>`. Seed with nav labels (MEMBERS/ΜΕΛΗ, PROJECTS/ΕΡΓΑ, SUPPORT/ΣΤΗΡΙΞΗ, NEWS/ΝΕΑ, ABOUT/ΣΧΕΤΙΚΑ, CONTACT/ΕΠΙΚΟΙΝΩΝΙΑ), `current` (CURRENT/ΤΩΡΑ), form labels, validation messages, and the 404 copy.

`format.ts`: `Intl.DateTimeFormat(lang === 'el' ? 'el-CY' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })`, returning `''` for an invalid date.

- [ ] **Step 4: Verify pass**

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/src/lib/i18n site/tests/unit/i18n.test.ts
git commit -m "feat(i18n): add locale paths, field fallback and UI strings"
```

---

### Task 3: Layout, header, footer and design guards

**Files:**
- Create: `site/src/layouts/BaseLayout.astro`
- Create: `site/src/components/layout/Header.astro`, `Footer.astro`, `LanguageSwitcher.astro`, `StagingBadge.astro`
- Create: `site/src/components/ui/LocalizedText.astro`, `Figure.astro`, `Rule.astro`, `Pill.astro`, `Prose.astro`
- Create: `site/src/lib/content/portable.ts` (Portable Text → HTML with image and link handlers)
- Create: `site/playwright.config.ts`
- Create: `site/src/pages/[lang]/index.astro` (temporary Greek adapter to the same placeholder page; replaced in Task 6)
- Create: `docs/design-deviations.md`
- Modify: `site/src/pages/index.astro`
- Modify: `site/src/lib/i18n/ui.ts` (add `language.label` and `staging.label`)
- Test: `site/tests/unit/design-guard.test.ts`, `site/tests/unit/portable.test.ts`, `site/tests/e2e/layout.spec.ts`

**Interfaces:**
- Consumes: `Locale`, `localePath`, `pickLocalized`, `t`.
- Produces: `BaseLayout` props `{ lang: Locale; title: string; description: string; alternates: Record<Locale, string>; noindex?: boolean; image?: string }`; `LocalizedText` props `{ value: IntlValue[]; lang: Locale; as?: string }`; `Figure` props `{ src?: string; alt?: string; width?: number; height?: number; caption?: IntlValue[]; lang: Locale }`.

- [ ] **Step 1: Write the failing design-guard test**

```ts
const css = readdirSync('src/styles').map(f => readFileSync(`src/styles/${f}`, 'utf8')).join('')
const components = globSync('src/**/*.astro').map(f => readFileSync(f, 'utf8')).join('')
expect(css + components).not.toMatch(/box-shadow|linear-gradient|radial-gradient/)
// border-radius only 50% (circles), 34px (pills) or 0
for (const m of (css + components).matchAll(/border-radius:\s*([^;]+);/g))
  expect(['0', '34px', '50%', 'var(--radius-pill)']).toContain(m[1].trim())
```

- [ ] **Step 2: Write the failing layout test**

```ts
await page.goto('/')
await expect(page.locator('html')).toHaveAttribute('lang', 'en')
await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveCount(1)
await expect(page.getByRole('navigation').getByRole('link')).toHaveText([
  'MEMBERS','PROJECTS','SUPPORT','NEWS','ABOUT','CONTACT'
])
await page.goto('/el')
await expect(page.locator('html')).toHaveAttribute('lang', 'el')
await expect(page.getByRole('navigation').getByRole('link').first()).toHaveText('ΜΕΛΗ')
await expect(page.locator('link[rel="alternate"][hreflang="el"]')).toHaveAttribute('href', /\/el/)
```

Staging assertions (second spec run with `PUBLIC_STAGING=true`): `meta[name=robots]` contains `noindex`, and the footer badge is visible. Those assertions use `test.skip(process.env.PUBLIC_STAGING !== 'true')` so the normal run does not fail on them.

`playwright.config.ts` sets `testDir: './tests/e2e'`, `baseURL: 'http://localhost:4321'`, and a `webServer` running `npm run build:fixtures && npm run preview -- --port 4321` with `env: { CONTENT_SOURCE: 'fixtures', PUBLIC_STAGING: process.env.PUBLIC_STAGING ?? 'false' }` and `reuseExistingServer: !process.env.CI && !process.env.PUBLIC_STAGING`. Every e2e run is therefore hermetic, and `PUBLIC_STAGING=true npm run test:e2e` rebuilds with the staging guard on instead of reusing a server without it.

- [ ] **Step 3: Implement the layout and components**

Follow `0. Mockups/HTML/DESKTOP/figma-to-html/index.html` for the nav row above the brand lockup, the mark position and the footer. `BaseLayout` imports `src/styles/tokens.css` then `src/styles/base.css` once, before any component styles. The temporary `index.astro` from Task 1 switches to `BaseLayout` in this step, so the nav assertions have a real page to run against. Nav items come from `t('nav.*')`; active item is marked with `aria-current="page"`. The language switcher is a two-item group (`EN` / `ΕΛ`) using `alternates`. The staging badge renders only when `import.meta.env.PUBLIC_STAGING === 'true'`, and `BaseLayout` emits `<meta name="robots" content="noindex,nofollow">` in the same condition.

`LocalizedText` renders `<span lang={isFallback ? 'en' : lang}>{text}</span>`, and renders nothing at all when `text` is empty, so an untranslated optional field never produces an empty heading or a stray rule.

`Figure` always emits `width`, `height`, `loading="lazy"`, `decoding="async"`; a missing `alt` becomes `alt=""` plus the figure being `aria-hidden` only when no caption exists; a missing `src` renders the 1 px rule placeholder box, not a broken image. `Figure` deliberately takes plain attributes, so it has no CMS dependency; `imageAttrs()` (Task 4) is what maps a Sanity image document onto them.

`Prose` uses `@portabletext/to-html` with custom serializers and renders the resulting HTML through `set:html`. A Portable Text serializer returns a string, not an Astro component, so `portableToHtml(blocks, { lang, imageUrl })` emits `<figure>` markup equivalent to `Figure` (reserved dimensions, `alt=""`, placeholder when `imageUrl` returns nothing) and adds `rel="noopener"` to external links. It returns the empty string for an empty array. `portable.test.ts` covers empty input, the external-link attribute, and the image placeholder.

- [ ] **Step 4: Write `docs/design-deviations.md`**

Seed it with the table from spec §10 (language switcher, states, contrast, Greek wrapping, mobile, form states, 404, staging badge), recording that Figma is the authority and each entry needs a one-line reason.

- [ ] **Step 5: Verify**

Run: `npx vitest run tests/unit/design-guard.test.ts` → PASS.
Run: `npx playwright test tests/e2e/layout.spec.ts` → PASS.
Run: `PUBLIC_STAGING=true npx playwright test tests/e2e/layout.spec.ts` → PASS (badge visible, `noindex` present).

- [ ] **Step 6: Commit**

```bash
git add site docs/design-deviations.md
git commit -m "feat(ui): add base layout, navigation and design guards"
```

---

## Milestone B — Content

### Task 4: Content source seam, types and fixtures

**Files:**
- Create: `site/src/lib/content/types.ts`, `source.ts`, `translation.ts`, `fixtures.ts`
- Create: `site/src/lib/media.ts`
- Create: `site/src/lib/content/fixtures/{settings,home,about,contact,membership,support,members,projects,news}.json`
- Test: `site/tests/unit/content.test.ts`

**Interfaces:**
- Consumes: `Locale`, `IntlValue`.
- Produces: `createContentLoader(read: () => Promise<RawContent>): () => Promise<Content>`; `getContent(): Promise<Content>`; `loadFixtures(): Promise<RawContent>`; `Content` with `settings`, `home`, `about`, `contact`, `membership`, `support`, `members: Member[]`, `committee: CommitteeMember[]`, `projects: Project[]`, `news: NewsPost[]`; `isFullyTranslated(doc, kind, lang): boolean`; `type RichText = PortableTextBlock[]`; `imageAttrs(image: ImageDoc | undefined, opts: { urlFor: (image: ImageDoc) => string; fallback?: { width: number; height: number } }): { src?: string; alt: string; width: number; height: number }`.

- [ ] **Step 1: Define the types and the failing test**

```ts
import { createContentLoader, loadFixtures } from '../../src/lib/content/source'
import { isFullyTranslated } from '../../src/lib/content/translation'
import { imageAttrs, type ImageDoc } from '../../src/lib/media'

const load = createContentLoader(loadFixtures)
const content = await load()
expect(content.projects.length).toBeGreaterThan(0)
expect(content.members[0].name[0].language).toBe('en')

// a document missing its English title must be reported, not silently rendered
const broken = createContentLoader(async () => ({
  ...(await loadFixtures()),
  projects: [brokenProject],
}))
await expect(broken()).rejects.toThrow(/project .*missing required field/)

// translation completeness is per locale and per kind
expect(isFullyTranslated(memberDoc, 'member', 'el')).toBe(false)
expect(isFullyTranslated(memberDoc, 'member', 'en')).toBe(true)

// images degrade to reserved dimensions and empty alt, never a broken box
const urlFor = () => 'https://cdn.sanity.io/images/p/d/example.jpg'
expect(imageAttrs(undefined, { urlFor }))
  .toEqual({ src: undefined, alt: '', width: 1200, height: 800 })
const imageDoc: ImageDoc = { _type: 'image', asset: { _ref: 'image-abc-1200x800-jpg' }, dimensions: { width: 1200, height: 800 } }
expect(imageAttrs(imageDoc, { urlFor })).toMatchObject({ width: 1200, height: 800, alt: '' })
// crop is applied to intrinsic dimensions before the aspect ratio is reserved
expect(imageAttrs({ ...imageDoc, crop: { top: 0.1, bottom: 0.1, left: 0, right: 0 } }, { urlFor }).height)
  .toBe(640)
```

- [ ] **Step 2: Implement `types.ts`**

Mirror spec §7 exactly: translated fields typed `IntlValue[]` or `IntlRich[]`; shared fields plain. Every entity carries `_id`, `slug`, `translations: Record<Locale, boolean>`. `Project` includes `year`, `gallery`, `participants`, `venue`, `dates`, `links`. `Member` includes `status: 'active' | 'alumni'`.

- [ ] **Step 3: Implement `source.ts` and `translation.ts`**

`getContent()` resolves the source once per call: `CONTENT_SOURCE` if set, otherwise `sanity` when `SANITY_PROJECT_ID` is present and `fixtures` when it is not. It then calls `createContentLoader(loadFixtures)` or `createContentLoader(loadSanity)`. The Sanity reader (implemented in Task 5) is injected, so this task tests the fixture branch alone — no env var, no network.

`media.ts` exports `ImageDoc` and `imageAttrs()`. Given an image document it returns `{ src, alt, width, height }`: `src` from the injected `urlFor`, `alt` from `image.alt ?? ''`, and dimensions from `image.dimensions` with `crop` applied multiplicatively (defaults `1200×800` when dimensions are absent). `src` is `undefined` when there is no asset, which is what makes `Figure` render its rule placeholder rather than a broken image.

Missing required fields throw `new Error(\`${kind} ${doc._id} missing required field ${field} for ${lang}\`)`; the build then fails with the id in the message.

`translation.ts` holds the per-kind required-field map and computes `translations` for every entity and page in one pass.

- [ ] **Step 4: Write fixtures**

Three members — `Maria Georgiou` (`georgiou`, fully translated), `Eleni Athanasiou` (`athanasiou`, fully translated) and `Andreas Petrou` (`andreas-petrou`, English-only, used by Task 15 to prove the Greek fallback + `noindex` rule) — two committee members, three projects (2009, 2017 and 2019; the 2019 one has a gallery), two news posts, and complete singletons — all with realistic Greek copy, so fallback behaviour is exercised rather than theoretical. `membershipPage.privacyNote` is a clearly marked placeholder ("Privacy notice to be confirmed" / Greek equivalent) so the consent link never points at an empty section; the committee replaces it before launch.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run tests/unit/content.test.ts` → PASS.

```bash
git add site/src/lib site/tests/unit/content.test.ts
git commit -m "feat(content): add typed content loader with translation checks"
```

---

### Task 5: Sanity schemas, Studio and seed data

**Files:**
- Create: `site/sanity.config.ts`
- Create: `site/src/sanity/schemaTypes/{index,document,objects}.ts`
- Create: `site/src/sanity/structure.ts`
- Create: `site/scripts/seed.ts`
- Modify: `site/astro.config.mjs`, `site/src/lib/content/source.ts`
- Test: `site/tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: `Content` types from Task 4.
- Produces: schema types named `siteSettings`, `homePage`, `aboutPage`, `contactPage`, `membershipPage`, `supportPage`, `member`, `committeeMember`, `project`, `newsPost`; the Sanity-backed implementation of the Task 4 loader.

- [ ] **Step 1: Write the failing schema test**

```ts
const names = schemaTypes.map(s => s.name)
expect(names).toEqual(expect.arrayContaining([
  'siteSettings','homePage','aboutPage','contactPage',
  'membershipPage','supportPage','member','committeeMember','project','newsPost'
]))
const member = schemaTypes.find(s => s.name === 'member')!
// `translations` is computed by translation.ts from the prose fields; it is not stored in Sanity
expect(fieldNames(member)).toEqual(expect.arrayContaining([
  'name','slug','discipline','bio','portrait','email','status'
]))
expect(fieldType(member, 'name')).toBe('internationalizedArrayString')
expect(fieldType(member, 'bio')).toBe('internationalizedArrayPortableText')
expect(fieldType(member, 'email')).toBe('string')
```

- [ ] **Step 2: Implement the schemas**

Register the plugin in `sanity.config.ts`:

```ts
internationalizedArray({
  languages: [{ id: 'en', title: 'English' }, { id: 'el', title: 'Greek' }],
  defaultLanguages: ['en'],
  fieldTypes: ['string', 'text', 'portableText'],
})
```

`fieldTypes` resolves each entry against a registered schema type, so `objects.ts` must also define a type named `portableText` (`type: 'array'`, `of: [{ type: 'block' }, { type: 'image' }]`). That is what makes the plugin register `internationalizedArrayPortableText` and its `value` field.

`astro.config.mjs` gains `react()` and `sanity({ projectId: process.env.SANITY_PROJECT_ID, dataset: process.env.SANITY_DATASET, studioBasePath: '/admin', studioRouterHistory: 'hash' })`, both added only when `SANITY_PROJECT_ID` is set. Hash history is what lets the prerendered Studio work on a static host without server rewrites for `/admin/*`; the conditional is what lets Tasks 1–4 and every fixture build run before the Sanity project exists.

Singletons are enforced in `structure.ts`, not with the deprecated `__experimental_actions`. The Pages group lists each singleton as `S.document().schemaType('homePage').documentId('homePage')` with a fixed title, and never as an `S.documentTypeListItem`, so the Studio offers no create or delete action for them. Validation: `alt` required on every image, `slug` required and unique per type, `email` format, `tiers[].price` allowed to be empty when `tiersConfirmed` is false but required when true.

- [ ] **Step 3: Build the Studio desk structure**

`structure.ts` groups: Pages (singletons), People (members, committee), Projects, News. Each collection shows a translation badge — `EN ✓ EL ✗` — driven by the same required-field map as `translation.ts`.

- [ ] **Step 4: Wire the Sanity loader**

In `source.ts`, the `sanity` branch fetches all documents in one GROQ round trip, projects the internationalized arrays as raw `[{_key, language, value}]`, and runs them through the same normaliser the fixtures use. `useCdn: false` when the read token is present.

- [ ] **Step 5: Write the seed script**

`npm run seed -- --dry-run` prints the payloads and exits 0 without credentials. Without `--dry-run` it uses `createOrReplace` on fixed `_id`s (`siteSettings`, `homePage`, …) and `create` for sample collections, so re-running is idempotent for singletons and non-destructive for collections. The seeded first member is `Maria Georgiou`, a stable name Task 18 uses to prove the deployed build is reading Sanity and not fixtures.

- [ ] **Step 6: Verify**

Run: `npx vitest run tests/unit/schema.test.ts` → PASS.
Run: `npm run build && test -f dist/admin/index.html` → exits 0 (the embedded Studio is prerendered at `/admin`). This is the one check that needs Human Prerequisite 1; if `SANITY_PROJECT_ID` is still absent, the integration is skipped, the check is deferred, and the deferral is recorded in `docs/qa/2026-10-26-cyprus-printmakers-qa.md`.
Run: `npm run seed -- --dry-run` → prints 6 singletons and ≥ 6 collection docs, exits 0.

- [ ] **Step 7: Commit**

```bash
git add site
git commit -m "feat(cms): add Sanity schemas, studio structure and seed script"
```

---

## Milestone C — Pages

### Task 6: Home and About

**Files:**
- Modify: `site/src/pages/index.astro`
- Create: `site/src/pages/about.astro`
- Create: `site/src/pages/[lang]/index.astro`, `site/src/pages/[lang]/about.astro`
- Create: `site/src/components/pages/HomeView.astro`, `AboutView.astro`
- Test: `site/tests/e2e/home-about.spec.ts`

**Interfaces:**
- Consumes: `getContent()`, `BaseLayout`, `Prose`, `LocalizedText`, `Figure`.
- Produces: `getLocaleParams(): { params: { lang: Locale } }[]` and `getLocaleSlugParams(slugs: string[]): { params: { lang: Locale; slug: string } }[]` in `src/lib/i18n/locales.ts`, used by every `[lang]` page. Both return only non-default locales (`el`), never `en`.

- [ ] **Step 1: Write the failing test**

```ts
await page.goto('/')
await expect(page.getByRole('heading', { level: 1 })).toHaveText('CYPRUS PRINTMAKERS ASSOCIATION')
await expect(page.getByText('CURRENT:')).toBeVisible()
await page.goto('/el')
await expect(page.getByText('ΤΩΡΑ:')).toBeVisible()
await page.goto('/about')
await expect(page.getByRole('heading', { name: /committee/i })).toBeVisible()
await expect(page.locator('img').first()).toHaveAttribute('width')
```

- [ ] **Step 2: Implement the home cover**

Per the export `0. Mockups/HTML/DESKTOP/figma-to-html/index.html`: nav, mark/wordmark, blank name block, `CURRENT:` line pinned bottom. No statement, hero or featured grid — the mockup has none. If `home.coverImage` is absent the block collapses without leaving a gap.

- [ ] **Step 3: Implement About**

Headline, history, committee list (from `committee`, ordered), partners. Committee entries link to `/members/[slug]` when `memberRef` exists.

- [ ] **Step 4: Add the `[lang]` pages**

Each is a 10-line adapter: `export function getStaticPaths() { return getLocaleParams() }`, then render the same `*View` component with `lang={Astro.params.lang}`. `output: 'static'` already prerenders them, so no `prerender` export is needed. Collection routes (Tasks 8–10) call `getLocaleSlugParams(items.map(i => i.slug))` instead, so a Greek detail page exists for exactly the documents that exist in English.

- [ ] **Step 5: Verify and commit**

Run: `npm run build && npx playwright test tests/e2e/home-about.spec.ts` → PASS.

```bash
git add site/src/pages site/src/components/pages site/src/lib/i18n/locales.ts site/tests/e2e
git commit -m "feat(pages): add home cover and about page in both locales"
```

---

### Task 7: Contact

**Files:**
- Create: `site/src/pages/contact.astro`, `site/src/pages/[lang]/contact.astro`, `site/src/components/pages/ContactView.astro`
- Test: `site/tests/e2e/contact.spec.ts`

**Interfaces:**
- Consumes: `settings.contact`, `contact` page copy, `ContactForm` (Task 13 — until then render a placeholder slot).

- [ ] **Step 1: Write the failing test**

```ts
await page.goto('/contact')
await expect(page.getByText('Agiou 7')).toBeVisible()
await expect(page.getByRole('link', { name: /cyprintmakers@gmail.com/ })).toHaveAttribute('href', 'mailto:cyprintmakers@gmail.com')
await page.goto('/el/contact')
await expect(page.getByRole('link', { name: /0035799351153/ })).toHaveAttribute('href', 'tel:+35799351153')
```

- [ ] **Step 2: Implement**

Address, phone, email from `settings`, never duplicated into the page document. `tel:` strips spaces; `mailto:` is plain. The map link is a normal external link with `rel="noopener"`.

- [ ] **Step 3: Verify and commit**

Run: `npm run build && npx playwright test tests/e2e/contact.spec.ts` → PASS.

```bash
git add site/src/pages site/src/components/pages/ContactView.astro site/tests/e2e/contact.spec.ts
git commit -m "feat(pages): add contact page in both locales"
```

---

### Task 8: Members — index, committee block, filter, detail

**Files:**
- Create: `site/src/pages/members.astro`, `site/src/pages/members/[slug].astro`
- Create: `site/src/pages/[lang]/members.astro`, `site/src/pages/[lang]/members/[slug].astro`
- Create: `site/src/components/pages/MembersView.astro`, `MemberView.astro`
- Create: `site/src/components/filters/MemberFilter.astro`
- Create: `site/src/lib/members/filter.ts`
- Test: `site/tests/unit/member-filter.test.ts`, `site/tests/e2e/members.spec.ts`

**Interfaces:**
- Consumes: `Member`, `CommitteeMember`, `localePath`, `pickLocalized`.
- Produces: `filterMembers(members: Member[], query: string, letter: string | null, lang: Locale): Member[]`; `groupByLetter(members: Member[], lang: Locale): Map<string, Member[]>`.

- [ ] **Step 1: Write the failing unit test**

```ts
expect(filterMembers(all, '', null, 'en')).toHaveLength(3)
expect(filterMembers(all, 'geo', null, 'en').map(m => m.slug)).toEqual(['georgiou'])
expect(filterMembers(all, '', 'Α', 'el').map(m => m.slug)).toEqual(['athanasiou'])
expect(filterMembers(all, '', 'A', 'el')).toHaveLength(0) // Latin letter never matches Greek names
const keys = [...groupByLetter(all, 'el').keys()]
expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b, 'el'))) // Greek collation, not code points
```

- [ ] **Step 2: Implement filter and grouping**

Matching is case- and accent-insensitive per locale (`localeCompare` with `sensitivity: 'base'`); Greek sorting uses `el` collation, not code-point order. Letter grouping uses the last whitespace-separated word of the localised name as the surname (names are `First Last`), so `Ελένη Αθανασίου` files under `Α`.

- [ ] **Step 3: Write the failing page test**

```ts
await page.goto('/members')
await expect(page.getByRole('heading', { name: /committee/i })).toBeVisible()
await expect(page.locator('[data-member]')).toHaveCount(3)
await page.fill('[data-member-search]', 'geo')
await expect(page.locator('[data-member]')).toHaveCount(1)
await expect(page.locator('[data-member-count]')).toHaveText('1 member')
// no JS: the full list is in the HTML
await page.goto('/el/members')
await expect(page.locator('[data-member-count]')).toHaveText('3 μέλη')
const noJs = await browser.newContext({ javaScriptEnabled: false })
const raw = await noJs.newPage()
await raw.goto('http://localhost:4321/members')
await expect(raw.locator('[data-member]')).toHaveCount(3)
await noJs.close()
```

- [ ] **Step 4: Implement the pages and the island**

The full list is server-rendered; the filter script toggles `hidden` and updates the count. With JS disabled the list still reads correctly. Detail pages render portrait, discipline, bio, and public links; a member with no bio still renders without an empty heading.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run tests/unit/member-filter.test.ts && npm run build && npx playwright test tests/e2e/members.spec.ts` → PASS.

```bash
git add site/src/pages site/src/components site/src/lib/members site/tests
git commit -m "feat(members): add directory, committee block and member pages"
```

---

### Task 9: Projects — index, year filter, detail

**Files:**
- Create: `site/src/pages/projects.astro`, `site/src/pages/projects/[slug].astro`
- Create: `site/src/pages/[lang]/projects.astro`, `site/src/pages/[lang]/projects/[slug].astro`
- Create: `site/src/components/pages/ProjectsView.astro`, `ProjectView.astro`
- Create: `site/src/components/filters/ProjectFilter.astro`
- Create: `site/src/lib/projects/filter.ts`
- Test: `site/tests/unit/project-filter.test.ts`, `site/tests/e2e/projects.spec.ts`

**Interfaces:**
- Produces: `yearsOf(projects: Project[]): number[]` (descending, de-duplicated); `filterByYear(projects: Project[], year: number | null): Project[]`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(yearsOf(projects)).toEqual([2019, 2017, 2009])
expect(filterByYear(projects, 2019).map(p => p.slug)).toEqual(['printmaking-days-2019'])
expect(filterByYear(projects, null)).toHaveLength(3)
```

- [ ] **Step 2: Implement and verify the pages**

`/projects` shows all projects newest first with a year control; year selection is client-side only, the URL is not changed at launch. Detail renders summary, body, gallery (each image through `Figure`), participants, venue, dates, links. A project with no gallery renders no gallery section.

- [ ] **Step 3: Verify and commit**

Run: `npx vitest run tests/unit/project-filter.test.ts && npm run build && npx playwright test tests/e2e/projects.spec.ts` → PASS.

```bash
git add site/src/pages site/src/components site/src/lib/projects site/tests
git commit -m "feat(projects): add archive index, year filter and project pages"
```

---

### Task 10: News, pagination and RSS

**Files:**
- Create: `site/src/pages/news.astro`, `site/src/pages/news/[slug].astro`, `site/src/pages/news/page/[n].astro`
- Create: `site/src/pages/[lang]/news.astro`, `site/src/pages/[lang]/news/[slug].astro`, `site/src/pages/[lang]/news/page/[n].astro`
- Create: `site/src/pages/rss.xml.ts`, `site/src/pages/[lang]/rss.xml.ts`
- Create: `site/src/components/pages/NewsView.astro`, `NewsPostView.astro`
- Create: `site/src/lib/news/paginate.ts`
- Test: `site/tests/unit/paginate.test.ts`, `site/tests/e2e/news.spec.ts`

**Interfaces:**
- Produces: `paginate<T>(items: T[], page: number, perPage: number): { items: T[]; page: number; pages: number }` with `perPage = 10`.

- [ ] **Step 1: Write the failing pagination test**

```ts
expect(paginate(range(25), 1, 10).items).toHaveLength(10)
expect(paginate(range(25), 3, 10).items).toHaveLength(5)
expect(paginate(range(25), 4, 10).items).toEqual([])
expect(paginate(range(0), 1, 10).pages).toBe(1)
```

- [ ] **Step 2: Implement news and feeds**

`/news` page 1 is `/news`; later pages are `/news/page/[n]`. RSS uses `@astrojs/rss` with `site` from config, per locale, and each item's `link` built with `localePath`. A post with no cover image still produces valid RSS. `news.spec.ts` asserts that `/news` lists the two fixtures newest first, that `/news/<slug>` renders the body, and that `/el/news` labels the list in Greek.

- [ ] **Step 3: Verify and commit**

Run: `npx vitest run tests/unit/paginate.test.ts && npm run build && npx playwright test tests/e2e/news.spec.ts` → PASS.
Also: `curl -s http://localhost:4321/rss.xml | grep -c "<item>"` ≥ 2.

```bash
git add site/src/pages site/src/components/pages site/src/lib/news site/tests
git commit -m "feat(news): add news list, detail pages and per-language RSS"
```

---

### Task 11: Membership and Support with gated tiers

**Files:**
- Create: `site/src/pages/membership.astro`, `site/src/pages/support.astro`
- Create: `site/src/pages/[lang]/membership.astro`, `site/src/pages/[lang]/support.astro`
- Create: `site/src/components/pages/MembershipView.astro`, `SupportView.astro`, `TierList.astro`
- Test: `site/tests/unit/tiers.test.ts`, `site/tests/e2e/membership.spec.ts`

**Interfaces:**
- Produces: `visiblePrice(tier: { price?: string }, confirmed: boolean): string | null` — returns `null` unless `confirmed` and `price` is non-empty; `TierList` props `{ tiers: Tier[]; confirmed: boolean; lang: Locale }`, where `Tier = { name: IntlValue[]; benefits?: IntlRich[]; price?: string; levels?: { name: string; price?: string }[] }`.

- [ ] **Step 1: Write the failing unit test**

```ts
expect(visiblePrice({ price: '€50' }, false)).toBeNull()
expect(visiblePrice({ price: '€50' }, true)).toBe('€50')
expect(visiblePrice({ price: '' }, true)).toBeNull()
```

- [ ] **Step 2: Write the failing page test**

```ts
await page.goto('/membership')
await expect(page.getByText('terms to be confirmed')).toBeVisible()
await expect(page.getByText('€50')).toHaveCount(0)
// three tiers: Individual, Group, Corporate — Corporate carries Silver/Gold/Platinum as levels
await expect(page.locator('[data-tier]')).toHaveCount(3)
await expect(page.locator('[data-tier]').last()).toContainText('Silver')
await page.goto('/el/membership')
await expect(page.locator('[data-tier]').first()).not.toContainText('Individual')
await page.goto('/support')
await expect(page.locator('[data-tier]').first()).toBeVisible()
```

- [ ] **Step 3: Implement**

`membershipPage.tiers` has three entries — `Individual`, `Group` (up to 4 persons) and `Corporate`; the Corporate entry carries `levels: [{ name: 'Silver', price }, { name: 'Gold', price }, { name: 'Platinum', price }]`. Tier names and benefits come from the mockup; phytorio's benefit sentences and the PayPal/donation block are dropped. No amounts render while `tiersConfirmed` is false. `/support` carries the sponsorship set through the same `TierList` and the same gate. The membership page hosts the application form slot from Task 13 and renders `privacyNote` in a section with `id="privacy"`.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run tests/unit/tiers.test.ts && npm run build && npx playwright test tests/e2e/membership.spec.ts` → PASS.

```bash
git add site/src/pages site/src/components site/tests
git commit -m "feat(membership): add membership and support pages with gated pricing"
```

---

## Milestone D — Forms and preview

### Task 12: Form validation, email and API endpoints

**Files:**
- Create: `site/src/lib/forms/schema.ts`, `validate.ts`, `email.ts`, `submit.ts`
- Create: `site/src/pages/api/membership.ts`, `site/src/pages/api/contact.ts`
- Create: `site/src/lib/i18n/email.ts`
- Test: `site/tests/unit/forms.test.ts`

**Interfaces:**
- Produces: `wantsJson(accept: string): boolean`; `validateMembership(input: FormInput, lang: Locale): Result`; `validateContact(input: FormInput, lang: Locale): Result`; `submitMembership(deps: { send: Mailer; now: number; input: FormInput; lang: Locale }): Promise<Result>`; `type Mailer = (mail: Mail) => Promise<void>` with `Mail = { to: string; subject: string; html: string; attachments?: { filename: string; content: string }[] }`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(wantsJson('application/json')).toBe(true)
expect(wantsJson('text/html,application/xhtml+xml')).toBe(false)
expect(wantsJson('')).toBe(false)

expect(validateMembership({ name: '', email: 'x', consent: false }, 'en').errors).toMatchObject({
  name: 'Enter your name', email: 'Enter a valid email address', consent: 'Please accept the privacy notice'
})
expect(validateMembership({ ...valid, cv: cvOfSize(5_000_000) }, 'en').errors.cv)
  .toMatch(/larger than 4 MB/)
expect(validateMembership({ ...valid, cv: { type: 'image/png', size: 1000 } }, 'el').errors.cv)
  .toMatch(/PDF/)
expect(validateMembership({ ...valid, honeypot: 'bot' }, 'en')).toEqual({ ok: false, silent: true })
expect(validateMembership({ ...valid, renderedAt: Date.now() }, 'en')).toEqual({ ok: false, silent: true })

// Greek applicant gets Greek confirmation, committee mail is labelled
const sent: Mail[] = []
await submitMembership({ send: async m => { sent.push(m) }, now: Date.now(), input: greekForm, lang: 'el' })
expect(sent[1].subject).toContain('Η αίτησή σας')
expect(sent[0].subject).toContain('[EL]')
expect(sent[0].attachments?.[0].filename).toBe('cv.pdf')
```

- [ ] **Step 2: Implement validation**

Zod schema plus a hand-written error map so messages come from `ui.ts` per locale. Order: size → type → required → format → consent. `silent: true` returns HTTP 200 with no email, so bots learn nothing.

- [ ] **Step 3: Implement the mailer and handlers**

`email.ts` builds the committee and applicant messages in HTML and text. The committee address comes from `MEMBERSHIP_TO_EMAIL` / `CONTACT_TO_EMAIL`. `submit.ts` converts the uploaded file with `Buffer.from(await file.arrayBuffer()).toString('base64')` and calls Resend with `attachments: [{ filename, content }]`. Missing `RESEND_API_KEY` throws at request time, never at build time.

- [ ] **Step 4: Implement the routes**

`src/pages/api/membership.ts` and `contact.ts` both export `prerender = false` and a `POST` handler that: parses `formData`, reads the `locale` field (default `en`, reject unknown values), calls the handler, and content-negotiates. A request whose `Accept` header prefers JSON (what `forms.js` sends) gets `{ ok, errors }` with status 400 on validation failure and 200 on success. Any other request — a native no-JS submit — gets a small self-contained HTML document with the same status: a confirmation with a back link, or the error list with a back link. A no-JS submit must never land on a raw JSON blob.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run tests/unit/forms.test.ts` → PASS.

```bash
git add site/src/lib/forms site/src/lib/i18n/email.ts site/src/pages/api site/tests/unit/forms.test.ts
git commit -m "feat(forms): add validated membership and contact endpoints"
```

---

### Task 13: Form UI

**Files:**
- Create: `site/src/components/forms/MembershipForm.astro`, `ContactForm.astro`, `FormStatus.astro`
- Create: `site/public/scripts/forms.js`
- Modify: `site/src/components/pages/MembershipView.astro`, `ContactView.astro`
- Test: `site/tests/e2e/forms.spec.ts`

**Interfaces:**
- Consumes: `/api/membership`, `/api/contact`, `t()` labels.
- Produces: forms that work without JS (native POST) and enhance to inline submission with JS.

- [ ] **Step 1: Write the failing test**

```ts
await page.route('**/api/membership', route => route.fulfill({
  status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true })
}))
await page.goto('/membership')
await page.getByLabel('Name').fill('Maria')
await page.getByLabel('Email').fill('maria@example.com')
await page.getByLabel(/privacy/).check()
await page.getByRole('button', { name: 'Send application' }).click()
await expect(page.getByRole('status')).toContainText('Thank you')

// server-provided error is rendered against the field, localised by the server
await page.route('**/api/membership', route => route.fulfill({
  status: 400, contentType: 'application/json',
  body: JSON.stringify({ ok: false, errors: { email: 'Εισαγάγετε μια έγκυρη διεύθυνση email' } })
}))
await page.goto('/el/membership')
await page.getByRole('button', { name: 'Υποβολή' }).click()
await expect(page.locator('[data-error="email"]')).toHaveText('Εισαγάγετε μια έγκυρη διεύθυνση email')

// native submit (no JS) still gets a readable confirmation page, not JSON
const noJs = await browser.newContext({ javaScriptEnabled: false })
const raw = await noJs.newPage()
await raw.route('**/api/membership', route => route.fulfill({
  status: 200, contentType: 'text/html', body: '<h1>Thank you</h1>'
}))
await raw.goto('http://localhost:4321/membership')
await raw.getByLabel('Full name').fill('Maria')
await raw.getByLabel('Email').fill('maria@example.com')
await raw.getByRole('button', { name: 'Send application' }).click()
await expect(raw.getByRole('heading')).toContainText('Thank you')
await noJs.close()
```

- [ ] **Step 2: Implement the markup**

`<form method="post" action="/api/membership" enctype="multipart/form-data">` with a hidden `locale`, a hidden `renderedAt`, a honeypot input named `website` inside `aria-hidden`. The HTML ships without `novalidate`, so native validation works with JS off; `forms.js` adds `novalidate` on load because it takes over error display. `renderedAt` is empty in the HTML and filled with `Date.now()` by `forms.js` on load; the server applies the velocity check only when the field parses as a number, so a no-JS submission is not silently rejected. Labels are visible, never placeholder-only. The consent label links to `#privacy` on the same page, where `privacyNote` renders in the page's language; no separate `/privacy` route is built. The CV input accepts `.pdf,.doc,.docx` and carries `accept` plus a note about the 4 MB limit.

- [ ] **Step 3: Implement `forms.js`**

~2 KB: intercept submit, disable the button, POST `FormData`, render field errors from `errors` into `[data-error="field"]`, replace the form with the success message, and restore on failure. No framework, no dependencies.

- [ ] **Step 4: Verify and commit**

Run: `npm run build && npx playwright test tests/e2e/forms.spec.ts` → PASS.
Check the only client script: `wc -c < site/public/scripts/forms.js` < 30720. If a later filter script is added under `public/scripts/`, add its size too.

```bash
git add site/src/components/forms site/public/scripts/forms.js site/src/components/pages site/tests/e2e/forms.spec.ts
git commit -m "feat(forms): add accessible membership and contact forms"
```

---

### Task 14: Draft preview and Presentation tool

**Files:**
- Create: `site/src/pages/preview/[...slug].astro`
- Create: `site/src/lib/content/preview.ts`
- Modify: `site/src/layouts/BaseLayout.astro`, `site/sanity.config.ts`
- Test: `site/tests/unit/preview-guard.test.ts`

**Interfaces:**
- Consumes: `getContent()` from Task 4, Sanity read token.
- Produces: `isPreviewEnabled(env): boolean`; the preview route using `perspective: 'drafts'` and `stega: { enabled: true, studioUrl: '/admin' }`.

- [ ] **Step 1: Write the failing guard test**

```ts
expect(isPreviewEnabled({ PUBLIC_SANITY_VISUAL_EDITING_ENABLED: 'false' })).toBe(false)
expect(isPreviewEnabled({})).toBe(false)
expect(isPreviewEnabled({ PUBLIC_SANITY_VISUAL_EDITING_ENABLED: 'true', SANITY_API_READ_TOKEN: 'sk' })).toBe(true)
expect(isPreviewEnabled({ PUBLIC_SANITY_VISUAL_EDITING_ENABLED: 'true' })).toBe(false)
```

- [ ] **Step 2: Implement the route**

`prerender = false`; resolves the slug to a document and a page view; returns 404 when the slug is unknown; returns 503 with a plain message when preview env is missing. It never renders draft content into a cached public page — the response sets `Cache-Control: no-store`.

- [ ] **Step 3: Wire the Studio**

`sanity.config.ts` gets `document.productionUrl` and `document.actions` for preview; `presentationTool` points at `/preview` with `resolveHref` for `home`, `about`, `member`, `project`, `newsPost`. `BaseLayout` renders `VisualEditing` only when `isPreviewEnabled(...)` is true.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run tests/unit/preview-guard.test.ts && npm run build` → PASS.
Run: `npm run build && grep -rl 'data-sanity' dist/ | wc -l` with preview env unset → `0` (no stega metadata leaks into public HTML).

```bash
git add site/src/pages/preview site/src/lib/content/preview.ts site/src/layouts/BaseLayout.astro site/sanity.config.ts site/tests/unit/preview-guard.test.ts
git commit -m "feat(preview): add draft preview route and presentation wiring"
```

---

## Milestone E — Launch readiness

### Task 15: SEO surface, 404 and staging guards

**Files:**
- Create: `site/src/pages/404.astro`, `site/src/pages/robots.txt.ts`
- Create: `site/src/lib/seo.ts`
- Modify: `site/astro.config.mjs`
- Test: `site/tests/e2e/seo.spec.ts`

Astro emits a single `dist/404.html`; there is no per-locale 404 route in this build, so `/el/404` is not created. The page is English with a link to `/el`, and it is excluded from the sitemap.

**Interfaces:**
- Produces: `organizationJsonLd(settings, lang): object`; sitemap with `hreflang` alternates via `@astrojs/sitemap` `i18n` option.

- [ ] **Step 1: Write the failing test**

```ts
await page.goto('/about')
await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://cyprintmakers.densetheory.cc/about')
await expect(page.locator('link[hreflang="el"]')).toHaveCount(1)
await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute('href', /\/about$/)
await page.goto('/el/about')
await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', /\/about$/)
await page.goto('/nope')
await expect(page.getByRole('heading')).toContainText('404')
expect(await (await fetch('/sitemap-0.xml')).text()).toContain('/el/about')

// a Greek page with untranslated prose still renders, in English, and stays out of the index
await page.goto('/el/members/andreas-petrou')
await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
await expect(page.locator('[lang="en"]').first()).toBeVisible()
```

- [ ] **Step 2: Implement meta and JSON-LD**

Title pattern `{page} — Cyprus Printmakers Association`, description from the document, OG/Twitter with the Sanity image at 1200×630. JSON-LD `Organization` on every page, `Article` on news posts, `VisualArtwork` on projects.

Every Greek page whose rendered documents are not all fully translated passes `noindex` to `BaseLayout`; it still renders, with English inside `lang="en"`. English pages are never noindex for translation reasons. List pages inherit the rule: one untranslated member makes `/el/members` noindex until that member is translated, so the gap is visible rather than hidden.

- [ ] **Step 3: Implement robots and sitemap**

`robots.txt` disallows everything when `PUBLIC_STAGING=true` and otherwise allows all with the sitemap URL. Sitemap config:

```js
sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en-GB', el: 'el-CY' } } })
```

- [ ] **Step 4: Verify and commit**

Run: `npm run build && npx playwright test tests/e2e/seo.spec.ts` → PASS.

```bash
git add site/src/pages site/src/lib/seo.ts site/astro.config.mjs site/tests/e2e/seo.spec.ts
git commit -m "feat(seo): add canonicals, hreflang, sitemap, robots and 404"
```

---

### Task 16: Archive and member import scripts

**Files:**
- Create: `site/scripts/import-projects.ts`, `site/scripts/import-members.ts`, `site/scripts/lib/wix.ts`
- Create: `site/scripts/__fixtures__/wix-project.html`, `site/scripts/__fixtures__/wix-year.html`
- Create: `site/scripts/data/members.csv`
- Test: `site/tests/unit/import.test.ts`

**Interfaces:**
- Produces: `parseProjectPage(html: string, url: string): ProjectDraft`; `parseYearPage(html: string): string[]` (project URLs); `parseMembersCsv(csv: string): MemberDraft[]`.

- [ ] **Step 0: Archive the live site before any migration work**

The live Wix site is the only copy of the 2009–2019 archive and its images, so archive it before importing anything. Keep the archive outside the repo:

```bash
mkdir -p ../wix-archive/pages ../wix-archive/images
curl -s https://www.cyprintmakers.com/sitemap.xml -o ../wix-archive/sitemap.xml
# for each <loc>: curl it into ../wix-archive/pages/<slug>.html
# then extract img src values and curl each into ../wix-archive/images/
```

Keep `../wix-archive/` until the association confirms the new archive renders correctly. Record the date, page count and image count in `docs/qa/2026-10-26-cyprus-printmakers-qa.md`.

- [ ] **Step 1: Save two small fixtures**

Copy one project page and one year page from `cyprintmakers.com` into `scripts/__fixtures__/`, trimmed to the content region. Record the **exact live URL** of each at the top of the file and in `scripts/__fixtures__/README.md`. Do not assume a `/projects/<slug>` path shape — the real one is recorded from the site, not invented.

- [ ] **Step 2: Write the failing tests**

```ts
// `projectUrl` and `yearUrl` are the exact live URLs recorded in Step 1
const draft = parseProjectPage(projectHtml, projectUrl)
expect(draft.title).toMatch(/Printmaking Days/)
expect(draft.slug).toBe(new URL(projectUrl).pathname.split('/').filter(Boolean).pop())
expect(draft.images.length).toBeGreaterThan(0)
expect(draft.year).toBe(2019)

expect(parseYearPage(yearHtml)).toContain(projectUrl)
expect(parseMembersCsv(csv)).toHaveLength(17)
expect(parseMembersCsv(csv)[0]).toMatchObject({ status: 'active' })
```

- [ ] **Step 3: Implement the scripts**

`--dry-run` writes NDJSON to stdout and makes no network calls beyond fetching pages. Each draft gets `_id = \`project-${slug}\``, where `slug` is the last path segment of the live URL, so re-running with `createOrReplace` is idempotent. Images are downloaded, uploaded with `client.assets.upload('image', buffer, { filename })`, and the asset ref is stored. Failures are collected and reported at the end, not swallowed.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run tests/unit/import.test.ts` → PASS.

```bash
git add site/scripts site/tests/unit/import.test.ts
git commit -m "feat(import): add idempotent Wix archive and member import scripts"
```

---

### Task 17: Greek pass, accessibility and performance gate

**Files:**
- Modify: any component with layout issues found
- Create: `site/tests/e2e/bilingual.spec.ts`, `site/tests/e2e/a11y.spec.ts`
- Modify: `docs/qa/2026-10-26-cyprus-printmakers-qa.md`
- Modify: `docs/design-deviations.md`

**Interfaces:**
- Consumes: every page built so far.

- [ ] **Step 1: Write the failing overflow test**

```ts
for (const url of ['/el', '/el/members', '/el/membership', '/el/projects']) {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto(url)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}
```

- [ ] **Step 2: Write the failing a11y test**

Run axe on `/`, `/about`, `/members`, `/projects`, `/news`, `/membership` and their `/el` twins; assert zero violations at `wcag2a` and `wcag2aa`. Also assert every `<html>` has a `lang`, every image has `alt` (empty allowed), and every form control has a label.

- [ ] **Step 3: Fix what the tests find**

Expected first failures: Greek nav wrapping at 320 px, tier names overflowing their pill, and the language switcher tap target under 44 px. Fix by wrapping and spacing, not by shrinking type below the ramp.

- [ ] **Step 4: Record the Greek pass**

Append every new departure (with reason) to `docs/design-deviations.md`.

- [ ] **Step 5: Run the performance check**

Run: `npm run build && npx lighthouse http://localhost:4321/ --only-categories=performance,accessibility --chrome-flags="--headless"` and the same for `/el`. Expected: ≥ 95 in both categories. Record the numbers, the axe result and the overflow verdict in `docs/qa/2026-10-26-cyprus-printmakers-qa.md` — one table per run with URL, performance, accessibility, max overflow in px, and notes. Do not edit this plan to record results.

- [ ] **Step 6: Commit**

```bash
git add -A site docs/design-deviations.md docs/qa
git commit -m "test: add bilingual overflow and accessibility gates"
```

---

### Task 18: Deploy to staging

**Files:**
- Create: `site/README.md`
- Modify: `site/.env.example` if any variable changed

**Interfaces:**
- Consumes: everything.

- [ ] **Step 1: Write the runbook**

`site/README.md` documents: local setup, the env table, `CONTENT_SOURCE=fixtures` for offline work, how to seed, how to preview drafts, how to import the archive, how to publish (Sanity webhook → Vercel deploy hook), the staging-guard env var, the weekly `sanity dataset export` backup, and the Geologica OFL 1.1 licence with its upstream source.

- [ ] **Step 2: Push and connect**

Create the GitHub repo under the association, push, connect Vercel project `cyprus-printmakers-site` with root `site`. Set the env vars in Vercel's **Production** environment: at launch Production *is* the staging host, so `PUBLIC_STAGING=true` and `PUBLIC_SITE_URL=https://cyprintmakers.densetheory.cc`. Moving to `www.cyprintmakers.com` is a separate cutover change — flip `PUBLIC_STAGING` to `false`, change `PUBLIC_SITE_URL`, verify the production domain in Resend, and redeploy. No code edit at cutover.

- [ ] **Step 3: Verify the preview deployment**

Run: `curl -sI https://cyprus-printmakers-site.vercel.app/robots.txt` → 200, `Disallow: /`.

- [ ] **Step 4: Human step — move the domain**

Elias removes `cyprintmakers.densetheory.cc` from the old `cyprus-printmakers` project and adds it to the new one. Wait for TLS.

- [ ] **Step 5: Smoke test the real staging URL**

```bash
curl -sI https://cyprintmakers.densetheory.cc/ | head -1        # 200
curl -s https://cyprintmakers.densetheory.cc/robots.txt          # Disallow: /
curl -s https://cyprintmakers.densetheory.cc/ | grep -o 'content="noindex'
curl -s https://cyprintmakers.densetheory.cc/el | grep -o 'lang="el"'
curl -s https://cyprintmakers.densetheory.cc/members | grep -o 'Maria Georgiou'
```

Expected: 200, disallow line, the `noindex` meta, `lang="el"`, and the seeded member name. If `Maria Georgiou` is missing, the deploy is serving fixtures — check `SANITY_PROJECT_ID` and `CONTENT_SOURCE`.

- [ ] **Step 6: Add the publish webhook**

In Sanity: webhook on publish → Vercel Deploy Hook. Publish a test change and confirm a rebuild starts within 60 s.

- [ ] **Step 7: Commit and tag**

```bash
git add site/README.md
git commit -m "docs: add deploy and editorial runbook"
git tag staging-v1
```
