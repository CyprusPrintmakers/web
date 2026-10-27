# Cyprus Printmakers Association — QA log — 2026-10-26

## Deferred checks

- Geologica OFL upstream header names "Geologisk" (Google's own file); Task 18 README records the licence source and discrepancy — do not rewrite the licence text.
- Greek WOFF2 is 6,308 bytes (authentic subset); the brief's 8 KB gate was a corruption heuristic and was replaced by a valid-wOF2 check.
- mark.png optimised from 1514×2085 / 12.6 MB to 800 px long edge; record in docs/design-deviations.md at Task 3.
- Task 5: the prerendered-Studio check (`dist/admin/index.html`) is deferred until the Sanity project exists (Human Prerequisite 1). `astro.config.mjs` adds the Sanity integration only when `SANITY_PROJECT_ID` is set, so fixtures builds are unaffected. Re-run `npm run build && test -f dist/admin/index.html` once the project id is available.
- Task 14: full Sanity Presentation stega + `VisualEditing` in BaseLayout are deferred until the Sanity project exists (Human Prerequisite 1) — `sanity:astro`'s virtual modules do not resolve in fixture builds. The preview route is live and fails closed (503) with the dual-key guard; the Presentation tool registers in `sanity.config.ts` only when `SANITY_PROJECT_ID` is set.
- Task 5: slug uniqueness is not enforced by a Studio rule (not supported by this Sanity version's rule typings); the seed and import scripts enforce it via deterministic document ids.

## Wix archive

## Bilingual pass

## Accessibility

## Performance
