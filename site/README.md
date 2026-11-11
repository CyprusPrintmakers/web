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
| `RESEND_FROM_EMAIL` | Verified sender address; defaults to Resend's test sender (account owner only) | Form endpoints |
| `CONTACT_TO_EMAIL` / `MEMBERSHIP_TO_EMAIL` | Committee inboxes | Form endpoints |
| `SANITY_WEBHOOK_SECRET` | Verifies Sanity webhook signatures at `/api/sanity-webhook` | Production |
| `VERCEL_DEPLOY_HOOK_URL` | Deploy Hook triggered after a verified publish | Production |

Content source is deterministic: `CONTENT_SOURCE` wins when set; otherwise `sanity` when `SANITY_PROJECT_ID` is present, `fixtures` when not. A checkout with no `.env` builds fixtures — it never touches the network.

## Editorial workflow (Sanity)

- Studio: `/admin` on any deployment with `SANITY_PROJECT_ID` set.
- Seed the initial content once: `npm run seed` (idempotent for singletons, non-destructive for collections; `-- --dry-run` prints payloads without credentials).
- After changing schema types, regenerate the embedded Studio manifest: `npm run manifest` (writes `public/admin/static` and `public/static`). The committed manifest is what the Studio and Dashboard read.
- Draft preview: the `/preview/<path>` route renders a minimal draft page. The Presentation tool only registers when `PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true` and a read token are set; full visual editing is still deferred.
- Import the archived Wix content: `npm run import:content:dry` prints the counts and project/cover mapping; `npm run import:content` uploads the year covers and member portraits, copies the old PDF posters/programmes to Sanity file assets, writes projects/members/committee with deterministic ids, removes the sample documents and points home `CURRENT` at the first 2019 project. It pauses the publish webhook for the batch and re-enables it. `npm run import:pages` then writes the about page copy, contact details, home intro paragraph and the Greek names recorded on the old committee page. Both read `../wix-archive` (not in git); `import:projects` / `import:members` remain the older dry-run-only helpers.
- What the archive does **not** contain: news posts (the old news page is empty), Greek copy for the about/contact/membership pages, membership prices, opening hours or a privacy notice. The site keeps those sections empty or gated until the committee supplies them.
- Publishing rebuilds the site: Sanity webhook → Vercel deploy hook (verify with a test publish; the rebuild should start within 60 s).
- Featuring content on the home page: open a project or news post and switch **Featured** on, then publish. The home page shows the latest featured project in the `CURRENT` line (ordered by project start date, then year) and the latest featured news post in the `NEWS` line (ordered by published date). Only one of each is shown. With no featured project, `CURRENT` falls back to the manual current title and link in Home page settings.

## Backups

Weekly: `npx sanity dataset export production backup-$(date +%F).tar.gz` — keep the exports somewhere off the laptop.

## Deploy

Vercel project root is this `site/` directory, framework Astro, Node 22.x. Production (which currently *is* the staging host) runs with `PUBLIC_STAGING=true` and `PUBLIC_SITE_URL=https://cyprintmakers.densetheory.cc`. Moving to `www.cyprintmakers.com` is an env change only: flip `PUBLIC_STAGING=false`, change `PUBLIC_SITE_URL`, verify the domain in Resend, redeploy.

There are two Vercel projects:

- **The association's project** (the live one, serving `cyprus-printmakers-web.vercel.app` and `cyprintmakers.densetheory.cc`): has the environment variables and the Git integration, so **pushing `site-build` deploys it** and the Sanity webhook can rebuild it.
- **The project under Elia's team** (`cyprus-printmakers`): no env vars, used only for manual previews. To deploy it by hand:

```sh
cd site
PUBLIC_STAGING=true PUBLIC_SITE_URL=https://cyprintmakers.densetheory.cc npx astro build
npx vercel deploy --prebuilt --prod
```

## Studio and auto-updates

- Production Studio: `/admin`, built as a static Sanity Studio with `sanity build` and served from `public/admin`. The embedded `@sanity/astro` Studio is local-dev only, because Sanity's auto-updates feature does not support embedded Studios.
- `npm run build` runs `scripts/build-studio.mjs` before Astro. It builds the Studio, rewrites its `/static` references to `/admin/static`, copies the `static`/`vendor` bundles into `public/admin`, and leaves the folder gitignored.
- `sanity.cli.ts` has `deployment.autoUpdates: true`. The custom schema and plugins ship with the site build; the Studio core updates itself from Sanity's CDN (currently 6.23.0 while the local package is 6.20.0 — update locally with `npm i sanity@latest` when convenient).
- `vercel.json` rewrites `/admin` and `/admin/*` to the Studio shell so browser-history deep links survive a refresh; the filesystem takes precedence, so `/admin/static` and `/admin/vendor` are served normally.
- CORS origins in Sanity Manage include `https://cyprintmakers.densetheory.cc`, the Vercel production URL, and `http://localhost:4324`. Add any new preview origin there.
- `npm run dev` removes `public/admin` and uses the embedded Studio for HMR. `npm run manifest` writes the schema manifest to `public/static`.

## Licence

Geologica is used under the SIL Open Font License 1.1 (`public/fonts/OFL.txt`), fetched from Google Fonts (fonts.google.com/specimen/Geologica). The upstream OFL header names "Geologisk" — Google's own file; the licence text is committed unmodified.
