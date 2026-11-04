# Cyprus Printmakers Association — QA log — 2026-10-26

## Deferred checks

- Geologica OFL upstream header names "Geologisk" (Google's own file); Task 18 README records the licence source and discrepancy — do not rewrite the licence text.
- Greek WOFF2 is 6,308 bytes (authentic subset); the brief's 8 KB gate was a corruption heuristic and was replaced by a valid-wOF2 check.
- mark.png optimised from 1514×2085 / 12.6 MB to 800 px long edge; record in docs/design-deviations.md at Task 3.
- Task 5: the prerendered-Studio check (`dist/admin/index.html`) is deferred until the Sanity project exists (Human Prerequisite 1). `astro.config.mjs` adds the Sanity integration only when `SANITY_PROJECT_ID` is set, so fixtures builds are unaffected. Re-run `npm run build && test -f dist/admin/index.html` once the project id is available.
- Task 14: full Sanity Presentation stega + `VisualEditing` in BaseLayout are deferred until the Sanity project exists (Human Prerequisite 1) — `sanity:astro`'s virtual modules do not resolve in fixture builds. The preview route is live and fails closed (503) with the dual-key guard; the Presentation tool registers in `sanity.config.ts` only when `SANITY_PROJECT_ID` is set.
- Task 5: slug uniqueness is not enforced by a Studio rule (not supported by this Sanity version's rule typings); the seed and import scripts enforce it via deterministic document ids.

## Wix archive

- Import scripts are dry-run only until the Sanity project exists (Human Prerequisite 1): `npm run import:projects` / `npm run import:members` print the exact write payloads as NDJSON. The live path (createOrReplace + assets.upload) is intentionally unwired and exits 1 with instructions.
- Plan-vs-reality rulings recorded in `site/scripts/__fixtures__/README.md`: project pages are the Wix dynamic `/projects/<year>` pages (one project each); year pages list titles as text with no hrefs; the live members page holds 18 members (the plan's 17 predated a new signup); the 2019 project is "EPALE WORKSHOP", not "Printmaking Days". Imported drafts need a human review pass (bios may carry trailing next-name artifacts, gallery image lists include the site logo) before the real import runs.

- Archived 2026-10-27: 37 pages (26 static + 11 dynamic project-year pages) and 189 images (2.4 MB) from www.cyprintmakers.com into `wix-archive/` (outside the repo). Sitemaps: pages-sitemap.xml + dynamic-projects sitemap. URL shape: year pages at `/2019` (and `/projects/2019`), members at `/members`, projects index at `/projects-1` and `/project`.

## Staging deploy

- Deployed 2026-11-02 to Vercel project `cyprus-printmakers-web` (team `cyprus-printmakers`), connected to `github.com/CyprusPrintmakers/web`, branch `site-build`, Root Directory `site`.
- The repository was made public to satisfy Vercel Hobby's rule that private-repo commits must be authored by the Hobby team owner. No secrets were ever committed (only `site/.env.example`).
- Seeded `hyel0os7/production` with 6 singletons and 10 collection documents. The seed skips fixture image references (placeholder asset ids that do not exist in Sanity), so portraits and covers render the reserved placeholder box until real assets are imported.
- Smoke test on `https://cyprus-printmakers-web.vercel.app` (2026-11-02): `/` returns 200; `robots.txt` is `Disallow: /`; homepage has `noindex,nofollow` and the staging badge; `/el` has `lang="el"`; `/members` renders the seeded Maria Georgiou; `/admin/` returns 200; `POST /api/contact` returns localised 400 JSON field errors, so the SSR functions are deployed.
- Canonical links, sitemap and RSS now use `https://cyprus-printmakers-web.vercel.app` (`PUBLIC_SITE_URL`). The custom domain is still attached to the personal Vercel account.

## Email delivery (Resend)

- The sender defaults to `onboarding@resend.dev`, Resend's test sender. It only delivers to the Resend account owner (`cyprintmakersweb@ik.me`) until a domain is verified, so `CONTACT_TO_EMAIL` and `MEMBERSHIP_TO_EMAIL` must point at that address while staging.
- Applicant confirmations are best-effort: the committee mail is sent first, and a failed confirmation is logged instead of surfaced, so a delivered submission is never reported as an error. Verified 2026-11-02 with `test@example.com` (always rejected by Resend): HTTP 200, committee mail sent.
- Delivery failures return 502. On staging (`PUBLIC_STAGING=true`) the JSON response includes the provider message for diagnosis; the visitor-facing text stays generic.
- Before launch: verify a sending domain in Resend (SPF/DKIM), set `RESEND_FROM_EMAIL` to an address on it, and point both committee inboxes at the real address. Arbitrary-visitor confirmations only start working once that domain is verified.

## Publish webhook

- Sanity webhook `Vercel rebuild` (`YKcWJXxMjogWcURk`) posts to `https://cyprus-printmakers-web.vercel.app/api/sanity-webhook`, dataset `production`, trigger on create/update/delete, filtered to the ten content types and excluding `drafts.**`.
- `/api/sanity-webhook` verifies Sanity's `sanity-webhook-signature` header (HMAC-SHA256 over `<timestamp>.<raw body>`, base64url) using `SANITY_WEBHOOK_SECRET`, ignores draft payloads, then calls `VERCEL_DEPLOY_HOOK_URL`. Unsigned requests return 401; a missing env var returns 503 listing the missing name.
- End-to-end 2026-11-02: a published title change appeared live in ~50 s; the revert appeared in ~30 s. Sanity's attempt log shows two 200 deliveries, ~6–7 s each.

## Motion pass (2026-11-02)

> The home entry was superseded on 2026-11-02 by the click-gated cover recorded under "Home hero" below. The entry lifecycle, client-JS figure and test counts in this section are the motion-pass record, not the current home.

- Unit: 91 passed (14 files). E2E: 87 passed, 1 skipped (the staging-only layout spec).
- Axe (wcag2a/aa): zero violations on `/`, `/el`, `/about`, `/members`, `/projects`, `/news`, `/membership` and their Greek twins, after the entry settles. The audit waits for the intro to finish; the mid-animation clone is `aria-hidden` and translucent.
- Overflow at 320 px: ≤ 1 px on `/el`, `/el/members`, `/el/membership`, `/el/projects`, and `/el` after the intro.
- 320 px hand-off: the clone is constrained to the header's available width before measuring, so EN and EL wrap identically. Tests compare clone and real brand rects at `data-intro="handoff"`; both are within 1 px in width, height, and position.
- Failure fallback: if `intro.js` is blocked, the server-rendered lockup is already visible and the 4 s guard removes the overlay; no blank cover. Verified by aborting the script in the e2e suite.
- Overlay lifetime: the overlay gets `pointer-events: none` when the reveal starts and is removed when the 300 ms fade finishes (~1300 ms); cleanup and the session flag complete at ~1400 ms. A click at 1300 ms reaches the nav, not the overlay.
- Client JS on `/`: 4 scripts, 22,835 bytes uncompressed (ClientRouter 14,098; `intro.js` 5,628; prefetch 2,686; page 234). Source scripts total 10,504 bytes. Under the 30 KB cap.
- Lighthouse (built static output from `dist/client`, Chrome for Testing headless, re-run after review fixes on 2026-11-02):

| URL | Performance | Accessibility |
| --- | --- | --- |
| `/` | 100 | 100 |
| `/el` | 100 | 100 |

- Visual check against `docs/superpowers/specs/motion-reference/`: clone visible by ~100 ms, wordmark assembled by ~300 ms, hand-off to the header by ~900 ms, overlay gone by ~1320 ms and the page final by ~1400 ms; no jump at the hand-off.
- Entry behaviour: once per session on a full home load; skipped with reduced motion, with JS off, and on client-side arrivals at home. Escape/click/any key skips it.

## Home hero and click-gated intro (2026-11-02)

- Unit: 97 passed (15 files). `astro check`: 0 errors, 0 warnings, 0 hints. `npm run build`: succeeds. E2E after the final-review fixes: 96 passed, 1 skipped (the staging-only layout spec).
- The first full e2e run had one pre-existing canonical-env failure, not caused by the hero: `seo.spec.ts` expects `https://cyprintmakers.densetheory.cc/...` while `site/.env` sets `PUBLIC_SITE_URL` to the Vercel staging origin (observed `https://cyprus-printmakers-site.vercel.app`), so the canonical link asserted against local env. Ruling applied: `playwright.config.ts` now pins `PUBLIC_SITE_URL: 'https://cyprintmakers.densetheory.cc'` in the Playwright `webServer.env` only. Production env is unchanged; the dev server is started with the pin and the suite is deterministic.
- Axe (wcag2a/aa): zero violations on the cover and after entry, in EN and EL. `hero.spec.ts` audits the pending cover; `a11y.spec.ts` audits `/`, `/el`, `/about`, `/el/about`, `/members`, `/el/members`, `/projects`, `/el/projects`, `/news`, `/el/news`, `/membership` and `/el/membership` after entry. A separate 320 px pass audited both the pending cover and the settled page on `/` and `/el`: `[]` violations in all four states.
- Hero behaviour covered by `hero.spec.ts`: the cover button is the only tabbable element, so Tab/Shift+Tab never reach the skip link, nav or footer (focus stays on the button or resets to the body); Escape skips; Enter starts; the header brand exists only off home; with `intro.js` blocked the mark is still shown and the 4 s guard reveals the page; reduced motion and no JS go straight to the hero; the 320 px Greek hand-off matches the hero lockup within 1 px on every edge.
- Overflow at 320 px (`scrollWidth - innerWidth`, gate ≤ 1): 0 px on `/` and `/el`, both while the cover waits and after it settles. The Greek overflow spec also passes on `/el`, `/el/members`, `/el/membership` and `/el/projects`.
- Client JS on `/` and `/el` after the final-review fixes: 4 scripts, 23,348 bytes by `transferSize` on the uncompressed static server. Source scripts: `wc -c site/public/scripts/*.js` = 11,017 bytes total (forms 2,402; intro 6,141; members-filter 1,711; projects-filter 763). Under the 30 KB cap.
- Lighthouse (built static output from `dist/client` on port 4322, Chrome for Testing headless, 2026-11-02):

| URL   | Performance | Accessibility |
| ----- | ----------- | ------------- |
| `/`   | 100         | 100           |
| `/el` | 100         | 100           |

- Entry lifecycle: the cover waits indefinitely for a click; the whole-sequence watchdog starts only on entry, while the separate 4 s guard reveals the hero if `intro.js` never initialises. On click the wordmark slides in, the optional paragraph reveals, holds and fades on one mask/opacity timeline, the stage moves to the hero lockup, and the overlay fades. The nav, `CURRENT` line and page stay hidden (`.page { visibility: hidden }`) while the cover waits and moves; they appear at the hand-off. Focus lands on `main` after entry or an early Escape.
- The cover appears on every full home load (not once per session), and is skipped with reduced motion, with JS off, and on client-side arrivals at home. Enabling reduced motion while the cover is pending reveals the page immediately.
- Final whole-branch review fixes (2026-11-03): reduced-motion-while-pending no longer blanks the page; the paragraph reveal is a single timeline; the pending mark is centred by its own rect; animation rejection/cancel paths clean up and a watchdog covers the active sequence; the footer returns to normal flow (320×256 no overlap); the desktop paragraph sits below/right of the wordmark; the idle cover no longer auto-dismisses. Re-run after fixes: 96 e2e passed, 1 skipped; Lighthouse 100/100 on `/` and `/el`.

## Archive content import (2026-11-04)

- Imported **20 projects**, **18 members** and **7 committee entries** from `wix-archive` into `hyel0os7/production`, with **31 images** (11 year covers, 3 extra 2017 project images, 17 member portraits). Each project cover is the year cover from the old `/project` index; 2017’s three extras are assigned to its first three projects. Nicolas Mouros has no portrait on the old site and keeps the placeholder.
- The sample members, committee, projects and news posts were removed; home `CURRENT` now points at “PRINTMAKING EXHIBITION - GLORIA GALLERY” (`/projects/printmaking-exhibition-gloria-gallery-2019`). The news section is empty until the committee supplies posts.
- A second pass (`npm run import:pages`) replaced the seeded page copy with the archived text: the about page (headline, three intro paragraphs, three history paragraphs, partners), the contact address and workshop note, and the home intro paragraph. The old committee page supplied Greek names and roles for the seven committee members, which are now `el` values on those member and committee records.
- A third pass copied the old PDF posters and programmes into Sanity file assets and attached them to their projects: **8 links across 8 projects**, served from `cdn.sanity.io` so they survive the old Wix site. The files were saved under `wix-archive/pdfs/` (not in git).
- Deliberate edits to the source: the Greek treasurer role “Ταμείας” on the old committee page is corrected to “Ταμίας”; the about headline is title-cased for the design; the English member names keep the members-list spelling (“Annie”, “Hourig”) while their Greek names use the committee page spelling.
- Invented Greek translations of the seeded copy were removed, so `/el/about/` and `/el/contact/` now fall back to the real English text and stay `noindex`.
- Project pages were verified locally: 20 English + 20 Greek project pages, 18 English + 18 Greek member pages; portraits resolve through the Sanity CDN; the Greek member fallback renders English with `noindex`.
- The publish webhook was disabled for the batch and re-enabled afterwards, so the import did not trigger one deployment per document.
- Deployed the imported content to production and verified live: home `CURRENT` is Gloria 2019, `/members/` lists 18 members, `/projects/` lists 20 projects, `/about/` shows the archive copy and the committee with Efklides Papadopoulos as Chair, `/contact/` shows Aigeos 7 / Palouriotissa 1035 and the map link, project and portrait images load from `cdn.sanity.io`, `/news/` is empty but returns 200, and the Greek pages are `noindex,nofollow`. The Vercel project has no env vars, so the Sanity deploy hook cannot rebuild yet — deploys are manual (`site/README.md` → Deploy). `cyprus-printmakers-web.vercel.app` is not a domain of the Vercel project in this team and still serves an older build; the project domains are `cyprintmakers.densetheory.cc` and `cyprus-printmakers.vercel.app`.
- Still pending, because the archive has no source material: real news posts, Greek copy for the about/contact/membership pages, committee-confirmed membership prices, opening hours, the privacy notice, and the association's DNS.

## Bilingual pass

## Accessibility

## Performance

- Lighthouse (built static output served from dist/client, Chrome for Testing headless), 2026-10-27:

| URL  | Performance | Accessibility |
| ---- | ----------- | ------------- |
| `/`  | 100         | 100           |
| `/el` | 100        | 100           |

- Overflow gate: `scrollWidth - innerWidth <= 1` at 320px passes on `/el`, `/el/members`, `/el/membership`, `/el/projects` (form inputs needed `min-width: 0; width: 100%`).
- Axe (wcag2a + wcag2aa): zero violations on `/`, `/about`, `/members`, `/projects`, `/news`, `/membership` and their `/el` twins; every page has `lang`, every image an `alt`, every visible control a label.
- Note: Lighthouse numbers were measured against the prerendered static output; the deployed page adds no client JS beyond the 4.4 KB of scripts measured here.
