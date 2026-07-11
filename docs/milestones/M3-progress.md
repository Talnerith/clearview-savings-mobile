# M3 — Progress / Handoff

> Read CLAUDE.md → docs/specs/M3.md → docs/milestones/M3.md → this file, then
> inspect the files. Last updated: 2026-06-29.
> Quick re-anchor: `pwsh scripts/re-anchor.ps1`.

## Where things stand (one line)

M3 is **CLOSED (2026-06-29)** — all 3 phases shipped on both repos, the
`audit_log` grant is applied to production, and the features were smoke-tested
live (localhost web against the production backend). A small **post-M3 follow-up**
(delete-patient + UX fixes) also shipped this session — see the section at the
bottom.

## Done — Phase 1 (caregiver writes)

Web: 7 JWT-authed endpoints under `app/api/m/*` (add patient, add/rename
account, scheduled deposits add/pause/delete, patient settings), each reusing a
helper extracted from the Server Action (web actions are thin callers; 340 tests
green incl. 11 new). Mobile: `lib/api.ts` methods + `listScheduledDeposits`; a
shared `useWrite` hook (demo guard); Add-a-patient on the dashboard; patient
detail gains AccountManager (inline transactions + rename), ScheduledDeposits
(list/add/pause/delete), PatientSettingsForm; Add-savings-account is a caregiver
action. Verified in demo on web.

## Done — Phase 2 (caregiver shell + audit log)

