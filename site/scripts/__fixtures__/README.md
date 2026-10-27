# Wix archive fixtures

Trimmed content regions of real pages, archived 2026-10-27.

| Fixture | Exact live URL |
|---|---|
| `wix-project.html` | https://www.cyprintmakers.com/projects/2019 (Wix dynamic page: one project per year page) |
| `wix-year.html` | https://www.cyprintmakers.com/2019 (year landing page listing that year's project titles) |

The full archived site (37 pages, 189 images) lives in `wix-archive/` outside the repo.

Reality notes vs the original plan:
- `/projects-1` (the Item List) carries no direct hrefs to `/projects/<year>` — the Read More buttons are client-side. Year landing pages (`/2019`) list project titles as text, not links.
- The dynamic project page for 2019 is "EPALE WORKSHOP", not "Printmaking Days" — the tests assert the recorded fixture content.
- The live members page lists 18 members (the plan's 17 predated a new signup).
