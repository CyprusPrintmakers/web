# Typography, members directory and membership request page

**Date:** 2026-11-04
**Status:** approved for phase 1 (type foundation + membership page); directory phase next
**Scope:** site-wide type foundation, `/members`, `/membership`, a small profile-page pass, two content bugs

## 1. Why

Review of the live staging site found:

- **One fixed type scale at every width.** Body 24px, display 36, title 32, small 20 — display and title are almost the same size, so the hierarchy is flat. Nothing changes at breakpoints; all nine media queries are layout-only. Everything is in `px`, so browser text-size settings do not scale the page.
- **Body text is too large and set too wide.** A member bio is 24px on a 960px measure (~110 characters a line); on a 390px phone it is still 24px and wraps at roughly 28 characters. The About history is forced to 36px even on a phone.
- **The members page is a list of links with no use of the content the archive provided.** Emails and bios are in Sanity but invisible; the page repeats “Printmaker” for every row and sends people to separate pages to read a paragraph.
- **The membership page leads with tier tables whose prices are unconfirmed**, then a six-field form, when the association only needs an application: who you are, how to reach you, why you want to join, and a CV.
- **Project pages repeat their summary** directly under the cover image, because the import sets `summary` to the first paragraph and keeps that paragraph in `body`.
- **Greek project summaries are corrupted** (`ι ́ - ά ή , έ ώ …` instead of «Μεταξοτυπία και Στένσιλ»). The year-page parser strips named HTML entities, which is how Wix encodes Greek.

## 2. Intent

Make the site read like a well-set printed index: comfortable body text, a clear hierarchy, a member directory that reveals each bio in place, and a membership page that asks only what the committee needs.

The mockups supplied on 2026-11-04 are the visual source for the members index and the membership page. The font stays **Geologica**; no new typefaces.

## 3. Goals

- Body text at 17px on mobile and 20px on desktop, 1.5 line height, measure capped at ~65 characters, left-aligned (ragged right).
- A four-step hierarchy (display / title / body / small) that is visibly distinct at every width.
- A members index that shows committee, A–Z filter, numbered member rows, email addresses, and an inline grey bio with a permalink to the member's page.
- A membership page that is a single request form: back link, short intro, name/email/mobile/why/CV, consent, submit.
- Fix the repeated project summary and the corrupted Greek summaries.
- WCAG 2.2 AA: 4.5:1 text contrast, 24×24 touch targets, visible focus, native disclosure semantics, no reliance on hover.

## 4. Non-goals

- No font change, no new font files, no variable-font work.
- No pricing or tier table on the membership page (tiers remain in Sanity and on `/support`).
- No new Sanity schema fields.
- No Greek translation of the About/Contact copy (the archive has none).
- No redesign of the header/navigation beyond type size.
- No change to the home intro or motion system.
- Committee names still appear in both the committee list and the full directory; that repetition is meaningful and stays.

## 5. Approaches considered

**Typography**
- *A — global fluid scale in tokens (chosen).* Four `clamp()` tokens in `tokens.css`, used by the existing `.t-*` utilities and `Prose`. One change reaches every page; no page keeps a bespoke size.
- *B — page-by-page sizes.* More control per screen, but drifts and requires every page to be revisited for each future change. Rejected.

**Members directory**
- *A — native `<details name="member">` disclosure (chosen).* Works without JavaScript, keyboard and screen-reader semantics for free, exclusive accordion via the `name` attribute, styling stays simple. Older browsers that ignore `name` simply allow several open at once.
- *B — JS accordion with `aria-expanded`.* More animation control, more code, a no-JS fallback to build. Rejected.
- *C — keep separate profile pages only.* Doesn't address the “thrown on” complaint and hides the bios. Rejected.

**Membership**
- *A — replace tiers/process with the request form (chosen).* Matches the mockup, removes unconfirmed prices, fewer fields.
- *B — keep tiers below the form.* Still shows invented prices and lengthens the page. Rejected.

