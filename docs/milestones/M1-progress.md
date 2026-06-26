# M1 — Progress / Handoff

> Entry point for the next session. Read CLAUDE.md → docs/specs/M1.md →
> docs/milestones/M1.md → this file, then inspect the files to confirm reality
> matches. Last updated: 2026-06-26 (end of session 2).
>
> Quick re-anchor: `bash scripts/re-anchor.sh` (or `pwsh scripts/re-anchor.ps1`).

## Where things stand (one line)

M1 is functionally complete and the app is **public, deployed, and CI-green**.
Remaining work is two deferred polish items (see "Exact next steps").

## Done — foundation (session 1)

- Expo + expo-router + TypeScript scaffold; Supabase client on the shared
  backend (publishable key, AsyncStorage, auto-refresh).
- Caregiver sign-in; caregiver patient list + patient detail; patient bank view
  (accounts + account detail) with the patient UX rules; always-on disclosure
  footer; in-app **Diagnostics** backend test harness.
- **Demo mode** (`lib/demo.ts`): explore the whole app on sample data, no
  backend — powers the public web demo. "demo" wording is caregiver-side only.
- Handoff/re-anchor system (docs specs/milestones/decisions, memory/, scripts).

## Done — polish & distribution (session 2)

- **Design synced to the web app** (ADR not added; see CLAUDE.md "Branding"):
  brand primary → Tailwind **emerald-700**, near-white neutral surfaces,
  web-matched radii; buttons darken + `scale 0.98` on press; phone-width
  centered column so the web demo doesn't stretch on desktop. Hid the dev-only
  "backend not configured" notice in production (`__DEV__` gate).
- **Brand logo in-app** (`components/Brandmark.tsx`, react-native-svg): the
  sun+wave mark + wordmark, copied verbatim from the web
  `clearview-savings-icon.svg`. On sign-in, caregiver list, and patient nav bars.
- **Brand image assets** (`assets/*.png` via `npm run assets` →
  `scripts/generate-brand-assets.mjs`, sharp): launcher icon, Android adaptive
  icon, splash, web favicon — reversed mark (white wave) on navy `#19293A`.
  Wired into `app.json`.
- **Shipped publicly:**
  - GitHub (public): https://github.com/Talnerith/clearview-savings-mobile
  - CI green (typecheck + lint) on every push.
  - Live web demo: https://clearview-savings-mobile.vercel.app (Vercel,
    auto-redeploys on push).
  - APK release v0.1.0:
    https://github.com/Talnerith/clearview-savings-mobile/releases/tag/v0.1.0
  - EAS project linked: `@talnerith/clearview-savings-mobile`
    (projectId in app.json).

## Verified this session

- `npm run typecheck` — clean. `npm run lint` (eslint 9 flat) — clean.
- `npx expo export` builds clean on ios, android, web (favicon emitted).
- CI green on the latest push.

## Known issues / notes

- **The v0.1.0 APK is stale**: it was built *before* the emerald design, the
  in-app logo, and the brand icons. It works but looks like the old navy build.
  Rebuild to refresh it (see next steps).
- The Android `preview` EAS build must be run from a **real terminal** (not the
  `!` runner), because the keystore prompt needs a TTY. First build already
  generated/stored the keystore on EAS, so subsequent builds may not re-prompt.
- `eas.json` `preview`/`production` profiles carry a `channel` field → `eas
  build` may ask to set up EAS Update; answer **n** (we don't use OTA).
- No automated tests yet; verification is typecheck + lint + manual.

## Exact next steps (the two deferred open items)

1. **Rebuild the APK with the current code, then swap it into the v0.1.0
   release** (link stays the same):
   - In a real terminal in the project dir:
     `eas build --platform android --profile preview` (answer **n** to EAS
     Update, **y** to keystore if asked). ~15–40 min on free tier.
   - Get the APK URL: `eas build:list --limit 1 --json` →
     `artifacts.applicationArchiveUrl`; download it.
   - Replace the release asset:
     `gh release upload v0.1.0 <new.apk> --clobber`
     (Claude can do the download + upload once the build finishes.)

2. **Add screenshots** (capture from the live demo in demo mode, phone-shaped
   via Chrome F12 → device toolbar → ⋮ → "Capture screenshot"). Save to
   `assets/screenshots/` as `patient-accounts.png`, `diagnostics.png` (+ optional
   `caregiver-patients.png`, `account-detail.png`, `sign-in.png`). Then
   uncomment the image table in `README.md` "Screenshots" (snippet is in a
   comment there) and push. See `assets/screenshots/README.md`.

## Optional / later (not blocking)

- iOS standalone build (needs paid Apple Developer account).
- Wire `EXPO_PUBLIC_SUPABASE_*` into Vercel if a live-backend (non-demo) web
  sign-in is ever wanted — not required; demo mode covers viewing.
- First real run against the live Supabase project (fill `.env.local` from the
  web app's keys, `npm start`, sign in, open Diagnostics).
