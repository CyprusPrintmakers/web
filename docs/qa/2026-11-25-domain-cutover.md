# cyprintmakers.com cutover

DNS nameservers for cyprintmakers.com are already `ns1.vercel-dns.com` and
`ns2.vercel-dns.com`. Because the domain is not attached to a Vercel project,
Vercel's nameservers currently answer `REFUSED` and the domain does not resolve.

Code-side changes are in place (`PUBLIC_SITE_URL`, apex redirect, tests).

Remaining, in the association's Vercel project (the one serving
`cyprus-printmakers-web.vercel.app`):

1. Domains → add `cyprintmakers.com` and `www.cyprintmakers.com`.
2. Set the apex domain to redirect to `www`.
3. Production env: `PUBLIC_SITE_URL=https://www.cyprintmakers.com`,
   `PUBLIC_STAGING=false`; redeploy.
4. Sanity Manage → API → CORS origins: add `https://www.cyprintmakers.com`
   and `https://cyprintmakers.com` (credentials allowed), keep the Vercel and
   localhost origins.
5. Sanity webhook `Vercel rebuild`: point at
   `https://www.cyprintmakers.com/api/sanity-webhook`.
6. Resend → Domains: verify `cyprintmakers.com`, add the SPF/DKIM records in
   Vercel DNS, then set `RESEND_FROM_EMAIL` and the committee recipients.
7. Verify: `/robots.txt` allows crawlers, no staging badge, canonical and
   sitemap use `https://www.cyprintmakers.com`, `/members/old-slug` 308s to
   `/members`.

The local Sanity CLI is not logged in and the association Vercel project is not
under the accessible team, so steps 1-6 cannot be run from this checkout.
