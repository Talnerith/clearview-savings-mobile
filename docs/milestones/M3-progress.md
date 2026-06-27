# M3 — Progress / Handoff

> Read CLAUDE.md → docs/specs/M3.md → docs/milestones/M3.md → this file, then
> inspect the files. Last updated: 2026-06-27.
> Quick re-anchor: `pwsh scripts/re-anchor.ps1`.

## Where things stand (one line)

M3 is **code-complete across all 3 phases, statically verified, and merged to
`master` on both repos.** Remaining: **one DB grant to apply** (audit_log), then
an on-device APK rebuild + smoke test (the user batches changes and builds at
the end).

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

## REMAINING — must do before the audit log works

**Apply the audit_log grant** to the shared Supabase DB (the screen reads it via
PostgREST; without the grant it shows "permission denied"). In the Supabase SQL
editor run:
```sql
grant select on public.audit_log to authenticated;
```
(Already captured in `clearview-savings/supabase/policies.sql`.) RLS
(`audit_log_owner`) scopes rows to the caregiver's own actions.

## REMAINING — verification

On-device APK rebuild (`eas build --platform android --profile preview`) +
smoke-test the M3 features. Real-write testing in a browser/Pixel-8 view is
fastest on **localhost** (`npm run web`) since Turnstile + API CORS already allow
localhost; the Vercel mobile URL would need its origin added to Turnstile + to
`MOBILE_ALLOWED_ORIGINS` + the mobile Vercel env.

## M4 candidates (not in M3)

Re-add a read-only checks/workbooks list if wanted; a global loading/transition
indicator; native date picker for scheduled deposits (currently a YYYY-MM-DD
text field).
