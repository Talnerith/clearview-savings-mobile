# M2 — Progress / Handoff

> Entry point for the next session. Read CLAUDE.md → docs/specs/M2.md →
> docs/milestones/M2.md → this file, then inspect the files to confirm reality
> matches. Last updated: 2026-06-27.
>
> Quick re-anchor: `pwsh scripts/re-anchor.ps1`.

## Where things stand (one line)

M2 is **COMPLETE — verified live end-to-end and merged to production** (2026-06-27).
All 4 phases done; both feature branches merged to `master` and pushed. The only
remaining item is an **on-device APK run** (native Turnstile), which is a
follow-up, not a blocker.

## Live verification (2026-06-27) — all green

Run on Expo-web against the production shared backend, signed in as a real
caregiver (`chub_mister+test1`, patient "Bayani Hintay"):
- Turnstile sign-in ✅ · Diagnostics RLS round-trip 398ms ✅
- Manual transaction (+$5) ✅ · Deposit redemption (CA$100 workbook reward
  "Activity Set #2") ✅ · Transfer (Checking −$50 / Savings +$50, atomic) ✅
- Reads (patients/accounts/transactions/pending deposits) all live ✅

**Backend fix this surfaced (now in `supabase/policies.sql`, applied to prod):**
the `authenticated` role had RLS policies but **no table-level SELECT grant**, so
PostgREST reads failed with "permission denied". Added `grant select` on
caregivers/patients/accounts/transactions/scheduled_deposits (SELECT-only;
caregivers included because the ownership policies subquery it). The web app
never hit this because it reads via a direct DATABASE_URL connection.

## Branches (MERGED)

- Web `clearview-savings`: `feat/m2-mobile-api` → merged to `master` (51aecfc).
- Mobile `clearview-savings-mobile`: `feat/m2-real-auth` → merged to `master`
  (a2fc2ce). `EXPO_PUBLIC_API_BASE_URL` production = `https://clearviewsavings.com`.

## Done — Phase 1 (web endpoints, `clearview-savings`)

JWT-authenticated REST endpoints the mobile app calls (CLAUDE.md sanctions REST
when an external client needs it). No balance logic duplicated — they reuse the
existing helpers.

- `app/api/m/deposit/redeem/route.ts` → `redeemCode`
- `app/api/m/transactions/manual/route.ts` → `applyManualAdjustment` (extracted)
- `app/api/m/transfers/route.ts` → `performTransfer`
- `lib/auth/api-caregiver.ts` — bearer-token auth via `getUser(token)`; AAL2/MFA
  gate (an aal1 token from an MFA-enrolled caregiver is rejected, via an admin
  factor check); `requireApiPatient` enforces ownership server-side (crafted id → 403).
- `lib/api/respond.ts` (ApiError + JSON + CORS allow-list for Expo web),
  `lib/auth/ensure-caregiver.ts`, `lib/auth/owned-patient.ts`, `lib/money.ts`,
  `lib/transactions/manual-adjustment.ts` (+ co-located test).
- Shared schemas (`transferInput`, `redeemInput`, `manualAdjustmentInput`) so the
  web actions and endpoints can't drift. Web actions refactored to thin callers.
- Verified: `pnpm typecheck` + `pnpm lint` clean; **329 tests pass** (5 new).

## Done — Phase 2 (mobile real auth, `clearview-savings-mobile`)

- `components/TurnstileGate.tsx` (native, react-native-webview) +
  `.web.tsx` (@marsidev/react-turnstile) + `turnstile-types.ts`. Sign-in passes
  `captchaToken`; widget remounts per attempt for a fresh single-use token.
- `lib/auth.tsx` now tracks session AAL; `app/(auth)/challenge.tsx` handles the
  TOTP step-up. Entry redirect + caregiver gate route a pending session there.
- New env (all public): `EXPO_PUBLIC_TURNSTILE_SITE_KEY`,
  `EXPO_PUBLIC_TURNSTILE_HOST`, `EXPO_PUBLIC_API_BASE_URL`.

## Done — Phase 3 (mobile write features)

- `lib/api.ts` — token-attaching client to `EXPO_PUBLIC_API_BASE_URL`; typed
  `redeemDeposit` / `manualTransaction` / `transfer`; `ApiError`.
- `app/(patient)/view/[id]/deposit.tsx` — patient "Deposit a Check" (large type,
  calm states, no "demo" wording) + entry button on the accounts screen.
- `components/CaregiverActions.tsx` — manual transaction + transfer forms on the
  patient detail screen; reloads balances on success.
- `components/ui.tsx` — shared `TextField` + `ChipGroup`.
- Demo mode: caregiver writes show "changes aren't saved"; deposit simulates
  success. **Verified in demo mode on web** (forms render, validation gates,
  demo guard fires, deposit success screen shows) via browser screenshots.

## Remaining follow-ups (post-merge, non-blocking)

1. **On-device APK** — rebuild (`eas build --platform android --profile preview`)
   with EAS env `EXPO_PUBLIC_API_BASE_URL=https://clearviewsavings.com` +
   `EXPO_PUBLIC_TURNSTILE_SITE_KEY` + `EXPO_PUBLIC_TURNSTILE_HOST`. Verify native
   Turnstile (its WebView baseUrl host MUST be in the site key's allowed
   domains), sign-in, and a write on a real phone. Then swap into the v0.1.0
   release. (This also covers the stale-APK item carried from M1.)
2. **Re-enable Vercel preview Deployment Protection** — it was turned off to test
   the preview API; production is (correctly) public, preview should be
   re-protected.
3. **Nav bug to investigate** — a stray `…/view/<id>/account/undefined` URL was
   observed (likely an account card tapped before data loaded). The Diagnostics
   back-button gap is already fixed; re-audit account-card navigation for an
   undefined accountId guard.
4. **MFA path** — the test caregiver has no TOTP factor, so the challenge screen
   wasn't exercised live; enroll a factor on the web app to test AC-2 when
   convenient.

## Decisions made (don't relitigate)

- Pragmatic parity (skip PDF/admin/cron/webhooks); shared backend endpoints
  (not duplicated logic, not direct-to-RLS writes); native auth in M2; first
  write slice = deposit + manual txn + transfer. (See spec "Resolved decisions".)
- Endpoints reuse existing helpers; web Server Actions became thin callers — the
  web test suite is the regression net proving no behavior change.
- AAL enforced on endpoints via an admin `getUserById` factor check only when the
  token isn't already aal2 (keeps the common no-MFA path cheap).

## Known issues / risks to watch

- **Native Turnstile hostname:** Cloudflare checks the WebView document host
  against the site key's allowed domains. We set WebView `baseUrl` to
  `EXPO_PUBLIC_TURNSTILE_HOST` (default `https://clearviewsavings.com`). If
  on-device sign-in returns a captcha rejection, that host isn't allow-listed —
  add it (or the right host) to the Turnstile widget config. Only confirmable on
  a device (step 6).
- **Vercel preview env:** the preview must carry DATABASE_URL + Supabase keys or
  the endpoints 500. Confirm in step 1.
- Tokens are single-use; the sign-in widget remounts per attempt — if a "captcha
  already used" error appears, that remount isn't firing.
