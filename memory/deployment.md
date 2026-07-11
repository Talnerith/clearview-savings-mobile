---
name: deployment
description: Where this app is published — GitHub, Vercel web demo, EAS project, APK release
metadata:
  type: reference
---

Public deployment targets for Clearview Savings Mobile (all under GitHub user
**Talnerith** / Expo account **talnerith**):

- **GitHub (public):** https://github.com/Talnerith/clearview-savings-mobile —
  CI (typecheck + lint) runs on every push and must stay green.
- **Live web demo:** https://clearview-savings-mobile.vercel.app — Vercel,
  imported from GitHub so it **auto-redeploys on push**. Builds via
  `vercel.json` (`expo export --platform web`). Opens on sign-in; the visitor
  path is "Explore in demo mode" (no backend keys in the public build).
- **EAS project:** `@talnerith/clearview-savings-mobile` (projectId in
  `app.json`). Android `preview` profile → standalone APK. Run builds from a
  real terminal (TTY needed for the keystore prompt).
- **APK release (latest):** https://github.com/Talnerith/clearview-savings-mobile/releases/tag/v0.3.1
  (Android-only; `app.json` version 0.3.1, versionCode 2, signed with the same
  keystore as v0.1.0). The `preview` profile now has `autoIncrement: true`, so
  EAS bumps the Android `versionCode` each build (v0.3.0 was 1 → v0.3.1 is 2) and
  the new APK installs cleanly over the prior install — no uninstall needed.
  README's "latest release" link auto-follows. To cut a new release: bump
  `app.json` version → commit + push → `eas build -p android --profile preview`
  → download the artifact → `gh release create vX.Y.Z <apk> --target master`. To
  refresh an existing release's asset instead: `gh release upload vX.Y.Z <apk> --clobber`.
  Note: EAS prints a harmless "expo-updates not installed" warning because the
  profiles carry a `channel` field but we don't use OTA — safe to ignore.
  No iOS build is published — iPhone users use the web demo (above); a native iOS
  build needs an Apple Developer account ($99/yr) + TestFlight.

**Why:** this is a portfolio repo for a junior-dev application — the live demo +
public release + green CI are the "publicly viewable working app" proof. Keep
them working and in sync.

**How to apply:** after a push, the web demo updates automatically (~1 min); the
APK does **not** — rebuild + re-upload to refresh it. See the M1 handoff
(`docs/milestones/M1-progress.md`) for the exact rebuild/screenshot steps, and
[[shared-backend]] / [[re-anchor-workflow]].