- Persistent **top bar** (Settings + Sign out) on every caregiver screen,
  rendered in `(caregiver)/_layout.tsx` ABOVE the native stack (header
  Pressables don't fire on native). Footer Sign out removed.
- **Settings** screen (`app/(caregiver)/settings.tsx`): email, sign out, link to
  manage 2FA on the web (MFA management stays web-only).
- **Audit log** screen (`app/(caregiver)/audit/[id].tsx`) read via PostgREST +
  `View audit log` on the patient detail. Footer **legal links** (LegalLinks).

## Done — Phase 3 (denser patient home + polish)

- Patient `view/[id]/accounts.tsx` redesigned: time-of-day greeting + date,
  pending notice, account cards, Deposit a Check, calm Security Reminder — within
  the patient UX rules. Per-screen loading spinners cover transitions.

## Decisions (don't relitigate)

- **MFA management stays on web** (mobile Settings links there).
- **Check/workbook generation stays web-only** (the artifact must be printed);
  the mobile codes-list was dropped too. Patients still redeem codes via the
  mobile Deposit-a-Check flow.
- Add-savings-account is a caregiver action, not inline in the accounts section
  (new patients have just Checking).

## DONE — close-out (2026-06-29)

- **audit_log grant applied** to the shared Supabase DB
  (`grant select on public.audit_log to authenticated;`, captured in
  `clearview-savings/supabase/policies.sql`). Audit-log screen now reads under
  RLS (`audit_log_owner`).
- **Smoke-tested live** on localhost web (`npm run web`) against the production
  backend (Turnstile + API CORS already allow localhost). All M3 features
  verified working.

## Post-M3 follow-up (2026-06-29 session)

Ad-hoc bug-fix + small-feature pass on top of M3 (no separate spec — routine
fixes + one feature following the existing M2/M3 shared-endpoint pattern).
Shipped and smoke-tested live across both repos:

**Delete a patient** (new caregiver action, cross-repo):
- Web: `lib/patients/delete-patient.ts` (ownership-scoped helper, audits
  `patient_deleted`, cascade removes accounts/transactions/scheduled
  deposits/codes) + co-located pg-mem test; `POST /api/m/patients/delete`
  (`requireApiPatient`); thin `deletePatientAction`; red "Delete patient" button
  (`ConfirmingForm`) on the patient detail header; "Patient deleted." dashboard
  status. New `audit_action_kind` enum value `patient_deleted`
  (migration `drizzle/0006_worried_scorpion.sql`) — **applied to production**.
- Mobile: `api.deletePatient`, inline-confirm Delete button on patient detail,
  new `destructive` Button variant.

**UX fixes (mobile):**
- Inline account transactions refetch after a write (`refreshKey`) — no longer
  stale until remount.
- MFA code field `autoFocus` on the challenge screen (web challenge + Security
  section inputs too).
- Scheduled-deposit pending-days label reworded to a plain question (no "notify"
  wording — the app sends no notifications).

**Navigation/state fixes (mobile, found in smoke test):** delete now pops back to
the existing patients screen (no duplicated screen / phantom back button); the
patients list reloads on focus (`useFocusEffect`) so a deleted patient doesn't
linger; a missing patient (`getPatient` → null) shows a calm message instead of
an endless spinner.

**Repo professionalization (both repos):** source-available LICENSE
(all-rights-reserved, no redistribution) replacing the web MIT file; README
license sections aligned; mobile GitHub topics added. Security re-audited —
no secret in tree or history.

Commits — mobile: `a8875d5`, `6890b3a`, `3173ac3`; web: `61026c1`, `eea9bd3`.

## Release: v0.3.0 APK (2026-06-30 session)

Published the most-recent Android build for on-device testing. Bumped
`app.json` 0.1.0 → 0.3.0 (commit `cc97a4f`), ran `eas build -p android
--profile preview` (EAS build `7e52a960`, reused the v0.1.0 keystore), and cut
GitHub release **v0.3.0** with `clearview-savings-0.3.0.apk` (79 MB) attached —
now the "latest" release the README links to. Android-only; iPhone users use the
web demo (native iOS needs an Apple Developer account + TestFlight). Deployment
facts updated in `memory/deployment.md`.

## Post-M3 follow-up (2026-07-06 session) — abuse hardening, cross-repo

Prompted by a "could scammers abuse this?" question on the web repo. The web app
owns the full anti-abuse treatment (web **ADR 0008**: no money-in path ever,
disclosure on every artifact incl. printed checks/workbooks, a `patient-threshold`
ops alert, a caregiver attestation at sign-up, a report-misuse affordance). This
session mapped that posture onto mobile:

- **Report misuse — ported.** `components/LegalLinks.tsx` gains a "Report misuse"
  `mailto:support@clearviewsavings.com` link beside About/Privacy/Terms/Security.
- **Volume monitoring — not duplicated.** Mobile creates patients via the web
  endpoint `POST /api/m/patients` (`lib/api.ts` → `api.addPatient`), which now
  runs the shared `addPatient` core that fires the threshold alert. Nothing to
  add on-device.
- **Attestation — not applicable.** Mobile is **sign-in only** (the only
  "no account" path is demo mode); caregivers register and attest on the web.
  **If a mobile sign-up is ever added, it must carry the same attestation.**
- **Printed-artifact disclosure — not applicable.** Checks/workbooks are
  web-rendered; mobile generates no PDFs.

Recorded as mobile **ADR 0003** (`docs/decisions/0003-abuse-threat-model.md`) so
the "why nothing here" is durable and a future session doesn't drop a control by
moving code onto the device. typecheck + lint green. Commit `d38aef1`, pushed
(web-demo Vercel deploy). Web-side detail: `../clearview-savings/docs/milestones/M9-progress.md`
"Post-M9 addendum (2026-07-06)".

No new APK cut — the single legal-footer link doesn't warrant a standalone
release; fold it into the next mobile feature release (would need an `app.json`
bump + `eas build`, per the v0.3.0 process above).

### Follow-up (2026-07-11): v0.3.1 APK cut anyway

Per user request ("I like everything updated"), cut a refresh release rather
than waiting. Bumped `app.json` 0.3.0 → 0.3.1 and added `autoIncrement: true`
to the `preview` profile so the Android `versionCode` increments (1 → 2) and
the APK installs cleanly over v0.3.0. typecheck + lint green. Commit `ae340d2`,
pushed. EAS build `205abe43` (FINISHED). Release:
https://github.com/Talnerith/clearview-savings-mobile/releases/tag/v0.3.1 —
contents = the report-misuse legal-footer link (`d38aef1`). No OTA: `expo-updates`
is still not installed; distribution stays rebuild-the-APK-and-release (see
[[deployment]]).

## M4 candidates (not started)

Re-add a read-only checks/workbooks list if wanted; a global loading/transition
indicator; native date picker for scheduled deposits (currently a YYYY-MM-DD
text field).
