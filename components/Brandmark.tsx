import { StyleSheet, Text, View } from "react-native";
import { Path, Svg } from "react-native-svg";

import { BRAND_NAME } from "@/lib/branding";
import { colors, space } from "@/lib/theme";

// The Clearview Savings brand mark — the sun + wave artwork from the web app's
// public/branding/clearview-savings-icon.svg, rendered natively with
// react-native-svg so it stays crisp at any size. Only the three artwork paths
// are inlined (the SVG file also contains the wordmark letters, which we draw as
// real text below for accessibility — exactly how the web <Brandmark> does it).
//
// viewBox + path data are copied verbatim from the web icon so the mark is
// pixel-identical to the website's.

type Size = "sm" | "md" | "lg";

// Icon height in px; width follows the mark's natural ~2.2:1 aspect ratio.
const ICON_PX: Record<Size, number> = { sm: 26, md: 38, lg: 52 };
const TEXT_PX: Record<Size, number> = { sm: 18, md: 22, lg: 30 };
const ICON_RATIO = 287 / 130; // viewBox width / height

export function BrandIcon({ height = 38 }: { height?: number }) {
  return (
    <Svg
      width={height * ICON_RATIO}
      height={height}
      viewBox="157 194 287 130"
      accessibilityRole="image"
      accessibilityLabel="Clearview Savings"
    >
      <Path
        fill="#F9B50C"
        d="M304.689 204.635C305.148 204.602 305.607 204.575 306.066 204.554C330.05 203.471 352.82 220.263 358.963 243.102C360.455 248.648 360.659 252.661 360.861 258.31C349.166 258.322 337.552 259.273 326.025 261.178C321.39 261.943 316.833 262.473 312.297 263.832C311.693 263.935 310.084 264.226 309.584 264.101C304.78 262.896 299.743 260.182 295.009 258.808C281.859 254.99 269.818 252.21 256.146 251.361C258.366 225.431 279.339 206.992 304.689 204.635Z"
      />
      <Path
        fill="#19293A"
        d="M229.936 263.458C235.79 263.11 242.167 263.526 247.957 263.869C274.704 265.453 299.988 273.363 323.5 286.078C333.937 291.723 344.291 298.218 354.869 303.744C359.872 306.358 365.283 308.504 370.493 310.675C372.74 311.612 376.313 312.328 378.186 313.729L377.864 313.933C372.882 313.541 368.033 313.411 363.075 312.686C349.126 310.644 335.927 307.377 322.457 303.272C307.935 298.876 293.197 293.494 279.065 289.082C245.247 278.525 210.861 273.836 175.592 277.945C173.447 278.195 169.301 278.903 167.266 278.733L167.054 278.355C168.432 276.855 172.868 275.291 174.932 274.467C192.682 267.381 210.943 264.332 229.936 263.458Z"
      />
      <Path
        fill="#619942"
        d="M356.045 266.788C360.809 266.418 368.778 266.853 373.465 267.098C390.811 268.004 408.56 270.538 425.18 275.686C427.351 276.359 431.876 277.067 433.545 278.323L433.531 279.068L432.946 279.335C424.057 277.403 408.466 277.221 399.101 276.815C377.607 276.518 362.648 278.668 341.545 281.676C334.918 277.707 328.951 274.26 322.111 270.675C334.334 268.484 343.547 267.571 356.045 266.788Z"
      />
    </Svg>
  );
}

// Icon + wordmark, side by side — the app's logo lockup. Mirrors the web
// <Brandmark>. `showText={false}` renders just the mark (e.g. tight headers).
export function Brandmark({
  name = BRAND_NAME,
  size = "md",
  showText = true,
}: {
  name?: string;
  size?: Size;
  showText?: boolean;
}) {
  return (
    <View style={styles.row}>
      <BrandIcon height={ICON_PX[size]} />
      {showText ? (
        <Text style={[styles.text, { fontSize: TEXT_PX[size] }]}>{name}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  text: {
    color: colors.text,
    fontWeight: "700",
    letterSpacing: -0.4, // tracking-tight, like the web wordmark
  },
});