## 6. Typography

### 6.1 Tokens (`src/styles/tokens.css`)

```css
--text-small:   clamp(0.875rem, 0.84rem + 0.15vw, 0.9375rem);  /* 14 → 15 */
--text-note:    clamp(1rem,     0.95rem + 0.2vw,  1.125rem);    /* 16 → 18 */
--text-body:    clamp(1.0625rem, 0.98rem + 0.35vw, 1.25rem);    /* 17 → 20 */
--text-title:   clamp(1.375rem, 1.1rem + 1.1vw,   2rem);        /* 22 → 32 */
--text-display: clamp(2rem,     1.3rem + 2.8vw,    3.5rem);     /* 32 → 56 */
--measure:      65ch;
```

Line heights: display 1.05, title 1.15, body 1.5, note 1.45, small 1.4.

### 6.2 Rules

- `body` uses `--text-body`; `.t-display`, `.t-title`, `.t-body`, `.t-small` map to the tokens.
- Add `.t-note` for bios and secondary copy (16–18px), used by the member bio.
- Add `.t-label` for “Printmaker”-style metadata: `--text-small`, uppercase via `text-transform` (DOM text stays sentence case for screen readers), `letter-spacing: 0.08em`, `--muted-text`.
- `.prose` uses `--text-body`, `max-width: var(--measure)`, line-height 1.5; paragraph spacing `0 0 0.9em`.
- Headings get `text-wrap: balance`; paragraphs get `text-wrap: pretty` (progressive enhancement).
- Remove the About history 36px override; history runs at body size.
- Member profile discipline changes from `.t-title` (32px) to `.t-label`.
- Header nav: `--text-note` (16–18px) instead of 20px, tighter gaps on mobile. No structural change.
- Body is left-aligned everywhere. No `text-align: justify` — uneven word spacing hurts readability, especially for dyslexic readers; the measure does the work instead.
- Keep contrast tokens: `--muted-text` (#6e6e6e) is the lightest grey allowed for text (5.1:1 on white). The mockups' lighter grey is not used for copy.

## 7. Members directory (`/members`, `/el/members`)

### 7.1 Structure

1. **“Become a member →”** — bold body-size link at the top to the membership page.
2. **Executive Committee Members** — heading set as a muted label (“Executive Committee Members” in English, “Εκτελεστική Επιτροπή” in Greek), then the seven rows: name left, role right, roles in `--muted-text`. Names link to their member page (slugs stay). No rule under the block.
3. **All members** — body-size black heading. Below it a muted count (“18 members”) that updates when a filter is applied.
4. **A–Z filter** — only the letters present in the directory are buttons (styled with wide tracking and muted colour; the active letter goes black/underlined). Showing all 26 would leave 15 dead controls. Keyboard focusable, `aria-pressed`.
5. **Directory rows**, sorted by first name (`localeCompare(lang)`), numbered `1..n`:
   - Desktop grid: number (2.5rem) · name · email.
   - Rows are `<details name="member">`; `<summary>` is the grid row, with the default marker hidden.
   - Email is a `mailto:` link in `--muted-text`; clicking it must not toggle the row (small click guard).
   - On <600px: number and name on the first line, email under the name in note size; tap target ≥44px.
   - No horizontal rules between rows (whitespace separates them, as in the mockup).
6. **Expanded bio** — full bio in a `<div>` inside the details, indented to the name column, `--text-note`, `--muted-text`, measure 65ch, paragraphs preserved. Ends with **“Full profile →”** linking to `/members/<slug>`.
7. **Exclusive accordion** — `name="member"` means opening one closes the rest in supporting browsers; older browsers allow several open (acceptable fallback).

### 7.2 Behaviour

- Search input is removed (the mockup has none; 18 members and A–Z are enough).
- Letter filtering hides rows; hidden rows keep their open state.
- No JavaScript is required to read any bio; the filter script remains for the letters and count.
- If a hash like `#member-aznive-papazian` is present, open that row and scroll to it (small progressive enhancement, used by shared links).

### 7.3 Profile pages (`/members/<slug>`)

Kept and linked as permalinks. Minor pass only:

- New type scale; discipline as `.t-label`.
- Portrait stays a bordered plate but capped at `min(70vh, 640px)` height with `object-fit: contain` so tall images don't take over the page.
- Bio uses the 65ch measure.
- Add a back link “← All members”.

## 8. Membership page (`/membership`, `/el/membership`)

### 8.1 Structure

- **“← Become a member”** link at the top back to `/members`.
- **Body copy is black first.** The intro and the workshop note are black; grey is reserved for labels, secondary metadata and the bios in the directory.
- **Intro paragraph** from `membership.intro`, at body size, measure capped. Copy updated to remove “Choose the tier”: “Membership supports the association's exhibitions, workshops and archive. Tell us about your practice and send your CV; the committee reviews applications as they arrive.” Greek equivalent written alongside it.
- The `membership.formIntro` paragraph and the “Membership form” h2 are removed with the process section; the field stays in Sanity unused rather than being deleted from the schema.
- **Application form** (`/api/membership`):
  - Fields: Full name* (name), Email* (email), Mobile number (phone), Why do you want to become a member?* (message), Send us your CV* (cv), consent checkbox.
  - Remove the tier select and practice field from the form, validation, and committee email.
  - Make `message` required and `cv` required in both client and server validation; add `form.errors.message` reuse and `form.errors.cvRequired`.
  - Uppercase labels via CSS (`text-transform`), `--text-small`, black.
  - Underline fields: transparent background, 1px bottom rule, 48px minimum height, visible focus.
  - “Fields marked * are required” as a single note beside the first field on desktop, above the form on mobile, `--muted-text`.
  - CV control: label “Send us your CV* →” styled as a link; native file input visually hidden but focusable; chosen filename shown; note “PDF, DOC or DOCX, up to 4 MB.”
  - Submit: pill button, `--control` background, black text, 34px radius, 44px minimum height; inverts on hover.
  - Consent checkbox and privacy block stay, restyled to the new scale.
- **Remove** `TierList` and the process steps from this page. `/support` keeps its tiers.
- **Confirmed 2026-11-04:** the membership page is the application form only; the tier/donations mockup is not built while prices are unconfirmed.

### 8.2 Copy changes

- “PLEASE TELLS US…” → “Please tell us why you want to become a member”.
- “SPACES WITH * ARE OBLIGATORY” → “Fields marked * are required”.
- Back link “Become a member” (matches the directory's forward link).

## 8A. About page picture (later phase)

The workshop photograph starts offset to the **right** of its final position and slides horizontally into place; it does not move vertically — its vertical position is the resting position from the start. Trigger when it enters the viewport, once per page view, and disable under `prefers-reduced-motion`. This belongs with the About/header visual pass, not phase 1.

## 9. Bugs

1. **Greek summaries.** `parseYearProjects` uses `decodeEntities`, which replaces named entities such as `&Mu;` with spaces. Switch year parsing to the full decoder used by the page parsers (`decodeHTML`, strip tags, drop zero-width characters), keep the decorative-entity behaviour where it matters, and add a regression test with a Greek entity-encoded subtitle. Re-run `npm run import:content`.

   The full import is safe: every project, member and committee document was generated by this script, there are no hand-curated galleries, participants, dates or bilingual bios yet, and the script now includes the Greek names. It does reset home `CURRENT` to the first 2019 project, which is its intended state. Export the dataset first as a backup.
2. **Repeated project summary.** In `ProjectView`, compare the summary with the first body paragraph after normalising whitespace; the import slices the summary to 280 characters, so treat a first paragraph that *starts with* the summary as a duplicate. When it matches, render the lead only and pass the remaining paragraphs to `Prose`; otherwise keep both. Keep the full summary on index cards. Add a unit test covering the exact match, the truncated-prefix match, and the distinct-summary case.

## 10. Accessibility requirements

- Contrast ≥4.5:1 for all copy; grey never lighter than `--muted-text`.
- Disclosure is a native `<summary>`; keyboard Enter/Space toggles; focus ring visible.
- Letter filter buttons expose `aria-pressed`; the count is `aria-live="polite"`.
- Email links inside the summary do not toggle the row.
- Form labels are real `<label>` associations; errors use the existing error slots and `aria-describedby`.
- File input remains operable by keyboard and announced; the styled label does not hide the input from the accessibility tree (visually hidden, not `display:none`).
- Touch targets ≥24×24 (rows and buttons ≥44px tall where practical).
- No text in images; `prefers-reduced-motion` respected if any expansion animation is added.

## 11. Content and data changes

- Patch `membershipPage.intro` (EN + EL) to drop the tier sentence.
- No schema changes; `tiers` and `processSteps` remain in the dataset for `/support` and future use.
- No new member data.

## 12. Files likely touched

- `src/styles/tokens.css`, `src/styles/base.css`
- `src/components/ui/Prose.astro`, new `.t-note`/`.t-label` utilities
- `src/components/pages/MembersView.astro`, `src/components/filters/MemberFilter.astro`, `public/scripts/members-filter.js`
- `src/lib/members/filter.ts` (first-name grouping/sorting)
- `src/components/pages/MemberView.astro`
- `src/components/pages/MembershipView.astro`, `src/components/forms/MembershipForm.astro`
- `src/lib/forms/validate.ts`, `src/lib/forms/email.ts`, `src/lib/i18n/ui.ts`
- `src/components/pages/ProjectView.astro`, `scripts/lib/archive.ts`
- `src/components/pages/AboutView.astro` (history size), `src/components/layout/Header.astro` (nav size)
- tests: `tests/e2e/members.spec.ts`, `tests/e2e/membership.spec.ts`, `tests/e2e/forms.spec.ts`, `tests/e2e/a11y.spec.ts`, unit tests for archive/project helpers
- `docs/design-deviations.md`, `docs/qa/…`

## 13. Testing

- Unit: Greek entity parsing; summary-dedupe helper; first-name sort/grouping; membership validation requires email/why/CV.
- E2E (fixtures): the three fixture members gain test-only email addresses and two more members (distinct initials, one long email) so the directory grid, email toggling and filtering are representative; the counts in the existing assertions move from 3 to 5.
- E2E (fixtures): committee heading and links; details opens on click and by keyboard; only one open at a time (supporting browser); email click does not toggle; A–Z filter; no-JS bios visible.
- E2E membership: no tier table; required fields; CV requirement; consent; Greek labels; `/support` still shows tiers.
- Visual check at 390px and 1440px for `/`, `/about`, `/members`, a member page, `/projects`, `/membership`.
- Lighthouse accessibility on `/members` and `/membership`.

## 14. Rollout

Implement in the agreed order — type foundation → directory → membership — with the two bug fixes first. Push to `site-build`; the association's Vercel project builds from Git. Verify on `cyprus-printmakers-web.vercel.app` and `cyprintmakers.densetheory.cc`.

Content writes (membership intro, project re-import) use the write-capable `SANITY_API_READ_TOKEN` already present in `site/.env`; export the production dataset before the import.

## 15. Decisions taken as the builder

- A–Z shows present letters only, not all 26 (avoids dead controls); visual treatment matches the mockup.
- Committee names link to their profile pages; directory rows expand in place; both link to the kept slugs.
- Mobile moves the email under the name rather than hiding it.
- The lighter mockup grey is not used for anything that must be read; `--muted-text` is the floor.
- The membership intro copy is rewritten in both languages to remove the tier reference.
