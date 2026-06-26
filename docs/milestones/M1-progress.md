# M1 — Progress / Handoff

> This is the entry point for the next session. Read CLAUDE.md →
> docs/specs/M1.md → docs/milestones/M1.md → this file, then inspect the files
> to confirm reality matches. Last updated: 2026-06-26 (initial scaffold).

## Done

- Project config: `package.json`, `app.json`, `tsconfig.json`,
  `babel.config.js`, `.gitignore`, `.env.example`, `expo-env.d.ts`.
- `lib/theme.ts` — neutral palette + patient/caregiver type scales.
- `lib/supabase.ts` — shared-backend client (publishable key, AsyncStorage,
  auto-refresh, `isSupabaseConfigured` guard).
- `lib/branding.ts` — `BRAND_NAME`, `getPatientBrand`, `DISCLOSURE_TEXT`.
- `lib/format.ts` — money (integer cents) + patient/caregiver date formatting.
- `lib/auth.tsx` — `AuthProvider` / `useAuth`, session lifecycle.
- `lib/queries.ts` — RLS-scoped reads (patients, accounts, transactions,
  pending deposits) + `pingBackend`. Row types mirror the web Drizzle schema.
- `components/` — `Screen`, `DisclosureFooter`, `ui` (Button/Card/Notice/Loading).
- Routing: `app/_layout.tsx`, `app/index.tsx`, `app/(auth)/` (sign-in).
- Caregiver mode: `(caregiver)/_layout.tsx` (banner+gate), `patients.tsx`,
  `patient/[id].tsx`, `diagnostics.tsx`.
- Patient mode: `(patient)/_layout.tsx`, `view/[id]/accounts.tsx`,
  `view/[id]/account/[accountId].tsx`.
- Handoff system: this `docs/` tree, `scripts/re-anchor.{sh,ps1}`, `memory/`,
  `CLAUDE.md`, `README.md`.

## In progress

- Nothing mid-edit.

## Verified this session

- `npm install` succeeded; `npx expo install --fix` aligned versions to SDK 52
  (async-storage 1.23.1, react-native 0.76.9); added `expo-asset` (required by
  the Metro config).
- `npm run typecheck` passes clean (exit 0).
- `npx expo export --platform ios` bundles the full route graph (969 modules,
  exit 0) — all imports and routes resolve.

## Not started

- First real run against the live Supabase project (needs `.env.local` filled
  from the web app's keys, then `npm start` + sign in + Diagnostics).
- EAS build/submit pipeline (out of scope for M1).
- Custom app icon/splash in `assets/` (Expo defaults for now).

## Decisions made this session

- **Expo + React Native** for "native mobile", to reuse the TS + Supabase stack
  and get on-device testing via Expo Go (see ADR 0001).
- **Both surfaces in one app**, patient view entered from caregiver mode — no
  separate patient login, mirroring the web `getPatientForCaregiver` model.
- **Read-first mobile**; balance-affecting writes stay in the web app to avoid
  duplicating business logic (see ADR 0001 / CLAUDE.md).
- **AsyncStorage** (not SecureStore) for session persistence — Supabase's
  official RN guidance, and avoids the SecureStore value-size limit.
- **Publishable key only**; no secret key in the bundle.

## Known issues / TODOs

- Dependency versions in `package.json` are pinned to reasonable SDK 52 ranges
  but were not resolver-verified in this session. If `npm install` complains,
  run `npx expo install --fix`.
- No automated tests yet; M1 verification is manual + typecheck.
- `assets/` is empty — no custom icon/splash yet (Expo uses defaults).

## Exact next step

On a machine with the toolchain: `cd clearview-savings-mobile && npm install &&
npm run typecheck`. Fix any version mismatches with `npx expo install --fix`.
Then copy `.env.example` to `.env.local`, fill the two `EXPO_PUBLIC_*` values
from the web app, run `npm start`, sign in as a caregiver, and open the
Diagnostics screen to confirm the shared backend is reachable.
