# Typography Foundation + Membership Request Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed 24px type with a fluid, accessible scale, and turn `/membership` into the single application form from the mockup (no tiers, no process steps).

**Architecture:** Four `clamp()` tokens in `src/styles/tokens.css` feed the existing `.t-*` utilities and `Prose`. The membership page drops the tier table and process list, keeps its Sanity intro, privacy block and `/api/membership` route, and renders a five-field form with underline styling. Validation, the committee email, and both languages are updated in the same pass.

**Tech Stack:** Astro 7 (static), Sanity content, Resend email, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-typography-directory-membership-design.md` (§6, §8, §10)

## Global Constraints

- Font stays **Geologica**; no new font files or families.
- No shadows, gradients, or border radii other than `0`, `34px`, `50%`, `var(--radius-pill)` (enforced by `tests/unit/design-guard.test.ts`).
- Text never lighter than `--muted-text` (#6e6e6e) on white.
- Body copy is left-aligned; no `text-align: justify`.
- Membership fields: Full name*, Email*, Mobile number, Why*, CV*, consent. Email, why and CV are required in client and server validation.
- Greek copy ships with every new English string.
- Mobile behaviour is part of done: 390px wide, no horizontal scroll, 200% text zoom without clipping.

## Review Focus

- Long Greek uppercase labels and long email addresses at 390px — must wrap, not overflow.
- The CV input remains keyboard-operable and announced although its label is styled as a link.
- No-JS submit: required fields, including CV, are enforced by the browser before POST.
- 200% browser text zoom: no overlapping labels, no clipped pill button.
- A CV file larger than 4 MB or the wrong type still returns the existing field error after the required flag changes.

---

### Task 1: Fluid type tokens and utilities

**Files:**
- Modify: `site/src/styles/tokens.css`
- Modify: `site/src/styles/base.css`
- Test: `site/tests/unit/typography.test.ts` (create)

**Interfaces:**
- Produces: CSS custom properties `--text-small`, `--text-note`, `--text-body`, `--text-title`, `--text-display`, `--measure`, and utilities `.t-note`, `.t-label`.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync('src/styles/tokens.css', 'utf8')
const base = readFileSync('src/styles/base.css', 'utf8')

describe('type scale', () => {
  it('defines the four fluid sizes and the measure', () => {
    for (const name of ['--text-small', '--text-note', '--text-body', '--text-title', '--text-display', '--measure']) {
      expect(tokens).toContain(`${name}:`)
    }
    expect(tokens).toContain('clamp(')
    expect(tokens).toContain('--measure: 65ch')
  })

  it('drives the utilities from the tokens instead of fixed px', () => {
    expect(base).toMatch(/\.t-body\s*{[^}]*var\(--text-body\)/)
    expect(base).toMatch(/\.t-display\s*{[^}]*var\(--text-display\)/)
    expect(base).toMatch(/\.t-note\s*{[^}]*var\(--text-note\)/)
    expect(base).toMatch(/\.t-label\s*{[^}]*var\(--text-small\)/)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx vitest run tests/unit/typography.test.ts`
Expected: FAIL on the missing token names.

- [ ] **Step 3: Add the tokens and utilities**

In `tokens.css`:

```css
--text-small:   clamp(0.875rem, 0.84rem + 0.15vw, 0.9375rem);
--text-note:    clamp(1rem, 0.95rem + 0.2vw, 1.125rem);
--text-body:    clamp(1.0625rem, 0.98rem + 0.35vw, 1.25rem);
--text-title:   clamp(1.375rem, 1.1rem + 1.1vw, 2rem);
--text-display: clamp(2rem, 1.3rem + 2.8vw, 3.5rem);
--measure: 65ch;
```

In `base.css`: `body { font-size: var(--text-body); line-height: 1.5; }`; map `.t-display` to `--text-display` / 1.05, `.t-title` to `--text-title` / 1.15, `.t-body` to `--text-body` / 1.5, `.t-small` to `--text-small` / 1.4. Add `.t-note` (`--text-note`, 1.45) and `.t-label` (`--text-small`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `color: var(--muted-text)`, line-height 1.3). Add `text-wrap: balance` to `.t-display` and `.t-title`, `text-wrap: pretty` to `p`.

- [ ] **Step 4: Run the test**

Run: `cd site && npx vitest run tests/unit/typography.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/src/styles/tokens.css site/src/styles/base.css site/tests/unit/typography.test.ts
git commit -m "feat(type): add the fluid type scale"
```

---

### Task 2: Apply the scale to prose and page overrides

**Files:**
- Modify: `site/src/components/ui/Prose.astro`
- Modify: `site/src/components/pages/AboutView.astro`
- Modify: `site/src/components/pages/MemberView.astro`
- Modify: `site/src/components/layout/Header.astro`

