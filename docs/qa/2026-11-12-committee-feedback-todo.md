# Committee feedback — 11 Nov 2026

Working notes for the first feedback round. Source: `meeting-with-commitee-11-11.md`.

## 1. Header / language switch
- [x] Move EN/ΕΛ into the primary menu, matching nav size; make it smaller.
- [x] On home, replace the inline menu with a burger on the right.
- [x] Burger opens a panel with nav, language switch and theme toggle.
- [x] Keyboard: Escape closes, focus returns to the burger; outside click closes.

## 2. Members
- [x] Remove member email addresses from the directory and profiles.
- [x] Show a small horizontal arrow link to a member's website when present.
- [x] Make the `featured` member toggle visible: featured members section on `/members`.
- [x] Committee roles move below the name, not right-aligned.

## 3. About
- [x] Committee roles move below the name, not right-aligned.

## 4. Membership / support
- [x] Add annual membership fee: €60.
- [x] Add bank-details section (pending/coming soon) in EN and EL.
- [x] Add one-off donation section in EN and EL to the membership page.
- [x] Remove the support page, support Sanity schema/query/types/fixtures/seed and nav link.
- [x] Redirect `/support` → `/membership` and `/el/support` → `/el/membership`.
- [x] Remove now-unused support/tier display code and update tests.

## 5. Brayer cursor
- [x] Generate dark grayscale asset for light mode.
- [x] Generate light grayscale asset for dark mode.
- [x] Swap assets with the theme; keep the 180° flip and press state.

## 6. Opening hero / ink playground
- [x] Slow the opening reveal to 500ms.
- [x] Size the hero mark (300% request, then scaled down by one-third to 2×) with the desktop row typography preserved.
- [x] Scale the intro mark to match; grow the ink playground with the lockup.
- [x] Set the row breakpoint to 1240px so the 2× mark and the `Cyprus [logo] Printmakers Association` row fit.

## 7. Verification
- [x] Update unit/e2e tests, add coverage for the new menu, membership copy and featured members.
- [x] Run `npm test`, `npm run check`, `npm run build`, full Playwright suite.
- [x] Patch the live Sanity membership document and remove the support document.
- [x] Deploy and verify live at 390 / 1440, light and dark.
