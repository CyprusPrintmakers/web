# Second Round Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the home burger left, auto-play a shorter hero intro, replace member profiles with name-plus-website rows, and prepare the `cyprintmakers.com` cutover.

**Architecture:** Small, isolated changes. CSS moves the burger. `intro.js` gains a timed auto-start and drops the click gate while keeping skip/reduced-motion paths. Member data is narrowed at the Sanity schema, query and type layers, then the directory renders plain rows and the detail routes are deleted. Domain work is config plus documented dashboard steps.

**Tech Stack:** Astro 7 static output, Vercel adapter, Sanity, Vitest, Playwright, Web Animations API.

**Spec:** `docs/superpowers/specs/2026-11-25-second-round-feedback-design.md`

## Global Constraints

- Keep Geologica, the monochrome print palette, and `tokens.css` values.
- No member email, bio, portrait, Instagram or membership-type output anywhere public.
- No gradients or shadows.
- The site must still work with JavaScript disabled and under `prefers-reduced-motion: reduce`.
- Static Astro output; redirects that need wildcards live in `vercel.json`.
- Canonical origin is `https://www.cyprintmakers.com`.
- `E2E_PORT=4331` locally because 4321 is occupied.

## Review Focus

- A visitor on a slow connection: the intro must not reveal the page before fonts settle, and the 4s `BaseLayout` fail-safe must not fire when `intro.js` is working.
- A keyboard or screen-reader visitor: the skip control must be reachable, `Escape` must work, and auto-completion must not move focus unexpectedly.
- A Greek member with no Greek name: the Greek directory must still count and filter correctly, and the page stays `noindex`.
- A member with no website: the row must have no empty anchor, no arrow and no layout shift.
- An old `/members/<slug>` URL arriving at Vercel: it must 308 to the directory, not 404.

---

### Task 1: Move the home burger to the left

**Files:**
- Modify: `site/src/components/layout/Header.astro:147-152`, `:243-252`
- Test: `site/tests/e2e/hero.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the home header's `[data-menu-toggle]` and `#home-menu` are left-aligned.

- [ ] **Step 1: Write the failing test**

Add to `site/tests/e2e/hero.spec.ts`:

```ts
test('the home burger and its panel sit on the left', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await enterHome(page)

  const toggle = page.locator('[data-menu-toggle]')
  const toggleBox = await toggle.boundingBox()
  expect(toggleBox).not.toBeNull()
  expect(toggleBox!.x).toBeLessThan(200)

  await toggle.click()
  const panelBox = await page.locator('#home-menu').boundingBox()
  expect(panelBox).not.toBeNull()
  expect(panelBox!.x).toBeLessThan(200)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd site && E2E_PORT=4331 npx playwright test tests/e2e/hero.spec.ts -g "burger and its panel"`
Expected: FAIL because the toggle's `x` is near the right edge (about 1360).

- [ ] **Step 3: Align the home header and panel left**

In `site/src/components/layout/Header.astro`, change `.header__top--home` to use `justify-content: flex-start`. Change `.header__menu` from `right: 0` to `left: 0; right: auto`. Keep the existing `@media (max-width: 899px)` rule that sets `left: 0; right: 0`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd site && E2E_PORT=4331 npx playwright test tests/e2e/hero.spec.ts -g "burger and its panel"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/eliasvasnic/Documents/GitHub/Cyprus-Printmakers
git add site/src/components/layout/Header.astro site/tests/e2e/hero.spec.ts
git commit -m "fix(header): move the home burger to the left"
```

---

### Task 2: Auto-play the intro and shorten it

**Files:**
- Modify: `site/src/components/pages/HomeIntro.astro`
- Modify: `site/public/scripts/intro.js`
- Modify: `site/src/lib/i18n/ui.ts`
- Test: `site/tests/e2e/helpers.ts`, `site/tests/e2e/hero.spec.ts`

**Interfaces:**
- Consumes: `[data-home-intro]`, `.intro__stage`, `.hero-brand__lead`, `.hero-brand__tail`, `[data-hero-intro-body]`.
- Produces: `[data-intro-skip]` is the only interactive element in the cover; `html.dataset.intro` still cycles `pending → moving → handoff → revealing` and is removed when done.

- [ ] **Step 1: Update the helper and write the new behaviour test**

In `site/tests/e2e/helpers.ts`, replace `enterHome` so it waits for the intro to finish instead of clicking:

```ts
export async function enterHome(page: Page): Promise<void> {
  const intro = page.locator('[data-home-intro]')
  if ((await intro.count()) === 0 || !(await intro.isVisible())) return
  await expect(intro).toBeHidden({ timeout: 12000 })
}
```

Add to `site/tests/e2e/hero.spec.ts`:

```ts
test('the cover plays on its own and finishes quickly', async ({ page }) => {
  const started = Date.now()
  await page.goto('/')

  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await expect(page.getByRole('button', { name: /Skip intro/ })).toBeVisible()
  await expect(page.locator('h1[data-hero-lockup]')).toBeHidden()

  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 9000 })
  expect(Date.now() - started).toBeLessThan(7000)
  await expect(page.locator('h1[data-hero-lockup]')).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).not.toBe('main')
})