**Interfaces:**
- Consumes: tokens from Task 1.

- [ ] **Step 1: Update `Prose`**

`.prose { font-size: var(--text-body); line-height: 1.5; max-width: var(--measure); }`, paragraph margin `0 0 0.9em`, `h2` uses `--text-title`, `h3` uses `--text-note` with weight 400 and margin `2em 0 0.75em`.

- [ ] **Step 2: Remove the About history override**

Delete the `.about__history :global(.prose) { font-size: 36px; line-height: 1.3; }` block and its comment. History now matches body copy.

- [ ] **Step 3: Member page**

Change `.member__discipline` from `t-title` to `t-label` in the markup. `.member__bio` keeps the new `Prose` measure. Cap the portrait: `.member .figure__image { max-height: min(70vh, 640px); object-fit: contain; }`.

- [ ] **Step 4: Header nav size**

In `Header.astro`, set the nav links to `font-size: var(--text-note)` and keep the existing gaps; add a 390px rule that allows two rows with `row-gap: 8px`. No structural change.

- [ ] **Step 5: Verify**

Run: `cd site && npm run check && npm test`
Expected: 0 errors; unit suite passes.

- [ ] **Step 6: Commit**

```bash
git add site/src/components/ui/Prose.astro site/src/components/pages/AboutView.astro site/src/components/pages/MemberView.astro site/src/components/layout/Header.astro
git commit -m "feat(type): apply the scale to prose and page overrides"
```

---

### Task 3: Membership page shell

**Files:**
- Modify: `site/src/components/pages/MembershipView.astro`
- Modify: `site/src/lib/i18n/ui.ts`
- Modify: `site/src/lib/content/fixtures/membership.json`
- Test: `site/tests/e2e/membership.spec.ts`

**Interfaces:**
- Consumes: `.t-*` utilities.
- Produces: `t('membership.back')` = “Become a member” / «Γίνετε μέλος».

- [ ] **Step 1: Replace the failing e2e expectations**

In `membership.spec.ts`, remove the tier tests and replace them with:

```ts
test('is the application page, not the tier table', async ({ page }) => {
  await page.goto('/membership')
  await expect(page.locator('[data-tier]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /become a member/i })).toHaveAttribute('href', '/members')
  await expect(page.getByText('Choose the tier')).toHaveCount(0)
})
```

Keep the `/support` tier test unchanged.

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd site && npx playwright test tests/e2e/membership.spec.ts -g "application page"`
Expected: FAIL (tiers exist, no back link).

- [ ] **Step 3: Update the view**

In `MembershipView.astro`, remove the `TierList` and `MembershipForm`? — **keep** `MembershipForm`; remove `TierList`, the process section, the `Rule`, the form `<h2>` and the `formIntro` paragraph. Add above the intro:

```astro
<a class="membership__back t-body" href={localePath('/members', lang)}>
  ← {t('membership.back', lang)}
