# ADR 0003 — Abuse threat model (mobile surface)

> Status: **accepted** · 2026-07-06
> ADRs are immutable. To change a decision, write a new ADR that supersedes this.

## Context

Clearview Savings is deliberately built to make a person believe a bank-like
interface is really their bank — the therapeutic mechanism. Inverted, that is
also the primitive a fraudster wants: the "caregiver" becomes the scammer, the
"patient" the victim, and the fake balance the hook for advance-fee, fake-
investment, or romance scams.

The web app owns the full anti-abuse treatment (web ADR 0008
`../clearview-savings/docs/decisions/0008-abuse-threat-model.md`): no money-in
path ever; the disclosure string on every artifact including printed checks and
workbooks; a `patient-threshold` ops alert when one caregiver amasses too many
patients; a caregiver attestation at sign-up; and a "report misuse" affordance.

This ADR records how that posture maps onto the mobile app, which shares the web
backend and is read-first (see ADR 0001, and CLAUDE.md "Relationship to the web
app"). The point is to stop a future session from either duplicating a control
that already runs server-side, or adding a surface (e.g. a mobile sign-up)
without the control that must accompany it.

## Decision

The mobile app carries the parts of the posture that have a mobile surface, and
deliberately does **not** re-implement the parts that live server-side:

- **Report misuse — ported.** `components/LegalLinks.tsx` gains a "Report
  misuse" link (a `mailto:support@clearviewsavings.com`) beside About / Privacy
  / Terms / Security, mirroring the web `/about` report-a-concern section.
- **Volume monitoring — not duplicated.** Mobile creates patients by calling the
  web endpoint `POST /api/m/patients` (`lib/api.ts` → `api.addPatient`), which
  runs the shared `addPatient` core that already fires the `patient-threshold`
  alert. Adding client-side counting would be redundant and easily bypassed.
- **Caregiver attestation — not applicable.** Mobile has **sign-in only**; there
  is no sign-up here (the only "no account" path is demo mode). Caregivers
  register — and attest — on the web. **If a mobile sign-up is ever added, it
  must carry the same attestation the web sign-up does.**
- **No money-in path — inherited and reinforced.** Mobile is read-first and adds
  no payment/card/fee/crypto surface. This is already a `What NOT to do` rule in
  CLAUDE.md; it is also an anti-abuse rule.
- **Printed-artifact disclosure — not applicable.** Checks and workbooks are
  rendered by the web app; mobile does not generate PDFs.
- **Disclosure footer — already universal.** `<DisclosureFooter />` (via
  `<Screen />`) already prints the disclosure on every screen.

## Consequences

- The mobile client stays thin: no client-side abuse heuristics to maintain, no
  divergence from the server's single source of truth for the threshold.
- A caregiver on mobile has a direct, obvious way to report a suspected misuse.
- There is a standing obligation: any future mobile sign-up, or any future
  mobile-only write path that creates patients without going through
  `/api/m/patients`, must be checked against this ADR — the attestation and the
  threshold alert must not be lost by moving the code onto the device.
