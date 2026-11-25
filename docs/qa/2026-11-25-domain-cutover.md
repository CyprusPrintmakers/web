# cyprintmakers.com cutover

## Done

- DNS: `cyprintmakers.com` resolves through Vercel DNS. `www.cyprintmakers.com`
  307s to the apex, so the Vercel project's primary domain is the apex.
- Vercel: the domain was added by the account owner on 2026-11-25.
- Resend: `cyprintmakers.com` was added by the account owner.
- Sanity CORS: added `https://cyprintmakers.com` and
  `https://www.cyprintmakers.com` with credentials allowed. The existing
  `cyprus-printmakers-web.vercel.app`, `cyprintmakers.densetheory.cc` and
  localhost origins remain.

## Code

The canonical origin is `https://cyprintmakers.com` in `astro.config.mjs`,
`playwright.config.ts`, `.env.example` and the SEO tests. `vercel.json` owns
the retired member redirects; Vercel owns the `www` → apex redirect.

## Remaining

1. In the association's Vercel project (the one serving
   `cyprus-printmakers-web.vercel.app`), set Production env:
   - `PUBLIC_SITE_URL=https://cyprintmakers.com`
   - `PUBLIC_STAGING=false`
   Then redeploy. The current deployment still emits the staging badge,
   `noindex`, and the old `cyprus-printmakers-web.vercel.app` canonical.
2. Sanity webhook `Vercel rebuild`: point at
   `https://cyprintmakers.com/api/sanity-webhook`.
3. Resend: confirm the domain is verified and set `RESEND_FROM_EMAIL` and the
   committee recipients in Vercel.
4. Verify after deploy:
   - `https://cyprintmakers.com/robots.txt` allows crawlers.
   - No staging badge and no `noindex`.
   - Canonical and sitemap use `https://cyprintmakers.com`.
   - `https://www.cyprintmakers.com/about` 307s to the apex.
   - `/members/old-slug` 308s to `/members`.

The association Vercel project is not under the CLI account, so steps 1-3
cannot be run from this checkout.
