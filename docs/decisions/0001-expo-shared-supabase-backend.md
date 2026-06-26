# ADR 0001 — Expo/React Native on the shared Supabase backend, read-first

> Status: **accepted** · 2026-06-26

## Context

We need a *native* mobile app for Clearview Savings that uses the **same
backend** as the web app (`../clearview-savings`: Next.js + Supabase + Drizzle,
mutations via Server Actions). Three questions had to be settled before any code:

1. **Framework.** Native Swift + Kotlin (two codebases, no reuse), Flutter (new
   language/toolchain), or Expo/React Native (one TypeScript codebase that
   reuses the existing Supabase/TS competency).
2. **How "same backend" is achieved.** The web app exposes business logic as
   Server Actions, not a REST API. Options: stand up a REST/BFF layer, or have
   the mobile app talk to Supabase directly via `supabase-js` under the same
   Row-Level Security.
3. **Which surfaces ship**, and how a patient is authenticated.

## Decision

1. **Expo + React Native + TypeScript** (expo-router). It produces genuinely
   native iOS/Android binaries, reuses the team's TS + Supabase knowledge, and
   Expo Go gives instant on-device testing — which also satisfies the "interact
   and test it in the app interface" requirement (plus an in-app Diagnostics
   screen).
2. **Talk to Supabase directly via `supabase-js`, under the same RLS.** No new
   backend, no fork of the schema. The same Row-Level Security policies that
   protect the web app scope every mobile read. The app uses only the
   publishable (anon-tier) key; the secret/service key never ships in a mobile
   bundle.
3. **Both surfaces in one binary, read-first.** Caregiver mode is the home;
   patient view is entered from it inside the caregiver's session (mirrors the
   web `getPatientForCaregiver` model — no separate patient login). Mobile is
   read-first: it surfaces balances, transactions, and pending deposits, but
   does **not** re-implement balance-affecting business logic (scheduled-deposit
   materialization, deposit-code redemption, transfers). That logic stays in the
   web app to avoid two sources of truth.

## Consequences

- **Easier:** one codebase; immediate testing; security inherited from existing
  RLS rather than re-authored; no BFF to maintain.
- **Harder / committed to:** `lib/queries.ts` row types must be kept in sync
  with the web Drizzle schema (no shared package yet). Any future mobile write
  that affects balances needs a deliberate, RLS-safe path shared with the web
  app — not a quietly duplicated implementation; such a change gets its own spec
  and likely a superseding ADR.
- Materialization being web-owned means mobile shows pending deposits as
  read-only and may briefly lag the web until the next web-side load
  materializes them. Accepted for M1.
