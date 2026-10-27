# Cyprus Printmakers Association — site

Bilingual (English/Greek) Astro 7 static site with Sanity CMS, deployed to Vercel. Spec: `../docs/superpowers/specs/2026-10-26-cyprus-printmakers-design.md`.

## Local setup

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # fixture build, no env needed
npm run test           # vitest unit tests
npm run test:e2e       # playwright (auto-starts a fixture dev server)
```

Node `>=22.23.4 <23`. npm only.

## Environment

Copy `.env.example` to `.env`. Every variable:

| Variable | Purpose | Required for |
| --- | --- | --- |
| `SANITY_PROJECT_ID` | Selects the Sanity content source | Sanity-backed builds, Studio at `/admin` |
| `SANITY_DATASET` | Dataset name (default `production`) | Sanity |
| `SANITY_API_READ_TOKEN` | Draft preview (`/preview`), `useCdn: false` reads | Preview only |
| `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` | Turns the `/preview` surface on (needs the token too) | Preview only |
| `CONTENT_SOURCE` | Force `fixtures`; otherwise `sanity` when a project id exists, else fixtures | Offline work |
| `PUBLIC_STAGING` | `true` → `noindex` everywhere, `Disallow: /` robots, footer badge | Staging deploys |
| `PUBLIC_SITE_URL` | Canonical origin for sitemap/absolute URLs | Deploys |
| `RESEND_API_KEY` | Sends the membership/contact form emails | Form endpoints |
| `CONTACT_TO_EMAIL` / `MEMBERSHIP_TO_EMAIL` | Committee inboxes | Form endpoints |
| `SANITY_WEBHOOK_SECRET` | Authenticates the publish webhook | Production |

Content source is deterministic: `CONTENT_SOURCE` wins when set; otherwise `sanity` when `SANITY_PROJECT_ID` is present, `fixtures` when not. A checkout with no `.env` builds fixtures — it never touches the network.

## Editorial workflow (Sanity)

- Studio: `/admin` on any deployment with `SANITY_PROJECT_ID` set.
- Seed the initial content once: `npm run seed` (idempotent for singletons, non-destructive for collections; `-- --dry-run` prints payloads without credentials).
- Draft preview: enable the two preview variables, open `/preview/<path>` or use the Presentation tool in the Studio.
- Import the archived Wix content: `npm run import:projects` / `npm run import:members` print the exact write payloads (NDJSON) as a dry run; the live write path is wired to `createOrReplace` on fixed ids and is reviewed before running.
- Publishing rebuilds the site: Sanity webhook → Vercel deploy hook (verify with a test publish; the rebuild should start within 60 s).

## Backups

Weekly: `npx sanity dataset export production backup-$(date +%F).tar.gz` — keep the exports somewhere off the laptop.

## Deploy

Vercel project root is this `site/` directory, framework Astro, Node 22.x. Production (which currently *is* the staging host) runs with `PUBLIC_STAGING=true` and `PUBLIC_SITE_URL=https://cyprintmakers.densetheory.cc`. Moving to `www.cyprintmakers.com` is an env change only: flip `PUBLIC_STAGING=false`, change `PUBLIC_SITE_URL`, verify the domain in Resend, redeploy.

## Licence

Geologica is used under the SIL Open Font License 1.1 (`public/fonts/OFL.txt`), fetched from Google Fonts (fonts.google.com/specimen/Geologica). The upstream OFL header names "Geologisk" — Google's own file; the licence text is committed unmodified.