test('Skip intro ends the sequence and focuses main', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Skip intro/ }).click()
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 2000 })
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).toBe('main')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && E2E_PORT=4331 npx playwright test tests/e2e/hero.spec.ts -g "plays on its own|Skip intro"`
Expected: FAIL — no Skip button, and the cover waits indefinitely.

- [ ] **Step 3: Replace the cover button with a non-interactive cover and a Skip control**

In `site/src/components/pages/HomeIntro.astro`, remove the `<button class="intro__enter">` wrapper and its closing tag so `.intro__stage` sits directly under `.intro`. Add after the paragraph block:

```astro
<button class="intro__skip t-small" type="button" data-intro-skip>
  {t('home.skip', lang)}
</button>
```

Remove the `.intro__enter` CSS block. Add:

```css
.intro__skip {
  background: var(--paper);
  border: var(--rule);
  bottom: clamp(16px, 3vw, 32px);
  color: var(--ink);
  cursor: pointer;
  padding: 10px 16px;
  position: fixed;
  right: clamp(16px, 3vw, 32px);
  z-index: 2;
}

.intro__skip:hover {
  text-decoration: underline;
}

.intro__skip:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
}

html[data-intro='revealing'] .intro__skip {
  display: none;
}
```

In `site/src/lib/i18n/ui.ts`, remove `home.enter` and add `'home.skip': 'Skip intro'` (EN) and `'home.skip': 'Παράλειψη'` (EL). Keep every other key.

- [ ] **Step 4: Auto-start and compress the timeline in `intro.js`**

In `site/public/scripts/intro.js`:

1. Change the selector tuple from `[button, stage, lead, tail, body]` to `[stage, lead, tail, body]`; add `const skipButton = root.querySelector('[data-intro-skip]')`.
2. Add `let startTimer` and `let userSkipped = false` beside the other state.
3. In `done()`, clear `startTimer`, and call `focus()` only when `userSkipped` is true. `onReduce` still calls `focus()` explicitly through its existing timer.
4. In `skip()`, set `userSkipped = true` before revealing.
5. Replace the paragraph timeline with duration `3900` and these offsets:

```js
{ opacity: 0, clipPath: 'inset(0 0 100% 0)', offset: 0 },
{ opacity: 0, clipPath: 'inset(0 0 100% 0)', offset: 250 / 3900, easing: 'ease-out' },
{ opacity: 1, clipPath: 'inset(0)', offset: 1000 / 3900 },
{ opacity: 1, clipPath: 'inset(0)', offset: 3300 / 3900, easing: 'ease-out' },
{ opacity: 1, clipPath: 'inset(100% 0 0 0)', offset: 3750 / 3900, easing: 'ease-out' },
{ opacity: 0, clipPath: 'inset(100% 0 0 0)', offset: 1 },
```

6. Replace the final `if (!isEl(button)) return done()` and click handler with:
   - `root.addEventListener('click', skip)`
   - `skipButton?.addEventListener('click', event => { event.stopPropagation(); skip() })`
   - keep `document.addEventListener('keydown', onKey)` and the resize listener.
7. Replace `document.fonts?.ready.then(onResize).catch(done)` with an auto-start:

```js
const autoStart = async () => {
  try { await document.fonts?.ready } catch {}
  if (started || cleaned) return
  centre()
  startTimer = setTimeout(() => { if (!started && !cleaned) start() }, 450)
}
autoStart()
```

Set the watchdog from `15000` to `12000`.

- [ ] **Step 5: Convert the existing hero tests away from clicking**

In `site/tests/e2e/hero.spec.ts`, remove every `getByRole('button', { name: /Enter the Cyprus/ })` interaction. Where a test needs the sequence running, use:

```ts
await page.waitForFunction(() => document.documentElement.dataset.intro === 'moving')
```

Where it needs the hand-off, use `'revealing'`. Update these tests by hand:

- `the cover waits for a click…` → rename to `the cover plays without a click and keeps the page out of reach`; delete the click, wait for `moving`, then sample the paragraph 500ms later.
- `the greek intro paragraph…` → wait for the body to be visible instead of clicking.
- `the cover mark stays centred…` → delete the click; wait for `moving`.
- `the cover keeps a single mark…` → delete the click; wait for `moving`.
- `the hero stays put…` → wait for `revealing` directly.
- `Escape skips the sequence` and `Escape while the cover waits…` → remove the click; press Escape during `pending` or after `moving`.
- `the cover is keyboard operable` → focus `[data-intro-skip]` and press Enter; expect the intro hidden.
- `the skip link is hidden and tab cannot leave the cover button` → expect the only tabbable class to be `intro__skip`, and tab-wrapping to land on `.intro__skip` or `body`.
- `a rejected animation promise…` → remove the click and the `main` focus assertion; auto-start reaches the animation and the rejection still reveals the page.
- `a stalled timeline…` → with the clock installed, fast-forward 1000ms after load so the 450ms auto-start timer fires, wait for `moving`, then fast-forward 15000ms for the 12s watchdog. Remove the `main` focus assertion.
- Delete `the cover still holds after 16 seconds until clicked`; the new auto-play test already covers completion without a click.
- `the desktop paragraph…` → remove the click; wait for the paragraph opacity to become non-zero.
- `the 320px Greek hand-off…` → delete the click; wait for `revealing`.

- [ ] **Step 6: Run the hero suite**

Run: `cd site && E2E_PORT=4331 npx playwright test tests/e2e/hero.spec.ts`
Expected: PASS. Fix any timing assumptions against the real 3.9s paragraph and 450ms beat rather than extending timeouts arbitrarily.

- [ ] **Step 7: Commit**

```bash
cd /Users/eliasvasnic/Documents/GitHub/Cyprus-Printmakers
git add site/src/components/pages/HomeIntro.astro site/public/scripts/intro.js site/src/lib/i18n/ui.ts site/tests/e2e/helpers.ts site/tests/e2e/hero.spec.ts
git commit -m "feat(hero): play the intro automatically and shorten it"
```

---

### Task 3: Narrow the member model

**Files:**
- Modify: `site/src/lib/content/types.ts:127-149`
- Modify: `site/src/sanity/schemaTypes/document.ts:31`, `:347-434`, `:462-476`
- Modify: `site/src/lib/content/source.ts:84-89`
- Modify: `site/src/lib/content/translation.ts:10`
- Modify: `site/src/lib/content/preview.ts:35-44`
- Modify: `site/src/lib/content/fixtures/members.json`
- Test: `site/tests/unit/content.test.ts`, `site/tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: Sanity documents of `_type == "member"`.
- Produces:
  ```ts
  export type Member = {
    _id: string
    translations: Translations
    name: IntlValue[]
    website?: string
    status: MemberStatus
    featured: boolean
    order: number
  }
  ```
  `CommitteeMember` no longer has `memberRef`.

