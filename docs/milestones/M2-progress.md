# M2 — Progress / Handoff

> Entry point for the next session. Read CLAUDE.md → docs/specs/M2.md →
> docs/milestones/M2.md → this file, then inspect the files to confirm reality
> matches. Last updated: 2026-06-27.
>
> Quick re-anchor: `pwsh scripts/re-anchor.ps1`.

## Where things stand (one line)

M2 is **code-complete across all 4 phases and statically verified** (typecheck,
lint, web bundle on mobile; typecheck + lint + 329 tests on the web app).
**Remaining: live end-to-end verification** (real sign-in + real writes against
the Vercel preview, and an on-device APK run) — that needs the USER. Both repos'
work sits on feature branches, unmerged.

## Branches (unmerged)

- Web app `clearview-savings`: **`feat/m2-mobile-api`** (pushed → Vercel preview).
- Mobile `clearview-savings-mobile`: **`feat/m2-real-auth`** (local; Phases 2+3).

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

## Not done — Phase 4 (live verification) — NEEDS THE USER

Static checks all pass; the live path was not exercised. Exact next steps:

1. **Set the API base URL.** Get the `feat/m2-mobile-api` Vercel **preview** URL;
   confirm its Preview env has DATABASE_URL + Supabase keys. Put it in mobile
   `.env.local` as `EXPO_PUBLIC_API_BASE_URL` (also add `MOBILE_ALLOWED_ORIGINS`
   = `http://localhost:8081` on the web app's Preview env for Expo-web CORS).
2. **Add the Turnstile key** to mobile `.env.local`:
   `EXPO_PUBLIC_TURNSTILE_SITE_KEY` (= web `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
3. **Real sign-in** (`npm run web`): caregiver email/password → Turnstile solves
   → reach Your patients (the smoke test M1 couldn't finish). If MFA on, the
   challenge screen should complete it (AC-2).
4. **Diagnostics** (signed in for real): live Supabase URL + passing RLS read.
5. **Writes:** redeem a real deposit code; post a manual transaction; transfer.
   Confirm balances update and an audit row matches the web path. Try a crafted
   `patientId` (expect 403).
6. **On-device APK:** rebuild (`eas build --platform android --profile preview`),
   set the same env, verify native Turnstile (the WebView baseUrl /
   `EXPO_PUBLIC_TURNSTILE_HOST` must be in the site key's allowed domains) +
   sign-in + a write.
7. When green: merge both branches; point `EXPO_PUBLIC_API_BASE_URL` at
   production; update this doc + memory.

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
