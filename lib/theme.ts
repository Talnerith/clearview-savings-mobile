// Neutral palette per CLAUDE.md branding rules: greys, navy, soft greens, warm
// beiges. Deliberately avoids palettes associated with real banks (TD green,
// RBC blue/yellow, BMO blue, Scotiabank red, CIBC red/gold). The app must look
// trustworthy and bank-like without impersonating any real institution.

export const colors = {
  // Surfaces
  background: "#f7f5f1", // warm beige-grey, calm
  surface: "#ffffff",
  surfaceMuted: "#efece6",

  // Text
  text: "#1f2a37", // near-navy ink
  textMuted: "#5b6675",
  textInverse: "#ffffff",

  // Brand / primary action — soft navy, not a real-bank blue
  primary: "#26415e",
  primaryPressed: "#1c3148",

  // Positive / money-in — soft green
  positive: "#3f7d5b",
  positiveSoft: "#e6f0ea",

  // Lines & borders
  border: "#ddd8cf",

  // Caregiver-mode accent banner (clearly "admin")
  caregiverBanner: "#2d3b4d",

  // Calm, non-alarming notice (no harsh red for patient surfaces)
  notice: "#8a6d3b",
  noticeSoft: "#f3ecdd",
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

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;
