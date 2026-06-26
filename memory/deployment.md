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
- **APK release:** https://github.com/Talnerith/clearview-savings-mobile/releases/tag/v0.1.0
  — replace the asset with `gh release upload v0.1.0 <apk> --clobber`.

**Why:** this is a portfolio repo for a junior-dev application — the live demo +
public release + green CI are the "publicly viewable working app" proof. Keep
them working and in sync.

**How to apply:** after a push, the web demo updates automatically (~1 min); the
APK does **not** — rebuild + re-upload to refresh it. See the M1 handoff
(`docs/milestones/M1-progress.md`) for the exact rebuild/screenshot steps, and
[[shared-backend]] / [[re-anchor-workflow]].
