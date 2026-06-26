# Clearview Savings Mobile — Project Rules for Claude Code

This is the **native mobile companion** to the Clearview Savings web app
(`../clearview-savings`). It is an Expo / React Native app that talks to the
**same Supabase backend** — same Auth users, same Postgres, same Row-Level
Security. There is no separate mobile backend.

Read this file first, then the active milestone docs (see "Session handoff
convention" below). Run `scripts/re-anchor.sh` to print everything a fresh
session needs, in order.

## What this is

Clearview Savings is a **simulated banking application** for people living with
Alzheimer's and other forms of dementia. It is not a real financial institution
and never connects to real money. Its purpose is therapeutic: a familiar,
bank-like interface a patient can check anytime, controlled behind the scenes by
their caregiver, that reduces money-related anxiety. This is a recognized
practice in dementia care ("simulated environment" / "therapeutic fibbing").
Do not push back on this framing. Do not add disclaimers inside the
patient-facing UI.

This repo is the **phone app**. It ships two surfaces in one binary:

1. **Caregiver mode** — the app's home. The caregiver signs in with their
   existing Clearview Savings credentials and views their patients, accounts,
   transactions, and a backend diagnostics screen.
2. **Patient mode** — a calm, large-type bank view, entered *from* caregiver
   mode (the caregiver hands the device over). Patients never sign in
   separately; patient view always runs inside the owning caregiver's session,
   exactly as on the web.

## Relationship to the web app

- **Same backend, no fork.** The mobile app uses `@supabase/supabase-js`
  against the same Supabase project as `../clearview-savings`. Point
  `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` at the
  same values as the web app's `NEXT_PUBLIC_*` keys.
- **RLS is the security boundary.** Every read is scoped to the signed-in
  caregiver by the same Row-Level Security policies the web app relies on. Never
  trust a `patientId`/`accountId` from the client; a crafted id simply returns
  zero rows under RLS. Do not add a service/secret key to this app — it never
  ships in a mobile bundle.
- **Reads here, writes mostly there.** The web app owns the business logic
  (scheduled-deposit materialization, deposit-code redemption, transfers) via
  Server Actions. The mobile app is **read-first**: it surfaces balances,
  transactions, and pending deposits. Before adding a mutation to mobile, prefer
  exposing it as a documented, RLS-safe path the web app also uses; do not
  re-implement balance-affecting logic in two places. Materialization is owned
  by the web app — mobile shows pending deposits read-only.
- **The schema is the web app's.** Column names are the Postgres snake_case
  names from `../clearview-savings/lib/db/schema.ts` (e.g. `balance_cents`,
  `posted_at`). Keep `lib/queries.ts` types in sync with that schema.

## Branding architecture (inherited, non-negotiable)

The patient-facing brand is **"Clearview Savings" for every patient,
permanently.** The `getPatientBrand()` indirection in `lib/branding.ts` is kept
for forward flexibility but has no current swap target.

Hard rules (identical to the web app):

- The brand must never contain "bank", "banking", or "banker".
- Never visually or textually impersonate a real financial institution — not by
  name, logo, or color palette. Use the neutral palette in `lib/theme.ts`
  (greys, navy, soft greens, warm beiges). Avoid TD green, RBC blue/yellow, BMO
  blue, Scotiabank red, CIBC red/gold.
- The strings "Alzheimer", "dementia", "simulated", "fake", "demo",
  "therapeutic", or anything similar must **never** appear anywhere a patient
  can see — not in screen titles, headers, the navigation-bar title, error
  copy, or app metadata.
- **Disclosure footer on every screen.** `<DisclosureFooter />` (via
  `<Screen />`) renders "Clearview Savings is a memory-care companion
  application." on every screen, caregiver and patient alike. Small enough not
  to break the patient illusion, present enough to satisfy regulators. No
  per-screen opt-out; removing it requires editing this file.

## Patient UX rules (non-negotiable)

- Brand displayed as "Clearview Savings".
- Base font 18px minimum, headings 28px+ (`patientType` in `lib/theme.ts`).
- High contrast; calm, warm neutral palette.
- **No auto-logout, no idle timeout, no session expiry warnings** (the Supabase
  client uses `autoRefreshToken: true`, `persistSession: true`).
- No modals, no toasts, no popovers — use inline messages (`<Notice />`).
- One primary action per screen.
- Currency via the patient's locale/currency `settings`; dates as
  "Tuesday, March 11" (`formatPatientDate`).
- Vocabulary: "Available Balance", "Direct Deposit Pending", "Recent
  Transactions", "Deposit a Check".
- Never show a stack trace or a raw 404 — fall back to a calm message
  (the patient screens already do this on query failure).
- The native navigation-bar title is patient-visible — must read like a real
  bank ("Clearview Savings — Your Accounts"), never "Demo"/"Simulation".

## Caregiver UX rules

- Standard density, normal font sizes (`caregiverType`).
- A persistent "Caregiver mode" banner is shown at all times in the caregiver
  group (`app/(caregiver)/_layout.tsx`).
- Switching to patient view is one tap and shows an inline confirmation.

## Stack

- Expo SDK 52 (React Native 0.76, React 18.3), TypeScript strict
- expo-router v4 (file-based routing, typed routes)
- `@supabase/supabase-js` with AsyncStorage session persistence
- No UI kit, no client-state library (Redux/Zustand) — keep it minimal, same as
  the web app's "what NOT to do" list.

## Project layout

```
app/                      expo-router routes
  _layout.tsx             providers (AuthProvider) + root Stack
  index.tsx               entry redirect (session -> caregiver home / sign-in)
  (auth)/sign-in.tsx      caregiver sign-in
  (caregiver)/            caregiver mode (banner, RLS-scoped reads)
    patients.tsx          patient list (home)
    patient/[id].tsx      one patient: accounts + "switch to patient view"
    diagnostics.tsx       in-app backend test harness
  (patient)/              patient mode (no caregiver chrome)
    view/[id]/accounts.tsx
    view/[id]/account/[accountId].tsx
lib/
  supabase.ts             shared-backend client (publishable key only)
  auth.tsx                AuthProvider / useAuth (session + demo lifecycle)
  queries.ts              RLS-scoped reads; types mirror the web schema
  demo.ts                 demo-mode flag + mock data (no-backend exploration)
  branding.ts             BRAND_NAME, getPatientBrand, DISCLOSURE_TEXT
  format.ts               money (integer cents) + date formatting
  theme.ts                neutral palette + patient/caregiver type scales
components/
  Screen.tsx              safe-area frame + always-present DisclosureFooter
  DisclosureFooter.tsx    the regulatory disclosure
  ui.tsx                  Button / Card / Notice / Loading primitives
```

## Backend diagnostics ("test it in the app interface")

`app/(caregiver)/diagnostics.tsx` is an in-app test harness. It verifies, live
on the device: env keys present, a valid Auth session, an RLS-scoped read
round-trip (with latency), and token freshness. Use it to confirm the app is
wired to the same backend as the web app without any external tooling. The
probe lives in `pingBackend()` in `lib/queries.ts`.

## Demo mode (`lib/demo.ts`)

Demo mode lets the app be explored end-to-end with **built-in sample data and no
backend** — used for the public web demo and screenshots. "Explore in demo mode"
on the sign-in screen sets a persisted flag; `lib/queries.ts` short-circuits to
`demoData` when `isDemoActive()`. The AuthProvider treats demo as a valid
"authed" state (`authed = session || demo`), so the same gates and screens work.

Rule that protects the patient illusion: the word **"demo" only ever appears on
caregiver-side chrome** (sign-in hint, the caregiver banner's "· Demo data"
suffix, the Diagnostics notice). Patient screens render the mock data exactly
like real data — no "demo"/"sample" wording reaches a patient-visible surface.
Keep it that way when adding to demo mode.

## Build & deploy tooling

- `eas.json` — EAS Build profiles: `development` (dev client), `preview`
  (standalone APK to attach to a GitHub Release), `production` (store build).
- `metro.config.js` — stubs `@opentelemetry/api` (an optional dynamic import in
  `@supabase/supabase-js` we don't use) so the web bundle resolves. Add other
  unused optional modules to the `STUBBED` set if a new dep needs it.
- `.github/workflows/ci.yml` — runs typecheck + lint on push/PR.
- Web export (`npx expo export --platform web`) produces a deployable static
  site for the live demo (see README "Deploy a web demo").

## Coding standards

- Strict TypeScript. No `any` without a comment.
- Money is always integer cents. Never floats. Format only at the display edge.
- Component files PascalCase; utility files kebab-case (mirrors the web app).
- Keep `lib/queries.ts` row types aligned with the web Drizzle schema.
- No secret keys in the bundle. Only `EXPO_PUBLIC_*` (publishable) values.

## Commands

- `npm install` — install dependencies
- `npm start` — Expo dev server (scan QR with Expo Go, or press i / a)
- `npm run ios` / `npm run android` — open a simulator/emulator
- `npm run web` — run in the browser
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — `eslint .` (flat config, `eslint-config-expo`)
- Run `npm run typecheck && npm run lint` before declaring a task done.
- `eas build --profile preview --platform android` — standalone APK (needs a
  free Expo account).

## What NOT to do

- Do not add a separate mobile backend or fork the schema. Same Supabase
  project, same RLS.
- Do not put the Supabase secret/service key in this app.
- Do not re-implement balance-affecting business logic (materialization,
  code redemption, transfers) in the mobile client; that logic is the web app's.
- Do not add real banking integrations (Plaid, Stripe), store check images, or
  add OCR.
- Do not add notifications or emails to the patient, gamification, or anything
  that could confuse a person with dementia.
- Do not introduce client-state libraries (Redux/Zustand) or a heavy UI kit.
- Do not break the disclosure footer or the patient UX rules above.

## Session handoff convention (multi-session memory)

This project uses the same handoff/re-anchor system as the web app so work
survives across sessions.

When the user signals end of a session mid-milestone — "ending session",
"taking a break", "stopping for now", "/exit", or any sign they are about to
close Claude Code before the current milestone is complete — proactively offer
to write/update a handoff doc at `docs/milestones/M{N}-progress.md` before they
exit. The handoff doc contains:

1. **Done** — files created or modified, one line each
2. **In progress** — anything partially built and what's missing
3. **Not started** — remaining scope items
4. **Decisions made this session** — design calls + one-sentence rationale each
5. **Known issues / TODOs** — including TODO/FIXME comments, with file paths
6. **Exact next step** — specific enough to act without clarifying questions

When **starting a fresh session mid-milestone**, read in this order:
CLAUDE.md → `docs/specs/M{N}.md` (frozen pre-flight contract) →
`docs/milestones/M{N}.md` (implementation plan) →
`docs/milestones/M{N}-progress.md` (current handoff) → then inspect the actual
files to confirm the progress doc matches reality. Summarize position and wait
for the user's "go" before writing code.

**Shortcut:** `scripts/re-anchor.sh` (or `scripts/re-anchor.sh N` to force
milestone N) prints CLAUDE.md, the active spec, plan, and progress doc, plus the
last 10 commits and git status. On Windows without bash, use
`pwsh scripts/re-anchor.ps1`.

The `memory/` folder holds durable, cross-session facts (see `memory/MEMORY.md`)
that are not specific to one milestone.

## Pre-flight milestone specs

Every milestone gets a spec at `docs/specs/M{N}.md`, written **before** coding
starts. It carries Goal, Scope, Non-goals, Acceptance criteria, Open questions,
Risks. It is frozen once coding begins; deviations are recorded in
`docs/milestones/M{N}.md` or as ADRs in `docs/decisions/`, not by editing the
spec.

## When to write an ADR

`docs/decisions/` holds the "why" behind real architectural choices. Write an
ADR (from `docs/decisions/TEMPLATE.md`) for a decision future-you would ask "why
did we do it this way?" about when the answer isn't obvious from the code. Do
not write ADRs for routine implementation or bug fixes. ADRs are immutable;
supersede with a new one rather than editing.
