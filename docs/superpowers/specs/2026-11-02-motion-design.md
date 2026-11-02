# Cyprus Printmakers — Motion Design

**Status:** Draft for approval
**Date:** 2026-11-02
**Scope owner:** site (`site/`), Astro 7 static build + Vercel adapter

## Intent

The current site matches the Figma mockup's composition and content, but it is static. The Figma prototype's character comes from its motion: an entry sequence on the home cover and a short dissolve between pages. This design adds that motion without changing the layout, content model, bilingual routing, accessibility, or the existing interactions.

The prototype was captured headlessly from the public Figma file on 2026-11-02. Timings below come from those frames, not from guesswork.

Reference frames: [cover](motion-reference/entry-cover.png) · [split at 300 ms](motion-reference/entry-split-300ms.png) · [settled at 600 ms](motion-reference/entry-settled-600ms.png) · [text reveal at 2200 ms](motion-reference/entry-text-2200ms.png) · [page crossfade at 100 ms](motion-reference/page-crossfade-100ms.png) · [crossfade complete at 300 ms](motion-reference/page-crossfade-300ms.png).

## What we observed in the prototype

1. **Entry (home only).** A single mark sits centred on a white cover. On entry it splits into two marks; the two halves of the wordmark slide outward and converge around the surviving mark; the duplicate fades; the nav fades up; a long paragraph is revealed by a soft downward mask.
   - Lockup settles at ~600 ms.
   - Text reveals until ~1.6–2.2 s.
   - The loading spinner seen before that is the Figma viewer, not the site.
2. **Page changes.** A dissolve/crossfade. Old content is still visible at 100 ms; new content is fully in place by ~300 ms.
3. **Hover states.** Minimal; the existing 120 ms underline/reverse-video rules already cover them.
4. **Scroll motion.** None observed.

## Goals

- Reproduce the entry sequence's *feel* on the existing home cover: one mark, a split, wordmark reveal, and a soft reveal of the current line.
- Add a ~300 ms crossfade between internal pages, with no full reload.
- Keep the existing features exactly as they are: language switcher, accessible contrast and targets, mobile composition, forms, filters, 404, staging guards.
- Preserve performance and accessibility: no framework dependency, client JS under the existing 30 KB budget, zero axe violations, no layout shift.

## Non-goals

- Redesigning layouts, typography, colours or spacing to match the prototype more literally.
- Adding the prototype's paragraph/tagline copy to the home page (it is not in our content model).
- Scroll-driven animation, parallax, or cursor effects (not present in the prototype).
- Replacing the content model or importing content. Content import follows this work so it lands in the final components.

## Anti-goals

- An intro that blocks content, traps focus, or replays on every page/navigation.
- Animating layout properties (width, height, top, left) or shipping a heavy animation library.
- Motion that still runs under `prefers-reduced-motion: reduce`.
- Breaking the member/project filters or forms after the first client-side navigation.

## Constraints

- **Astro 7**, `output: 'static'`, `@astrojs/vercel`; Node 22 on Vercel.
- **No Tailwind, no framework islands.**
- **Client JS < 30 KB total**; current public scripts are ~4.4 KB.
- **WCAG 2.2 AA**; `prefers-reduced-motion` respected; no content hidden from assistive tech.
- **No shadows, gradients or rounded cards**; motion uses the existing monochrome language.
- **English at `/`, Greek at `/el/…`**; the Greek wordmark is longer and must not overflow.

## Approaches

### 1. Astro's client router + native view transitions, CSS keyframes and the Web Animations API *(chosen)*

Add `<ClientRouter />` to `BaseLayout` for cross-page dissolves. Build the entry sequence as a small vanilla module that drives a server-rendered overlay with `element.animate()` (WAAPI), using measure-based transforms to hand off to the real header brand.

- No new dependencies; ~2–3 KB intro script plus Astro's router chunk.
- Node stays static; no hydration.
- Native View Transitions degrade to Astro's animated fallback, then to normal navigation.
- Best fit for the existing architecture and budget.

### 2. Hand-rolled client-side router

Fetch the next page, swap `main`, animate with WAAPI, manage `history`, scroll and focus ourselves.

- Full control, but re-implements prefetch, history, scroll restoration, focus announcement and error fallbacks.
- More code and more regression surface for the same visual result. Rejected.

### 3. GSAP timelines

Fastest to author complex sequences, with ScrollTrigger if scroll motion is added later.

- 30–50 KB plus a runtime dependency; breaks the JS budget and the no-framework constraint. Rejected.

## Design

### 1. Page transitions

