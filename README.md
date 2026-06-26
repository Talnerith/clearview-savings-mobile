# Clearview Savings — Mobile

<!-- Replace OWNER/REPO with your GitHub path once pushed to enable the badge. -->
<!-- [![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml) -->

Native mobile companion (iOS + Android) for
[Clearview Savings](../clearview-savings), built with Expo / React Native and
TypeScript. It runs against the **same Supabase backend** as the web app — same
Auth users, same Postgres, same Row-Level Security. There is no separate mobile
backend.

> Clearview Savings is a memory-care companion application — a simulated banking
> interface used in dementia care. It is not a real financial institution and
> never handles real money. See [`CLAUDE.md`](./CLAUDE.md) for the full product
> context and the rules this app must follow.

## Try it

- **Demo mode (no setup):** run the app and tap **"Explore in demo mode"** on
  the sign-in screen — the whole app is explorable with built-in sample data, no
  account or backend required.
- **Live web demo:** _(add your deployed URL here — see [Deploy a web
  demo](#deploy-a-web-demo))_.
- **Android APK:** _(attach a build to a GitHub Release — see [Build an
  installable app](#build-an-installable-app-eas))_.

## Screenshots

<!-- Add screenshots / a screen-recording GIF here. Capture from demo mode so no
real data is shown. Suggested set: sign-in, patient list, patient detail,
patient bank view, account detail, diagnostics. -->

| Caregiver — patients | Patient — accounts | Diagnostics |
| --- | --- | --- |
| _add screenshot_ | _add screenshot_ | _add screenshot_ |

## Two surfaces in one app

- **Caregiver mode** (home): sign in with your existing Clearview Savings
  credentials, view your patients, their accounts and balances, and a built-in
  backend diagnostics screen.
- **Patient mode**: a calm, large-type bank view (Available Balance, Direct
  Deposit Pending, Recent Transactions), entered *from* caregiver mode. Patients
  never sign in separately.

## Getting started

```bash
npm install

# Point the app at the SAME Supabase project as the web app:
cp .env.example .env.local
#   EXPO_PUBLIC_SUPABASE_URL              = web app's NEXT_PUBLIC_SUPABASE_URL
#   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY  = web app's NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

npm start          # Expo dev server — scan the QR with Expo Go, or:
npm run ios        # iOS simulator (macOS)
npm run android    # Android emulator
```

If `npm install` reports version mismatches, run `npx expo install --fix`.

## Testing the backend connection in-app

Sign in, then open **Diagnostics** (link on the patient list). It runs live
checks on the device — env keys present, valid Auth session, an RLS-scoped read
round-trip with latency, and token freshness — so you can confirm the app is
wired to the same backend as the web app without any external tooling.

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm start`         | Expo dev server                       |
| `npm run ios`       | Open iOS simulator                    |
| `npm run android`   | Open Android emulator                 |
| `npm run web`       | Run in the browser                    |
| `npm run typecheck` | `tsc --noEmit`                        |
| `npm run lint`      | `eslint .`                            |

CI (`.github/workflows/ci.yml`) runs typecheck + lint on every push and PR.

## Deploy a web demo

Expo Router exports to a static site, so you can give reviewers a clickable URL.

```bash
npx expo export --platform web --output-dir dist
```

Deploy `dist/` to any static host. Easiest is Vercel or Netlify (they handle the
single-page-app fallback automatically):

```bash
npx vercel deploy dist --prod        # or: npx netlify deploy --dir dist --prod
```

The deployed demo opens on the sign-in screen; **"Explore in demo mode"** then
walks the full app on sample data — no backend needed. (To demo against the live
backend instead, set `EXPO_PUBLIC_SUPABASE_*` at build time.)

## Build an installable app (EAS)

To produce a real, installable native binary you can attach to a GitHub Release:

```bash
npm i -g eas-cli
eas login                            # free Expo account
eas build --platform android --profile preview
```

The `preview` profile (see `eas.json`) outputs a standalone **APK**. Download it
from the EAS build page and attach it to a GitHub Release so anyone can install
it on an Android device. iOS distribution additionally requires an Apple
Developer account ($99/yr) + TestFlight; `eas build --platform ios` builds it
once that's set up.

For day-to-day development with custom native modules, build a **development
client** instead: `eas build --profile development`, then `npm start`.

## Multi-session workflow

This project carries the same handoff/re-anchor system as the web app:

- `CLAUDE.md` — project rules (read first).
- `docs/specs/M{N}.md` — frozen pre-flight spec per milestone.
- `docs/milestones/M{N}.md` — implementation plan.
- `docs/milestones/M{N}-progress.md` — current handoff (entry point for the
  next session).
- `docs/decisions/` — ADRs for non-obvious architectural choices.
- `memory/` — durable cross-session facts.
- `scripts/re-anchor.sh` (or `pwsh scripts/re-anchor.ps1`) — prints all of the
  above plus recent git history, in reading order, for a fresh session.

## Project layout

See the "Project layout" section in [`CLAUDE.md`](./CLAUDE.md).
