# Home Hero and Click-Gated Intro — Design

**Status:** Draft for approval
**Date:** 2026-11-02
**Scope:** `site/` home page, intro overlay, `homePage` schema

## Intent

Replace the auto-playing entry with a logo-only cover that waits for a click, then performs the prototype's entry into a reworked home hero. The hero becomes the prototype's centred lockup: `CYPRUS | mark | PRINTMAKERS ASSOCIATION`, with the nav above and `CURRENT` below. The intro paragraph is real content, but it is transient: it reveals after the click and fades off before the hero settles.

Verified against the live prototype on 2026-11-02: the paragraph reveals line by line over ~2.5 s, holds, then fades off top-to-bottom; by ~8 s the final hero is only the centred lockup, nav and `CURRENT`.

## Goals

- The first thing on home is a single floating mark. Nothing auto-plays.
- Click/tap/Enter on the mark starts the sequence; the mark splits, the wordmark arrives, the paragraph reveals and fades, and the hero settles.
- The settled hero matches the prototype: centre lockup, nav, `CURRENT`; no paragraph, no empty name grid, no rule.
- The paragraph is editable in Sanity (`heroBody`), with English seeded from the mockup.
- Reduced-motion and no-JS visitors get the hero immediately, never a blocking cover.

## Non-goals

- Translating the new paragraph (English only for now; Greek falls back).
- Changing the nav, other pages, or the content import.
- Matching the prototype's 8 s paragraph hold exactly; the build shortens the sequence to ~6.5 s.

## Anti-goals

- A cover that blocks the site if the script fails.
- Replaying the intro on internal navigation or on every page.
- A second visible brand in the header on home.
- Motion that ignores `prefers-reduced-motion`.

## Approach

Chosen: a home-specific hero and intro overlay.

- `Header` gains `showBrand?: boolean` (default `true`); `BaseLayout` passes `false` on home. The hero owns the brand there.
- `HomeView` renders `HomeHero`: a visible `<h1>` lockup, nav remains in the header, `CURRENT` pinned at the bottom. The old cover media, rule and empty name grid are removed from home.
- `HeroBrand` (new) renders the split lockup from **`home.title`** (the Sanity-editable string), not `brandWordmark`: first word left, mark centred, remaining words right. Below 900 px it stacks the two lines under the mark. `brandWordmark` remains the header source. The mark stays decorative (`alt=""`); the h1 text supplies the accessible name.
- `HomeIntro` becomes a click-gated overlay: a full-cover button containing the mark, with a CSS float. The overlay's `HeroBrand` and paragraph are hidden until the click.
- **Structure:** `HomeIntro` is rendered through a named `overlay` slot as a sibling of `.page`, outside the header/main/footer. While `pending`/`moving`, `html[data-intro]` makes `.page` `visibility: hidden`, so the invisible nav, `CURRENT` and h1 cannot be tabbed or read; the cover button is the only focusable thing. At `handoff`, `.page` becomes visible (still behind the opaque overlay), the hero lockup is measured, then the overlay fades. Focus moves to `main` after cleanup.
- The cover button is exposed with `aria-label` “Enter the Cyprus Printmakers Association website” / Greek equivalent; only the duplicate `HeroBrand` and paragraph inside it are `aria-hidden`.
- **Nav and `CURRENT` are hidden during the sequence** and appear at the hand-off. This differs from the prototype, where the nav is visible from ~600 ms; the full-screen cover is the simpler, safer focus model.
- `heroBody` is added to `homePage` as `internationalizedArrayText`, optional for Greek and optional for English. It is projected by the existing `...` query, added to the fixture and type, and seeded. It is not added to the translation-required map, so a missing Greek paragraph does not noindex the Greek home. If it is blank, the timeline skips the reveal/hold/fade phases and goes from the wordmark to the hand-off.

Alternatives rejected: keeping the header brand and only overlaying the paragraph (does not produce the prototype hero); a full home redesign beyond the hero (not requested).