- Add `<ClientRouter fallback="animate" />` in `BaseLayout` `<head>`.
- Default page animation is the fade Astro provides. Target **~300 ms**; adjust with `::view-transition-old(root)` / `::view-transition-new(root)` if the default differs.
- Do **not** persist the header/footer: their active nav state and language links are page-specific. A whole-page dissolve is acceptable and matches the prototype's dissolve.
- Enable hover prefetch (`prefetch: { defaultStrategy: 'hover' }`) so the dissolve starts immediately on click. This is a builder call; drop it if it causes extra load.
- External links, `target="_blank"`, `download` and hash links keep native behaviour; Astro's router already excludes them.
- Add an explicit reduced-motion rule because the global `*` reset does not match `::view-transition-*` pseudo-elements:

  ```css
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*),
    ::view-transition-old(*),
    ::view-transition-new(*) {
      animation: none !important;
    }
  }
  ```

### 2. Home entry sequence

**Markup.** Extract a shared `Brand.astro` (mark + wordmark, reusing the header's existing styles) and use it in both `Header.astro` and the new `HomeIntro.astro`. The overlay's brand is an exact clone at 1×, so wrapping is identical at every width — including the three-line wordmark the real header produces below 600 px.

`HomeView` renders `HomeIntro.astro` next to the existing cover:

- `div[data-home-intro][aria-hidden="true"]` containing:
  - `<Brand>` (mark + wordmark, with `data-brand-line` on the two wordmark spans),
  - a duplicate mark used for the split.
- No duplicated `CURRENT:` line and no cover rule inside the overlay. Those are the real page elements, revealed by a state class after the hand-off.
- Rendered on the server; hidden unless `html[data-intro]` is `pending`/`moving`.
- The real header, cover rule/figure and current line stay in the DOM and remain accessible. The real `header .brand` is only visually hidden (`opacity: 0`) while the overlay owns the lockup.

**Wordmark source.** `src/lib/brand.ts` exports `brandWordmark(lang): [string, string]`; `Brand.astro` uses it, so English and Greek cannot drift between header and intro.

**Gate and anti-flash.** `BaseLayout` gains a `homeIntro?: boolean` prop (`HomeView` passes `true`). The inline head script:

1. returns if `window.__cpIntroBoot` is set, then sets it — Astro's router also executes head scripts after a client-side swap, and this makes the intro **full-document-load only**;
2. returns if `prefers-reduced-motion: reduce` matches;
3. returns if `sessionStorage['cp:intro']` is set (wrapped in `try/catch`);
4. sets `document.documentElement.dataset.intro = 'pending'`;
5. sets a 4 s safety timeout that removes the attribute if `intro.js` never runs.

Because it runs before paint, the cover never flashes. Arriving at home through a client-side navigation does **not** play the intro; the session flag is written when the sequence completes.

**Timeline** (`public/scripts/intro.js`, ~2–3 KB, no dependencies):

| Time | State | Action |
|---|---|---|
| 0 ms | `pending` | Overlay visible; brand clone centred at a capped initial scale (≤1.6×); duplicate mark on top; real `header .brand` opacity 0; wordmark lines hidden |
| 0–320 ms | `moving` | Duplicate mark translates ~120 px and fades to 0 |
| 0–600 ms | `moving` | Wordmark lines slide in from ±40 px and fade up into the clone |
| 400–900 ms | `moving` | Clone measures the real `.brand` and animates translate + scale onto it |
| 900 ms | `handoff` | Real `.brand` opacity 1 while the overlay is still fully opaque and aligned |
| 900–1200 ms | `revealing` | Overlay fades out; real cover rule/figure and `CURRENT:` line wipe in with `clip-path` + opacity |
| 1200–1400 ms | `revealing` | Settle; remove overlay, remove `data-intro`, write `sessionStorage['cp:intro'] = '1'` |

Details:

- The overlay stays **fully opaque until the clone has landed** (900 ms), so the wordmark is never double-exposed at two sizes. The real brand is visually hidden until hand-off but still exposed to assistive technology.
- Use `element.animate()` with transform/opacity/clip-path only. Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for movement, `ease-out` for fades.
- Measure `.brand` and the clone with `getBoundingClientRect()`; compute `translate` + `scale` with `transform-origin: top left`. If measurement fails, fall back to a 300 ms crossfade.
- **Narrow widths:** the clone is an exact match, so uniform scaling never distorts wrapping. Its initial scale is capped so the whole clone fits inside the viewport with page padding — at 320 px this resolves to 1×. The final scale is `realBrand.width / clone.width`, so the hand-off lands exactly and cannot overflow.
- **Skip:** `Escape`, click, or any key finishes all animations (`animation.finish()`), then cleans up. The overlay has `pointer-events: auto` while pending.
- **Idempotence:** set `data-intro-ran` on the root so a re-executed script cannot play twice.
- **Greek:** both the clone and the real brand use the same component and line wrapping; the measured transform keeps the hand-off exact.

**Initial CSS (in `HomeIntro.astro`):**

- `.intro { position: fixed; inset: 0; background: var(--paper); z-index: 20; display: none; }`
- `html[data-intro="pending"] .intro { display: grid; }`
- No `aria-hidden` on `main`; the overlay itself is `aria-hidden="true"`.

### 3. Interaction scripts after navigation

Astro 7's router keys executed scripts by `src` and skips a script whose `src` has already run. `forms.js`, `members-filter.js` and `projects-filter.js` therefore will **not** re-bind after a client-side navigation, even though the DOM has been replaced. This is a real regression risk for the member filter and forms.

Refactor each of the three external scripts to:

1. declare a named `init()` that queries the current DOM and binds,
2. register `document.addEventListener('astro:page-load', init)` once,
3. rely on that event for the first load too (Astro dispatches it on initial load and after every navigation), so `init()` never runs twice against the same DOM.

Do not use `data-astro-rerun`; it targets inline scripts. Do not convert these to inline modules. E2E must cover a navigate-away-and-back cycle for the member filter and the membership form.

### 4. Motion tokens

Add to `tokens.css`:

```css
--motion-fast: 120ms;
--motion-page: 300ms;
--motion-settle: 600ms;
--motion-intro: 1400ms;
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
```

Use them in the intro, transitions and hover rules.

## Accessibility

- `prefers-reduced-motion: reduce` → no overlay attribute, no intro, no view-transition animation.
- No JS → no overlay attribute; the server-rendered page is complete.
- Overlay is `aria-hidden`; the real content is never `aria-hidden` or `display:none` for assistive tech.
- No focus trap; Escape/click skips. After cleanup, focus stays where the browser put it (body/main), not inside the removed overlay.
- Total entry ≤1.5 s (<5 s threshold); no flashing.
- Client navigation: Astro's router announces the new page and restores scroll; verify focus lands on the new `main` (it has `tabindex="-1"`).

## Performance

- New JS: `intro.js` (target ≤3 KB) + Astro's router chunk (~5–6 KB). Total public + router stays under 30 KB.
- Animate transform/opacity/clip-path only; no layout reads inside the animation loop (measure once).
- The mark is already loaded/cached by the header; no new image request.
- Lighthouse performance/accessibility must stay ≥95 on `/` and `/el`.

## Testing

**Unit**

- Brand wordmark helper returns the existing EN/EL pairs.
- No unit test for the head gate: it must run inline before paint, so it is covered end-to-end (first load, repeat, reduced motion, no JS, client arrival).

**E2E (Playwright, fixtures build)**

1. First home load: overlay appears, is gone within 2 s, `sessionStorage['cp:intro']` is set.
2. Reload in the same context: no overlay.
3. `emulateMedia({ reducedMotion: 'reduce' })`: no overlay.
4. JS disabled: hero/current content visible, no overlay, no errors.
5. Keyboard: `Escape` during the intro removes the overlay immediately.
6. Full-load only: land on `/about`, then click the brand to reach home via the router — no overlay, no flash.
7. Navigation: click a nav link; URL, title and content update; header persists visually; no full reload (set `window.__sameDocument = true` before navigating and assert it survives).
8. After navigating to `/members`, the search filter still filters; navigate away and back, it filters again (no double-binding).
9. After navigating to `/membership`, the mocked form still submits.
10. Axe: zero violations on `/`, `/el`, `/members`, `/membership` after transitions.
11. Reduced-motion run: navigation swaps content with no visible dissolve and no errors.
12. At 320 px on `/el`, the intro clone and hand-off produce no horizontal overflow and no three-line/two-line jump.

**Manual / QA log**

- Record max overflow at 320 px on `/el` before/after intro.
- Lighthouse `/` and `/el` after the change.
- Compare the built sequence against `docs/superpowers/specs/motion-reference/` at 0/300/600/1200/1400 ms.

## Acceptance criteria

- Home intro plays once per session on a full document load, settles by ~1.4 s, is skippable, and hands off to the real header brand with no visible jump or double exposure.
- No intro on repeat visits, client-side arrivals at home, reduced motion, or no JS.
- Internal navigation is a ~300 ms dissolve with no full reload; scroll and focus behave.
- Filters, forms, language switcher and staging guards work after any number of client navigations.
- 0 axe violations on the tested pages; Lighthouse ≥95 performance and accessibility; client JS <30 KB.
- Greek and English both fit without overflow at 320 px.

## Out of scope / follow-ups

- Content import (Wix archive, members, images) — separate plan after this lands.
- Domain cutover and `PUBLIC_STAGING=false`.
- Any scroll-driven or hover motion not present in the prototype.
