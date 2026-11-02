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
