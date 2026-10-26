# Cyprus Printmakers Association — Brand & Style Guide

**Status:** inferred from the Figma HTML exports in `0. Mockups/HTML/DESKTOP`.
**Confidence:** high for colour, type and component values; medium for layout rules; low for mobile, motion and states.
**Date:** 2026-10-26

This document records what the mockups actually specify, separates that from what I am proposing, and lists what still has to be decided. Proposals are marked **[proposal]**.

---

## 1. The brand in one line

A quiet, institutional, editorial identity for a working artists' association: white paper, black text, one typeface, no decoration, and the artists' own prints supplying all of the colour.

It reads closer to a gallery catalogue or a letterpress programme than to a typical nonprofit website. The design earns attention through whitespace and scale, not through colour, shadow, or animation.

**Personality:** austere, cultured, matter-of-fact, local, non-commercial.
**Not:** friendly-startup, charity-marketing, colourful, playful, corporate.

---

## 2. Logo and mark

The exports contain no vector logo. What repeats across pages is:

- A **wordmark** set in Geologica Regular, all caps, in two parts: `CYPRUS` and `PRINTMAKERS ASSOCIATION`.
- A **mark**: a grayscale print artwork (`ASSETS/68823.png`, 1514 × 2085, 100% desaturated) that sits beside the wordmark. The same file is reused, scaled down, on every page — so it is being used as the identity mark, not as page content.
- On the home page the mark occupies roughly 158 × 192 px with the two wordmark lines to its right at ~32 px.

**[proposal]** Treat the mark and wordmark as a lockup: mark left, `CYPRUS` / `PRINTMAKERS ASSOCIATION` stacked to its right, ~24 px gap, baseline-aligned to the bottom of the mark. Ship it as SVG if the original exists; otherwise trace the alpha channel of `68823.png` into a single-colour SVG.

**Outstanding:** we need the original logo file (SVG/AI/PDF) and confirmation that `68823.png` is the intended permanent mark rather than a placeholder artwork. If it is an artwork, the site needs a real logo before launch.

---

## 3. Colour

The entire desktop set uses eleven colour declarations, and only five distinct values:

| Token | Value | Use |
|---|---|---|
| `--ink` | `#000000` | All body text, nav, headings, 1 px rules |
| `--paper` | `#FFFFFF` | Page background, reversed text |
| `--muted` | `#B3B3B3` | Secondary/meta text, inactive filters |
| `--graphite` | `#3E3E3E` | The `CURRENT: …` status line |
| `--control` | `#D9D9D9` | Pill button and field fill |
| `--transparent` | `rgba(255,255,255,0)` | Layout wrappers only |

No accent colour, no tints, no gradients, no shadows, no opacity tricks. Colour enters the site through photography and prints, not through UI.

**Accessibility note:** `#B3B3B3` on white is roughly **2.1:1**, which fails WCAG AA for text. Keep it for decorative rules or disabled states only; use `#6E6E6E` (≈5:1) or `--graphite` for any muted text that must be read. This is a deliberate deviation from the mockup and should be signed off.

---

## 4. Typography

