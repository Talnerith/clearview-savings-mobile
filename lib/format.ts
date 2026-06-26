// Money is always integer cents (mirrors the web app). Never floats. These
// helpers format for display only.

export type PatientSettings = {
  font_size?: "md" | "lg" | "xl";
  locale?: string;
  currency?: string;
};

const DEFAULT_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";

export function formatMoney(
  amountCents: number,
  settings?: PatientSettings,
): string {
  const locale = settings?.locale ?? DEFAULT_LOCALE;
  const currency = settings?.currency ?? DEFAULT_CURRENCY;
  // Intl is available in the Hermes engine used by React Native.
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

// Patient-facing long date, e.g. "Tuesday, March 11". No year — keeps it calm
// and familiar, matching the web app's patient vocabulary rules.
export function formatPatientDate(
  iso: string,
  settings?: PatientSettings,
): string {
  const locale = settings?.locale ?? DEFAULT_LOCALE;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

// Caregiver-facing compact date with year, e.g. "Mar 11, 2026".
export function formatCaregiverDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}