</a>
```

Intro stays `.t-body` and black. Keep the privacy section and consent.

- [ ] **Step 4: Add the translation key**

`ui.ts`: `'membership.back': 'Become a member'` and `'membership.back': 'Γίνετε μέλος'`.

- [ ] **Step 5: Update the fixture and Sanity copy**

`fixtures/membership.json` intro:

- EN: “Membership supports the association's exhibitions, workshops and archive. Tell us about your practice and send your CV; the committee reviews applications as they arrive.”
- EL: «Η συνδρομή στηρίζει τις εκθέσεις, τα εργαστήρια και το αρχείο του συλλόγου. Πείτε μας για την πρακτική σας και στείλτε το βιογραφικό σας· η επιτροπή εξετάζει τις αιτήσεις καθώς φτάνουν.»

Patch production with a one-off `tsx` script using the same strings (set `membershipPage.intro` EN+EL).

- [ ] **Step 6: Run the test**

Run: `cd site && npx playwright test tests/e2e/membership.spec.ts`
Expected: PASS apart from tests updated in Task 4.

- [ ] **Step 7: Commit**

```bash
git add site/src/components/pages/MembershipView.astro site/src/lib/i18n/ui.ts site/src/lib/content/fixtures/membership.json site/tests/e2e/membership.spec.ts
git commit -m "feat(membership): replace tiers with the application page"
```

---

### Task 4: Form fields, copy and validation

**Files:**
- Modify: `site/src/components/forms/MembershipForm.astro`
- Modify: `site/src/lib/forms/validate.ts`
- Modify: `site/src/lib/forms/email.ts`
- Modify: `site/src/lib/i18n/ui.ts`
- Modify: `site/tests/e2e/forms.spec.ts`
- Test: `site/tests/unit/forms.test.ts`

**Interfaces:**
- Produces: required keys `message` and `cv`; new labels `form.fullName`, `form.mobile`, `form.why`, `form.cvAction`, `form.requiredNote`, `form.errors.cvRequired`.

- [ ] **Step 1: Write the failing validation test**

```ts
it('requires the motivation and the CV', () => {
  const result = validateMembership(
    { name: 'Maria', email: 'maria@example.com', consent: true, renderedAt: String(Date.now()) },
    'en',
    0,
  )
  expect(result.ok).toBe(false)
  if (!result.ok && !result.silent) {
    expect(result.errors.message).toBeTruthy()
    expect(result.errors.cv).toBeTruthy()
  }
})
```

- [ ] **Step 2: Run it**

Run: `cd site && npx vitest run tests/unit/forms.test.ts`
Expected: FAIL (validation currently accepts the missing fields).

- [ ] **Step 3: Update validation and email**

In `orderedMembershipErrors`, after email: require `input.message?.trim()` (message = “why”) and require `input.cv` (new `form.errors.cvRequired`). Remove `tier`/`practice` from `buildMembershipMails` rows (they are optional and no longer collected).

- [ ] **Step 4: Rewrite the form fields**

Order: Full name* (`name`, autocomplete name), Email* (`email`, autocomplete email), Mobile number (`phone`, autocomplete tel), Why* (`message`, textarea rows 4, required), Send us your CV* (`cv`, file, `required`, accept `.pdf,.doc,.docx`), then the note “PDF, DOC or DOCX, up to 4 MB.” and the existing consent checkbox.

Remove the tier select and practice field. Keep the honeypot, locale, renderedAt, error slots, `FormStatus`, and the `/api/membership` action.

Labels: `form.fullName` “Full name” / «Ονοματεπώνυμο», `form.mobile` “Mobile number” / «Κινητό τηλέφωνο», `form.why` “Why do you want to become a member?” / «Γιατί θέλετε να γίνετε μέλος;», `form.cvAction` “Send us your CV” / «Στείλτε μας το βιογραφικό σας», `form.requiredNote` “Fields marked * are required” / «Τα πεδία με * είναι υποχρεωτικά».

- [ ] **Step 5: Style the form**

Labels: `.t-label`, black (`color: var(--ink)`), not muted. Inputs/textarea: transparent, border 0, `border-bottom: var(--rule)`, `min-height: 48px`, `font-size: var(--text-body)`, padding `8px 0`. Textarea keeps only the bottom rule. Submit: pill (`background: var(--control)`, black text, `border: 0`, `border-radius: var(--radius-pill)`, `min-height: 48px`, padding `0 32px`, weight 600); hover inverts to ink/paper. Add `.form__required-note` (`.t-small`, muted) beside the first field on desktop, above the form on mobile. CV: visually hidden input, visible label styled as an underlined link with a `→`, `:focus-within` ring on the label, chosen filename in `.t-small`.

- [ ] **Step 6: Update e2e**

`forms.spec.ts`: use `getByLabel('Full name')`, fill why and attach a PDF fixture for the success case, keep the server-error test, update the no-JS test to attach the CV.

- [ ] **Step 7: Run**

Run: `cd site && npx vitest run tests/unit/forms.test.ts && npx playwright test tests/e2e/forms.spec.ts tests/e2e/membership.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add site/src/components/forms/MembershipForm.astro site/src/lib/forms/validate.ts site/src/lib/forms/email.ts site/src/lib/i18n/ui.ts site/tests/e2e/forms.spec.ts site/tests/unit/forms.test.ts
git commit -m "feat(membership): ask for name, contact, motivation and CV"
```

---

### Task 5: Verification and deploy

**Files:** none.

- [ ] **Step 1: Full suites**

Run: `cd site && npm test && npm run check && npm run build`
Expected: all unit tests pass, 0 Astro errors, build completes.

- [ ] **Step 2: Visual check**

Build and serve; screenshot `/membership` and `/el/membership` at 390 and 1440. Confirm: back link, black intro, underline fields, uppercase labels, required note, CV label, pill submit, consent, no tiers; 200% zoom does not clip.

- [ ] **Step 3: Deploy and verify**

Push `site-build`; the association's Vercel project builds from Git. Check `/membership` and `/el/membership` on `cyprus-printmakers-web.vercel.app`.

- [ ] **Step 4: Commit any doc updates**

Update `docs/design-deviations.md` if the form departs from the mockup (required email, consent block) and the QA record with the live check.

## Self-review notes

- Spec §§6, 8, 10 are covered; the directory (§7) and the About picture (§8A) are explicitly later phases.
- Prefix/dedupe and Greek parsing are not in this plan; they ship with the directory/import pass in the next plan.