**Typeface:** [Geologica](https://fonts.google.com/specimen/Geologica) (Google Fonts, variable, 100–900). Used at **Regular / 400 only** — every one of the 79 font declarations in the exports is Regular. Hierarchy is carried by size, position and colour, never by weight.

**Observed scale (desktop, 1514 px artboard):**

| Size | Role |
|---|---|
| 36 px | About / statement headline |
| 32 px | Navigation, page titles, member and project names, most prominent body |
| 24 px | Article text, captions, `CURRENT: …` status line |
| 20 px | Small print, form notes |
| 14 px | Browser default root; rarely used directly |

No letter-spacing, no line-height, or text-transform declared in the exports — the caps in the mockups are typed as caps. **[proposal]** Set line-height explicitly: `1.05` for display sizes, `1.35` for 24 px body, `1.5` for 20 px small print. Use `letter-spacing: -0.01em` at 32 px and above, `0` below.

**Mobile:** the 32 px nav cannot survive at 428 px. **[proposal]** clamp the scale — nav 20 px, page titles 32 px, body 18–20 px, statement 28 px. The exports do not specify this; the mobile files are unusable (see §9).

**Loading:** self-host Geologica as WOFF2 with `latin` and `greek` subsets (bilingual launch confirmed), `unicode-range` so only the needed file downloads. Preload the 400 weight only.

**Greek.** Geologica ships a Greek subset, so the typeface holds for both languages — no substitution. Two adjustments belong to the system, not to individual pages: Greek runs longer, so nav items and tier labels wrap rather than shrink; and Greek capitals carry more visual weight, so caps strings (`CURRENT:`, nav) may need a slightly wider track than the Latin default. Greek has no reference in the Figma exports and is composed within the same scale.

---

## 5. Layout

The artboards are ~**1514 px** wide (home page 1514 × 1080; interior pages 1370–3090 px tall). Everything is absolutely positioned, so the exports describe compositions, not a responsive system.

What is consistent:

- **Generous margins.** Content begins around x = 60–112 px and stops well short of the right edge. The page is mostly white.
- **The nav is a horizontal row of six links**, left-aligned near the top, at 32 px, spaced roughly 50–60 px apart: `MEMBERS · PROJECTS · SUPPORT · NEWS · ABOUT · CONTACT`. It is not right-aligned and not in a bar.
- **The brand block sits below the nav**, not opposite it — nav first, identity second. That inversion is the signature move of the layout.
- **The `CURRENT: …` line is pinned to the bottom edge** of the viewport at 24 px in `--graphite`, with a `→`.
- **Images are full-bleed blocks with a 1 px black border**, no radius, no caption chrome.
- **Controls are pills**: 72 px tall, 34 px radius, `--control` fill, 1 px black border.
- **No shadows, no cards, no rounded rectangles** other than pills.

**[proposal]** A 12-column grid, max-width 1514 px, 60 px outer margin (24 px on mobile), 24 px gutter, with a 4/8/12 column span rhythm. Section spacing on an 8 px base: 8 / 16 / 24 / 48 / 96 / 160.

---

## 6. Components

| Component | Spec |
|---|---|
| Header nav | 32 px Geologica, black, uppercase, no underline; active page marked with a bullet or `→` (the mockups do not show one — decide) |
| Brand lockup | mark + two-line wordmark, ~32 px |
| Status line | 24 px `--graphite`, pinned bottom, `CURRENT: <title> →` |
| Pill button | 72 px high, radius 34 px, `#D9D9D9` fill, 1 px black border, 24–32 px label |
| Text field | 1 px black border, transparent fill, 602 px wide in the mockups, ≥56 px tall |
| Image block | 1 px black border, no radius, image fills, `object-fit: cover` |
| Filter chips | alphabetical (members) and year (projects) — visual style not in exports; **[proposal]** pill outline, active = black fill/white text |
| Member entry | name at 32 px, expandable detail; emails visible in the mockups |
| Project entry | year, title, image; year filter above |
| News entry | date at 24 px `--muted`, headline at 32 px, excerpt at 24 px |
| Support tier | € amount, tier name, benefit list, single pill CTA |
| Form | single column, labels above fields, 24 px, CV upload as a bordered drop zone |

**States:** the exports contain no hover, focus, active, disabled, error or success styling. **[proposal]** All interactive elements: 1 px underline or invert to black-on-white on hover; 2 px black outline offset 2 px on focus; no transitions longer than 120 ms. Decide once, apply everywhere.

---

## 7. Imagery

- **Prints are the colour.** The identity is built to let high-contrast, sometimes saturated prints sit against white without competing chrome.
- **Grayscale is the default treatment** for portraits and documentary photographs. `ASSETS/68824.jpg` (workshop interior, 3872 × 2592) is near-neutral and muted; the recurring 68823 artwork is fully desaturated.
- **Full-bleed, hard-edged, uncropped-feeling.** Images are not inside rounded cards and rarely have captions overlaid.
- **No stock photography.** The only images in the exports are workshop documentation, exhibition documentation and member prints.
- **Print poster `v43_4408.png`** (1080 × 1350, green/white) is the one strongly coloured asset and appears to be exhibition artwork — treat as content, not brand colour.

**[proposal]** Serve AVIF/WebP with explicit width/height; lazy-load below the fold; cap the hero at ~250 KB. Ask members for 2000 px on the long edge.

---

## 8. Voice

- Institutional and plain. All-caps for navigation and labels; sentence case for sentences.
- Arrows (`→`) as links, not buttons.
- No exclamation marks, no marketing adjectives, no "join our vibrant community".
- Dates and prices stated flatly: `€50`, `2019`.
- The mockup copy is largely Lorem ipsum, so tone is inferred from labels and the About page, not from finished prose.

**Open:** is the site English-only, or English + Greek? Cyprus-based public-facing institutions normally need both. This decision affects type, nav length, content model and cost — decide before design.

---

## 9. What the exports do not give us

Be aware of these gaps; they change the plan.

1. **The mobile exports are broken.** They reuse desktop absolute coordinates inside a 428 px artboard (links positioned at x = 1481 px), so they are not a mobile design. The layout must be designed during build from the desktop composition, or re-exported.
2. **Missing media.** Several `background: url(...)` declarations point at images not present in the export folders (`v14_187.png`, `v14_192.png`, `v14_195.png`, `v14_198.png`, `v14_209.png`). Some CSS also contains invalid `color: url(...)`.
3. **No Figma access.** The file is view-only and the REST API needs a token. The prototype page returns an app shell to non-browser clients, and node thumbnails all resolve to the same file-level image. We cannot pull exact frames, text styles or components.
4. **No real content.** Almost all body copy is Lorem ipsum. Member names, project histories and news posts do not exist yet.
5. **No states, no motion, no breakpoints.**
6. **No logo vector, no image licensing, no font licence confirmation.**

The practical consequence: the desktop composition is a reliable visual reference, the rest is a design exercise. Re-exporting the mobile frames as flat PNGs (or granting view access with a token) would remove most of the guesswork.

---

## 10. Design tokens (suggested starting point)

```css
:root {
  --ink: #000000;
  --paper: #ffffff;
  --muted: #b3b3b3;        /* decorative only — fails contrast for text */
  --muted-text: #6e6e6e;   /* proposal: readable muted text */
  --graphite: #3e3e3e;
  --control: #d9d9d9;

  --font-sans: "Geologica", system-ui, sans-serif;
  --fw-regular: 400;

  --step--1: 1.25rem;  /* 20px */
  --step-0:  1.5rem;   /* 24px */
  --step-1:  2rem;     /* 32px */
  --step-2:  2.25rem;  /* 36px */

  --rule: 1px solid var(--ink);
  --radius-pill: 34px;

  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 3rem;
  --space-5: 6rem;
  --space-6: 10rem;

  --page-max: 1514px;
  --page-pad: 60px;
  --page-pad-sm: 24px;
}
```

---

## 11. Decisions needed before build

| # | Decision | Status |
|---|---|---|
| 1 | English only, or English + Greek? | **Settled: both at launch.** English at `/`, Greek at `/el`; Latin + Greek subsets. |
| 2 | Is `68823.png` the real mark? Provide vector logo if not | **Open.** Affects header, favicon, social cards. |
| 3 | Re-export mobile frames or design mobile in build? | **Open.** Cannot build faithfully without one of the two. |
| 4 | Are member emails public? | **Assumed yes**, as today, pending consent confirmation. |
| 5 | Where do membership applications and CVs go? | **Settled: emailed to the committee via Resend, not stored.** Vercel's 4.5 MB body limit caps the CV at 4 MB. |
| 6 | Approve the contrast fix for `#B3B3B3` text | **Settled: `#6e6e6e` for text that must be read**; `#b3b3b3` stays decorative only. |
| 7 | Active-page and hover/focus treatment | **Designed in build** from existing tokens, logged in `docs/design-deviations.md`. |
