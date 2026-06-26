# ADR 0002 — Demo mode + distribution strategy (web demo, EAS APK)

> Status: **accepted** · 2026-06-26

## Context

The repo needs to be **publicly viewable as a working native app** (it backs a
job application). Two realities shaped the approach:

1. Expo Go is a development runtime, not a deliverable; a reviewer can't be
   handed "Expo Go + our JS" as the app. The distributable artifacts are a
   **preview/production build** (standalone APK/IPA) and/or a **deployed web
   build**. (Expo itself is a professional, production-grade stack — the
   Expo-Go-isn't-shippable point is about the artifact, not the framework.)
2. A live web demo is only useful if a reviewer can get *past* the sign-in
   screen. With the app gated on Supabase auth, a deployed build would be a dead
   login wall without credentials.

## Decision

- **Add an explicit demo mode** (`lib/demo.ts`): a persisted flag that makes the
  read layer return built-in sample data, with the AuthProvider treating demo as
  a valid "authed" state. This powers the public web demo and screenshots with
  zero backend setup. Constraint: the string "demo" appears only on
  caregiver-side chrome, never on a patient-visible surface, so the patient
  illusion and branding rules are preserved.
- **Distribute two ways:** (a) a **static web export** deployed to a free host
  for a clickable URL; (b) a **standalone Android APK** via EAS Build's
  `preview` profile, attached to a GitHub Release. iOS standalone distribution
  is deferred (needs a paid Apple Developer account) — not worth it for this
  milestone.
- **Add CI** (`.github/workflows/ci.yml`: typecheck + lint) and ship `eas.json`
  + `expo-dev-client` so the professional build pipeline is visible in the repo
  even before a build is run.

## Consequences

- **Easier:** anyone can explore the app instantly (demo mode + web URL); the
  repo demonstrates real deploy-pipeline awareness; CI gives reviewers a green
  signal.
- **Committed to:** demo mock data in `lib/demo.ts` must be kept in step with the
  query row types; every new screen must respect the "no 'demo' wording on
  patient surfaces" rule. The `metro.config.js` stub for `@opentelemetry/api`
  must persist while `@supabase/supabase-js` keeps that optional tracing import.
- iOS users can't install a prebuilt app until an Apple Developer account is
  added; the web demo covers cross-platform viewing in the meantime.