- [ ] **Step 1: Update the failing unit tests first**

In `site/tests/unit/schema.test.ts`, replace the member field test with:

```ts
it('keeps only the fields the public member directory uses', () => {
  const member = byName('member')!

  expect(fieldNames(member).sort()).toEqual(
    ['featured', 'name', 'order', 'status', 'website'].sort(),
  )
  expect(fieldType(member, 'name')).toBe('internationalizedArrayString')
  expect(fieldType(member, 'website')).toBe('url')
})
```

In `site/tests/unit/content.test.ts`:

- Replace the slug inventory assertion with names:
  ```ts
  expect(
    content.members.map(
      member => member.name.find(entry => entry.language === 'en')?.value,
    ),
  ).toEqual(['Maria Georgiou', 'Eleni Athanasiou', 'Andreas Petrou'])
  ```
- Find members by `_id` instead of `slug` in the translation tests (`member-georgiou`, `member-andreas-petrou`).
- Remove any assertion that reads `discipline`, `bio`, `portrait`, `email` or `slug` from a member.

- [ ] **Step 2: Run the unit tests to verify they fail**

Run: `cd site && npx vitest run tests/unit/schema.test.ts tests/unit/content.test.ts`
Expected: FAIL — extra fields and missing slugs.

- [ ] **Step 3: Narrow the type, schema, query, translation rule and preview map**