## Motion

- **Cover:** fixed paper overlay, mark centred, `translateY` float (3 s, alternate). The overlay is a `<button>` labelled "Enter" / "Είσοδος"; the whole viewport is the hit target.
- **Click → hero** (measured hand-off, no auto-play):
  - 0–300 ms: duplicate mark splits outward and fades.
  - 0–600 ms: `CYPRUS` / `PRINTMAKERS ASSOCIATION` slide in around the mark.
  - 600–2600 ms: paragraph reveals with a soft downward mask.
  - 2600–4100 ms: hold.
  - 4100–6100 ms: paragraph fades off top-to-bottom.
  - 6100–6400 ms: lockup measures the real hero lockup and moves into place.
  - 6400–6700 ms: overlay fades out; cleanup.
- `Escape` or a click during the sequence skips to the settled hero.
- Total ~6.7 s, shortened from the prototype's ~8 s.

## Gate and fallbacks

- `BaseLayout` keeps the full-document-load counter. It sets `data-intro="pending"` on home when the user has not reduced motion; **no session flag** — the cover appears on every full load of `/` or `/el`.
- A 4 s fail-safe removes the pending state if `intro.js` never runs, revealing the hero rather than blocking it.
- `prefers-reduced-motion: reduce`: no cover, no float, no sequence; the hero is the first thing.
- No JS: the cover is never shown; the hero is the first thing.
- Internal navigation to home does not replay the cover (full-load only).

## Accessibility

- The cover is a single, exposed button with a visible mark and an accessible name; keyboard Enter/Space works. Only the duplicate lockup and paragraph are `aria-hidden`.
- While `pending`/`moving`, `.page` is `visibility: hidden`, so the real h1, nav and `CURRENT` are out of the tab order and AT tree; the cover button is the only focusable element. At hand-off the page becomes visible.
- No focus trap. After the sequence or skip, focus moves to `main` (`tabindex="-1"`).
- The paragraph is transient intro copy inside the aria-hidden overlay; it is not read twice. About carries the permanent history.
- Axe: zero violations on `/` and `/el` both while the cover is up and after it settles; the hidden `.page` must not produce `aria-hidden-focus` or contrast findings on its content.

## Responsive

- Desktop: horizontal lockup, paragraph to the right of the wordmark, `CURRENT` at the bottom.
- Under 900 px: stacked lockup (mark above the two wordmark lines); paragraph below the wordmark; no horizontal overflow at 320 px.
- The floating cover mark uses the same responsive width as the hero lockup's mark (`clamp(64px, 12vw, 158px)`); the header brand is hidden on home.

## Content model

- `homePage.heroBody`: `internationalizedArrayText`, English seeded with:
  “A non-profit organization and artistic collective established by local visual artists. It operates a dedicated workshop in Pallouriotissa, Nicosia, initially founded alongside the Cyprus Chamber of Fine Arts.”
- Greek left empty for now; the overlay falls back to English inside `lang="en"` (the overlay itself is aria-hidden).
- `coverImage` stays in the schema but is no longer rendered on home.

## Tests

- Unit: schema exposes `heroBody`; `brandWordmark` unchanged; `heroBody` is not in the translation-required map.
- E2E:
  1. Fresh full load of `/`: cover visible, hero not yet entered.
  2. Click the cover: paragraph appears, then disappears; hero lockup is visible; overlay removed.
  3. `Escape` skips to the hero.
  4. Reduced motion: cover hidden, hero visible.
  5. No JS: cover hidden, hero visible.
  6. Client-side navigation to home: no cover.
  7. `/members` still shows the header brand; `/` does not.
  8. 320 px Greek: no overflow, hero legible.
  9. Axe: zero violations on `/` and `/el` after settle.
- Lighthouse stays ≥95 on `/` and `/el`; client JS stays under 30 KB.

## Out of scope

- Greek translation of `heroBody`.
- Content import.
- A persistent hero image.
