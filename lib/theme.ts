// Palette synced to the web app's design tokens (clearview-savings
// app/globals.css). The web app's brand primary is Tailwind **emerald-700** —
// "the same deep-emerald identity the patient bands use", per that file — on a
// near-white neutral surface. Mirroring it here makes the mobile app read as the
// same product, not a different one. Still satisfies CLAUDE.md (soft greens +
// neutrals; no real-bank palette).
//
// Hex values are the Tailwind v4 fallbacks for the oklch tokens the web uses:
//   emerald-700 #047857, emerald-800 #065f46, emerald-900 #064e3b,
//   emerald-50 #ecfdf5, neutral-950 #0a0a0a, neutral-500 #737373,
//   neutral-200 #e5e5e5, neutral-100 #f5f5f5, red-600 #dc2626.

export const colors = {
  // Surfaces — light neutral page, white cards (so cards lift off the page).
  background: "#f5f5f5",
  surface: "#ffffff",
  surfaceMuted: "#f5f5f5",

  // Text
  text: "#0a0a0a", // foreground (neutral-950)
  textMuted: "#737373", // muted-foreground (neutral-500)
  textInverse: "#fafafa", // primary-foreground (neutral-50)

  // Brand / primary action — emerald-700, matching the web app.
  primary: "#047857",
  primaryPressed: "#065f46", // emerald-800, for the pressed state

  // Secondary (filled) button — neutral-100 / dark text, like web `secondary`.
  secondary: "#f5f5f5",
  secondaryPressed: "#e5e5e5",

  // Positive / money-in — same emerald family.
  positive: "#047857",
  positiveSoft: "#ecfdf5", // emerald-50 band

  // Lines & borders
  border: "#e5e5e5", // neutral-200

  // Destructive (diagnostics FAIL badge, errors) — red-600.
  destructive: "#dc2626",

  // Caregiver-mode banner — deep emerald, clearly "admin" but on-brand.
  caregiverBanner: "#064e3b", // emerald-900

  // Calm, non-alarming notice (warm amber, never harsh red on patient surfaces)
  notice: "#8a6d3b",
  noticeSoft: "#f5ecd9",
} as const;

// Patient surfaces must meet the strict UX rules: base font 18px minimum,
// headings 28px+, generous spacing. Caregiver surfaces use standard density.
export const patientType = {
  body: 19,
  bodyLarge: 22,
  heading: 30,
  display: 40, // the balance figure
  lineHeight: 1.4,
} as const;

export const caregiverType = {
  body: 16,
  bodyLarge: 18,
  heading: 22,
  small: 13,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Matches the web app's --radius (0.625rem = 10px) and its derived steps.
export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14, // shadcn Card radius
} as const;