- `types.ts`: replace `Member` with the shape in Interfaces. Remove `memberRef?: string` from `CommitteeMember`.
- `document.ts`: in `PREVIEW_SELECT`, change `member` to `{ name: 'name' }`. In the `member` document type, keep only `name`, `website`, `status`, `featured`, `order`; delete `slugField()` and the `discipline`, `bio`, `portrait`, `email`, `instagram`, `joinedYear`, `membershipType` fields. Delete `memberRef` from `committeeMember`.
- `source.ts`: replace the member projection with:
  ```
  "members": *[_type == "member"] | order(order asc){
    _id,
    _type,
    name,
    website,
    status,
    featured,
    order
  },
  ```
- `translation.ts`: `member: ['name']`.
- `preview.ts`: remove `'member'` from `PreviewDocType` and delete the `prefix === 'members'` branch.

- [ ] **Step 4: Trim the member fixtures**

In `site/src/lib/content/fixtures/members.json`, keep only `_id`, `order`, `featured`, `status`, `website`, `name` on each member. Keep Maria and Eleni featured and Andreas not featured. Keep Andreas's English-only name.

- [ ] **Step 5: Run the unit tests to verify they pass**

Run: `cd site && npx vitest run tests/unit`
Expected: PASS. If import-fixture tests fail, leave the import script alone and only adjust tests that read the public `Member` shape.

- [ ] **Step 6: Commit**

```bash
cd /Users/eliasvasnic/Documents/GitHub/Cyprus-Printmakers
git add site/src/lib/content/types.ts site/src/sanity/schemaTypes/document.ts site/src/lib/content/source.ts site/src/lib/content/translation.ts site/src/lib/content/preview.ts site/src/lib/content/fixtures/members.json site/tests/unit/content.test.ts site/tests/unit/schema.test.ts
git commit -m "refactor(content): narrow members to name and website"
```

---

### Task 4: Render name-plus-arrow rows and remove member routes

**Files:**
- Modify: `site/src/components/pages/MembersView.astro`
- Modify: `site/src/components/pages/AboutView.astro:64-90`
- Delete: `site/src/components/pages/MemberView.astro`
- Delete: `site/src/pages/members/[slug].astro`
- Delete: `site/src/pages/[lang]/members/[slug].astro`
- Delete: `site/public/scripts/members-bio.js`
- Modify: `site/vercel.json`
- Test: `site/tests/e2e/members.spec.ts`, `site/tests/e2e/seo.spec.ts`, `site/tests/unit/deployment.test.ts`

**Interfaces:**
- Consumes: `Member` from Task 3.
- Produces: `[data-member]` rows contain `.members__number`, `.members__name`, and optionally `a.members__website` with an inline SVG.

- [ ] **Step 1: Write the failing tests**

Replace `site/tests/e2e/members.spec.ts` with tests that assert the new surface:

```ts
import { expect, test } from '@playwright/test'

test.describe('members index', () => {
  test('shows committee and a name-only directory', async ({ page }) => {
    await page.goto('/members')

    await expect(page.getByRole('heading', { name: /committee/i })).toBeVisible()
    await expect(page.locator('[data-member]')).toHaveCount(3)
    await expect(page.locator('[data-member-count]')).toHaveText('3 members')
    await expect(page.locator('.members__entry')).toHaveCount(0)
    await expect(page.locator('main a[href^="/members/"]')).toHaveCount(0)
    await expect(page.locator('main img')).toHaveCount(0)
    await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0)
  })

  test('puts a website arrow next to the name that has a site', async ({ page }) => {
    await page.goto('/members')

    const row = page.locator('[data-member]').filter({ hasText: 'Maria Georgiou' })
    const link = row.getByRole('link', { name: /Website/ })
    await expect(link).toHaveAttribute('href', 'https://mariageorgiou.example')
    await expect(link.locator('svg')).toHaveCount(1)

    const noSite = page.locator('[data-member]').filter({ hasText: 'Andreas Petrou' })
    await expect(noSite.getByRole('link')).toHaveCount(0)
  })

  test('featured members do not link to profiles', async ({ page }) => {
    await page.goto('/members')

    await expect(page.getByRole('heading', { name: 'Featured members' })).toBeVisible()
    await expect(page.locator('.members__featured-list a[href^="/members/"]')).toHaveCount(0)
    await expect(page.locator('.members__featured-list a')).toHaveCount(2)
  })

  test('filters by first-name letter and updates the count', async ({ page }) => {
    await page.goto('/members')

    await page.getByRole('button', { name: 'M', exact: true }).click()
    await expect(page.locator('[data-member]:not([hidden])')).toHaveCount(1)
    await expect(page.locator('[data-member-count]')).toHaveText('1 member')

    await page.getByRole('button', { name: 'M', exact: true }).click()
    await expect(page.locator('[data-member]:not([hidden])')).toHaveCount(3)
    await expect(page.locator('[data-member-count]')).toHaveText('3 members')
  })

  test('greek index counts members in greek and stays noindex', async ({ page }) => {
    await page.goto('/el/members')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.locator('[data-member-count]')).toHaveText('3 μέλη')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('the full list is in the HTML without JavaScript', async ({ browser }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false })
    const raw = await noJs.newPage()

    const baseURL = String(test.info().project.use.baseURL)
    await raw.goto(`${baseURL}/members`)
    await expect(raw.locator('[data-member]')).toHaveCount(3)

    await noJs.close()
  })
})
```

In `site/tests/e2e/seo.spec.ts`, delete the two member-detail tests (`a greek member with untranslated prose…`, `fully translated greek pages stay indexable`) and add:

```ts
test('the english members directory is indexable', async ({ page }) => {
  await page.goto('/members')
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
})
```

Create `site/tests/unit/deployment.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const config = JSON.parse(
  readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
) as { redirects: Array<{ source: string; destination: string; permanent?: boolean }> }

describe('vercel redirects', () => {
  it('sends retired member profiles back to the directory', () => {
    expect(config.redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/members/:slug',
          destination: '/members',
          permanent: true,
        }),
        expect.objectContaining({
          source: '/el/members/:slug',
          destination: '/el/members',
          permanent: true,
        }),
      ]),
    )
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd site && npx vitest run tests/unit/deployment.test.ts && E2E_PORT=4331 npx playwright test tests/e2e/members.spec.ts tests/e2e/seo.spec.ts`
Expected: FAIL — rows still use `<details>`, profile links and images exist, and the redirects are absent.

- [ ] **Step 3: Rewrite the directory and featured block**

In `site/src/components/pages/MembersView.astro`:

- Remove imports `Prose`, `pickRich`, `localePath` if no longer used, and the `members-bio.js` script tag.
- Featured entry: render a name plus the same website arrow when `person.website` exists; no discipline, no profile link.
- Committee entry: always a `<span class="members__committee-name t-body">` with the name and role; no `memberRef`.
- Directory entry:

```astro
<li class="members__item" data-member data-letter={letter}>
  <span class="members__number" aria-hidden="true">{index + 1}</span>
  <span class="members__name">
    <LocalizedText value={member.name} lang={lang} />
    {website && (
      <a
        class="members__website"
        href={website}
        rel="noopener"
        aria-label={`${name} — ${t('members.website', lang)}`}
      >
        <svg viewBox="0 0 12 12" width="13" height="13" aria-hidden="true">
          <path d="M3 9L9 3M9 3H4M9 3V8" fill="none" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </a>
    )}
  </span>
</li>
```

Use a grid row (`grid-template-areas: 'number name'`), a 44px minimum height, and `.members__website { display: inline-flex; margin-left: 8px; vertical-align: -1px; }`. On hover, translate the SVG by `2px, -2px` with `var(--motion-fast) var(--ease-out-expo)`. Remove the old absolute positioning and the bio/details styles.

- [ ] **Step 4: Remove profile links and routes**

- In `site/src/components/pages/AboutView.astro`, replace the committee `href` logic with a plain name; remove the now-unused `localePath` import if nothing else uses it.
- Delete `site/src/components/pages/MemberView.astro`, `site/src/pages/members/[slug].astro`, `site/src/pages/[lang]/members/[slug].astro` and `site/public/scripts/members-bio.js`.

- [ ] **Step 5: Add the redirects**

In `site/vercel.json`, add to `redirects` before the support entries:

