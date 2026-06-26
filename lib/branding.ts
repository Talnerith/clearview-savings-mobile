// Branding indirection, mirrored from the web app's lib/branding.ts.
//
// The patient-facing brand is "Clearview Savings" for every patient,
// permanently. The getPatientBrand() indirection is preserved for forward
// flexibility (a possible future white-label) but has no current swap target.
// Assume it returns "Clearview Savings" for every patient.
//
// Hard rules (see CLAUDE.md): the brand must never contain "bank", "banking",
// or "banker", and must never impersonate a real financial institution.

export const BRAND_NAME = "Clearview Savings";

export function getPatientBrand(_patient?: { id: string }): string {
  return BRAND_NAME;
}

// The regulatory disclosure string. Carried onto every screen via
// <DisclosureFooter />. Small enough not to break the therapeutic illusion for
// a patient, present enough to satisfy regulators. Wording matches the web app.
export const DISCLOSURE_TEXT =
  "Clearview Savings is a memory-care companion application.";
