# Design deviations

The desktop exports in `0. Mockups/HTML/DESKTOP/` are the authority for composition: what sits where, how big it is, what rule separates it, and what the eye sees first. Where they are silent — states, Greek, mobile, forms, errors, staging — the build makes the closest-neighbour choice from existing tokens and records it here. Accessibility wins over the mockup when the two conflict.

Each departure needs a one-line reason and a status so the committee can review the list rather than discovering changes in the browser.

| Departure | Reason | Status |
|---|---|---|
| Language switcher in the nav row | Bilingual launch; the mockup predates the decision. It is sized and spaced as a nav item and kept outside the primary `<nav>` landmark. | In this build (Task 3) |
| Hover, focus and active states | Absent from the mockup. Designed once from existing tokens: 1 px underline on hover/active, a 2 px black focus outline offset 3 px, and reverse video on pill hover — no transitions longer than 120 ms. | In this build (Task 3) |
| `#b3b3b3` text replaced with `#6e6e6e` where it must be read | The mockup grey is about 2.1:1 on white and fails WCAG AA at body size; `#6e6e6e` is about 5:1. `#b3b3b3` stays decorative only. | In this build (tokens from Task 1, applied as text lands) |
| Greek wrapping in the nav and tier names | Greek strings run longer. Type size and spacing hold and lines wrap rather than shrinking below the ramp. | In this build for the nav (Task 3); tier names with Task 8 |
| Mobile layouts | The mobile exports reuse desktop absolute coordinates and cannot be used. Mobile is composed from the desktop grid and the same 8 px spacing steps, with a smaller nav and body ramp. | Layout frame in this build (Task 3); full pass in Task 17 |
| Form validation and success states | Not in the mockup. Designed from the same 1 px rules, type ramp and plain-language error copy, with errors adjacent to their fields. | Pending Task 12 |
| 404 and error pages | Not in the mockup. Composed from the same type ramp, rules and a single route back to the home page. | Pending Task 15 |
| Footer text inset at the 60 px page frame instead of the mockup's 9 px | Header, main and footer share one frame so their left edges align at every width; the mockup's 9 px inset would step outside the grid. | In this build (Task 3) |
| Staging badge in the footer | A staging-only marker, paired with `noindex, nofollow`, so nobody mistakes the review site for the live one. Removed at cutover. | In this build (Task 3) |
| Mark optimised from 1514 × 2085 / 12.6 MB to 800 px on the long edge | The source is displayed at roughly 158 × 192 px; keeping the original would ship megabytes for no visible gain. The 800 px long edge leaves room for high-density displays. | In this build (Task 1) |