```json
{ "source": "/members/:slug", "destination": "/members", "permanent": true },
{ "source": "/el/members/:slug", "destination": "/el/members", "permanent": true }
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/unit/deployment.test.ts && E2E_PORT=4331 npx playwright test tests/e2e/members.spec.ts tests/e2e/seo.spec.ts`
Expected: PASS. The old `/members/georgiou` path is no longer reachable in the dev server; the redirect test covers the Vercel config.

- [ ] **Step 7: Commit**

```bash
cd /Users/eliasvasnic/Documents/GitHub/Cyprus-Printmakers
git add -A site/src/components/pages site/src/pages site/public/scripts site/vercel.json site/tests
git commit -m "feat(members): replace profiles with name and website rows"
```

---

### Task 5: Update privacy copy and unused strings

**Files:**
- Modify: `site/src/components/pages/PrivacyView.astro:67-71`, `:108-111`, `:135`, `:154`
- Modify: `site/src/lib/i18n/ui.ts`
- Test: `site/tests/e2e/privacy.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: privacy text that matches the name-plus-website model.

- [ ] **Step 1: Write the failing assertions**

Add to `site/tests/e2e/privacy.spec.ts`:

```ts
test('describes member listings as a name and optional website', async ({ page }) => {
  await page.goto('/privacy')

  const main = page.locator('main')
  await expect(main).toContainText('their name')
  await expect(main).toContainText('link to their website')
  await expect(main).not.toContainText('portrait')
  await expect(main).not.toContainText('Instagram')
  await expect(main).not.toContainText('biography')
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd site && E2E_PORT=4331 npx playwright test tests/e2e/privacy.spec.ts -g "name and optional website"`
Expected: FAIL — the page still promises portraits and Instagram.

- [ ] **Step 3: Rewrite the profile copy**

In `site/src/components/pages/PrivacyView.astro`:

- Replace the member-profiles paragraph with: “**Member listings.** With a member's agreement, we publish their name and, where they have one, a link to their website on the members page. A member can ask us to remove or change this at any time.”
- Replace the table row with “Publish member names and website links” / “Name and website address” / “Consent”.
- Change “including published member profiles” to “including published member listings”.
- Change the retention line to “**Published member listings:** until the member leaves or asks us to remove them.”

In `site/src/lib/i18n/ui.ts`, remove `members.profile`, `members.email`, `members.instagram` and `members.joined` from both locales. Keep `members.website`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd site && npx vitest run tests/unit/i18n.test.ts && E2E_PORT=4331 npx playwright test tests/e2e/privacy.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/eliasvasnic/Documents/GitHub/Cyprus-Printmakers
git add site/src/components/pages/PrivacyView.astro site/src/lib/i18n/ui.ts site/tests/e2e/privacy.spec.ts
git commit -m "docs(privacy): describe member listings as name and website"
```

---

### Task 6: Prepare the `cyprintmakers.com` cutover

**Files:**
- Modify: `site/astro.config.mjs:24`
- Modify: `site/playwright.config.ts:24-27`
- Modify: `site/tests/e2e/seo.spec.ts:8-10`
- Modify: `site/.env`, `site/.env.example`, `site/README.md:55-66`
- Modify: `site/vercel.json`
- Modify: `site/tests/unit/deployment.test.ts`
- Create: `docs/qa/2026-11-25-domain-cutover.md`

**Interfaces:**
- Consumes: nothing.
- Produces: the repo expects `https://www.cyprintmakers.com`; apex redirects to `www`; the remaining dashboard steps are written down.

- [ ] **Step 1: Write the failing config test**

Extend `site/tests/unit/deployment.test.ts`:

```ts
it('redirects the apex domain to www', () => {
  expect(config.redirects).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        source: '/:path*',
        has: [{ type: 'host', value: 'cyprintmakers.com' }],
        destination: 'https://www.cyprintmakers.com/:path*',
        permanent: true,
      }),
    ]),
  )
})
```

Type the config as `{ redirects: Array<Record<string, unknown>> }` so `has` compiles.

- [ ] **Step 2: Run it to verify it fails**

Run: `cd site && npx vitest run tests/unit/deployment.test.ts`
Expected: FAIL — no host redirect.

- [ ] **Step 3: Move the canonical origin and add the apex redirect**

- `astro.config.mjs`: fallback site URL becomes `https://www.cyprintmakers.com`.
- `playwright.config.ts`: `PUBLIC_SITE_URL: 'https://www.cyprintmakers.com'`.
- `seo.spec.ts`: expected canonical becomes `https://www.cyprintmakers.com/about`.
- `site/.env`: `PUBLIC_SITE_URL=https://www.cyprintmakers.com`.
- `site/.env.example`: keep the same example value and comment.
- `vercel.json`: add as the first redirect:

```json
{
  "source": "/:path*",
  "has": [{ "type": "host", "value": "cyprintmakers.com" }],
  "destination": "https://www.cyprintmakers.com/:path*",
  "permanent": true
}
```

- [ ] **Step 4: Document the steps that need the deploy owner**

Create `docs/qa/2026-11-25-domain-cutover.md` with:

```md
# cyprintmakers.com cutover

DNS nameservers for cyprintmakers.com are already `ns1.vercel-dns.com` and
`ns2.vercel-dns.com`. Because the domain is not attached to a Vercel project,
Vercel's nameservers currently answer `REFUSED` and the domain does not resolve.

Code-side changes are in place (`PUBLIC_SITE_URL`, apex redirect, tests).

Remaining, in the association's Vercel project (the one serving
`cyprus-printmakers-web.vercel.app`):

1. Domains → add `cyprintmakers.com` and `www.cyprintmakers.com`.
2. Set the apex domain to redirect to `www`.
3. Production env: `PUBLIC_SITE_URL=https://www.cyprintmakers.com`,
   `PUBLIC_STAGING=false`; redeploy.
4. Sanity Manage → API → CORS origins: add `https://www.cyprintmakers.com`
   and `https://cyprintmakers.com` (credentials allowed), keep the Vercel and
   localhost origins.
5. Sanity webhook `Vercel rebuild`: point at
   `https://www.cyprintmakers.com/api/sanity-webhook`.
6. Resend → Domains: verify `cyprintmakers.com`, add the SPF/DKIM records in
   Vercel DNS, then set `RESEND_FROM_EMAIL` and the committee recipients.
7. Verify: `/robots.txt` allows crawlers, no staging badge, canonical and
   sitemap use `https://www.cyprintmakers.com`, `/members/old-slug` 308s to
   `/members`.

The local Sanity CLI is not logged in and the association Vercel project is not
under the accessible team, so steps 1-6 cannot be run from this checkout.
```

Update the README Deploy section to point at this document instead of listing the old staging origin.

- [ ] **Step 5: Run the config and SEO tests**

Run: `cd site && npx vitest run tests/unit/deployment.test.ts && E2E_PORT=4331 npx playwright test tests/e2e/seo.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/eliasvasnic/Documents/GitHub/Cyprus-Printmakers
git add site/astro.config.mjs site/playwright.config.ts site/tests/e2e/seo.spec.ts site/.env.example site/README.md site/vercel.json site/tests/unit/deployment.test.ts docs/qa/2026-11-25-domain-cutover.md
git commit -m "chore(deploy): prepare the cyprintmakers.com cutover"
```

`site/.env` is gitignored; edit it locally but do not stage it.

---

### Task 7: Full verification

- [ ] **Step 1: Run the whole unit suite**

Run: `cd site && npm test`
Expected: all files pass, 0 failures.

- [ ] **Step 2: Run the type check**

Run: `cd site && npm run check`
Expected: 0 errors, 0 warnings, 0 hints.

- [ ] **Step 3: Build**

Run: `cd site && npm run build`
Expected: build completes and the Studio copies.

- [ ] **Step 4: Run the whole e2e suite**

Run: `cd site && E2E_PORT=4331 npx playwright test`
Expected: all tests pass, only the pre-existing staging-marker test skipped.

- [ ] **Step 5: Manual smoke on the built/dev site**

At 1440×900, 1280×720 and 390×844:

- The burger is at the left edge and the panel opens left.
- The intro plays without a click in under 7s; Skip and Escape both work.
- The mark does not move at the hand-off.
- `/members` has no profile links, no images, no emails; Maria has an inline ↗ on the right of her name; Andreas has none.
- `/el/members` filters and counts.
- `/privacy` no longer promises portraits or Instagram.

- [ ] **Step 6: Commit any QA note and push**

```bash
cd /Users/eliasvasnic/Documents/GitHub/Cyprus-Printmakers
git add -A
git commit -m "test: verify second round feedback"
git push
```

Then wait for the Vercel deploy and repeat the smoke on
`https://cyprintmakers.densetheory.cc` (domain cutover pending the dashboard
steps).
