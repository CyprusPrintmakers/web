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
