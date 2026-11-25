# Second round feedback — design

**Date:** 2026-11-25
**Status:** approved in conversation, ready for a plan

## Intent

Act on the committee's second round of feedback: move the home burger to the
left, let the hero intro play without a click, simplify members to name plus an
optional external website, and prepare the `cyprintmakers.com` cutover.

## Goals

- Home cover: burger button and its panel sit on the left.
- First full load of the home page plays the intro automatically, with a short,
  skippable sequence instead of a click gate.
- Members: no individual member pages. Each directory row is the member's name
  plus a diagonal up-right arrow linking to their website, if they have one.
- Old member URLs redirect to the members directory.
- Prepare the domain cutover to `https://www.cyprintmakers.com`.

## Non-goals

- No change to committee content beyond removing the member-profile links.
- No change to projects, news, forms, ink effect or theming.
- No deletion of historical member documents in Sanity; obsolete fields are
  removed from the schema and query, not from the dataset.
- No redesign of the members filter, featured block or membership page.

## Decisions

### Home burger

`.header__top--home` aligns its single child to the start, and the menu panel
anchors to the left edge (`left: 0; right: auto`). The mobile rule that stretches
the panel across the header stays.

### Intro

- The intro is still a full-document cover, still only on the first document of
  a session (the existing `__cpDocs` check), and still bypassed by reduced
  motion.
- It starts by itself: after fonts are ready and a short beat (~450ms) that
  shows the mark alone, the lockup and paragraph animate in.
- The paragraph timeline is compressed from 7.55s to ~3.9s: in over 750ms, hold
  for ~2.1s, wipe out over 450ms. Hand-off and fade add ~0.7s, for roughly 4.5s
  from load to the home page.
- The full-screen button is replaced by a non-interactive cover. A real
  **Skip intro** button (bottom-right) and `Escape` skip to the reveal. Clicking
  or tapping the cover also skips.
- Auto-completion does not move focus. A deliberate skip moves focus to `main`.
- If the intro script fails, the existing 4s fail-safe in `BaseLayout` reveals
  the page.

### Members

- `Member` becomes: `_id`, `translations`, `name`, optional `website`, `status`,
  `featured`, `order`.
- Removed from the schema, query and type: `slug`, `discipline`, `bio`,
  `portrait`, `email`, `instagram`, `joinedYear`, `membershipType`.
- Directory rows: number, name, and an inline `↗` immediately after the name
  when `website` is set. The arrow is a 13px inline SVG, `aria-hidden`; the
  anchor is labelled “Name — Website”.
- Committee entries stay name + role, no links. `memberRef` is removed from the
  committee schema, type, query and both views.
- Featured block stays, now name-only (no discipline) with the same website
  arrow and no profile links.
- Delete `MemberView.astro`, both `members/[slug]` routes, `members-bio.js`, the
  “Full profile” strings and the bio-translation requirement.
- Redirect `/members/:slug` → `/members` and `/el/members/:slug` →
  `/el/members` with 308 in `vercel.json` (Vercel is the serving layer).
- Update the hardcoded privacy copy: profiles are a name and an optional
  website link only.

### Domain

- Canonical origin becomes `https://www.cyprintmakers.com`; apex
  `https://cyprintmakers.com` redirects to `www` at the edge.
- Code moves first: `PUBLIC_SITE_URL` docs, Playwright pin, SEO expectations and
  Resend sender docs.
- Dashboard/account steps are recorded for the deploy owner: add the domain to
  the association Vercel project, set `PUBLIC_SITE_URL` and `PUBLIC_STAGING=false`
  in Production, add both origins to Sanity CORS, update the Sanity webhook and
  deploy hook, and verify `cyprintmakers.com` in Resend.
- The local `sanity` CLI is not logged in and the association Vercel project is
  not under the accessible team, so those two steps cannot be executed from this
  checkout.

## Constraints

- Keep the monochrome print aesthetic, Geologica, and the existing layout
  tokens.
- Member emails and photos must not appear on the public site.
- Static Astro output; Vercel handles redirects and rewrites.
- The site must keep working without JavaScript and under reduced motion.

## What is left to the builder

- Exact skip-button styling and its position against the cover.
- Whether the paragraph hold is 2.0s or 2.2s, within the ~4.5s target.
- Arrow glyph geometry and hover nudge.
- Test wording and fixture trimming mechanics.
