// Generate the app's brand image assets (launcher icon, Android adaptive icon,
// splash mark, web favicon) from the Clearview Savings sun+wave artwork — the
// same vector mark used in-app (components/Brandmark.tsx) and on the website.
//
// On the navy brand background (#19293A) the mark's own navy wave would
// disappear, so this uses the REVERSED mark: the navy wave is drawn white, with
// the yellow sun and green wave unchanged. Run with: node scripts/generate-brand-assets.mjs
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(here, "..", "assets");

const NAVY = "#19293A";

// Three artwork paths from clearview-savings-icon.svg (viewBox 157 194 287 130).
// The middle wave is recoloured white so it reads on the navy background.
const SUN =
  "M304.689 204.635C305.148 204.602 305.607 204.575 306.066 204.554C330.05 203.471 352.82 220.263 358.963 243.102C360.455 248.648 360.659 252.661 360.861 258.31C349.166 258.322 337.552 259.273 326.025 261.178C321.39 261.943 316.833 262.473 312.297 263.832C311.693 263.935 310.084 264.226 309.584 264.101C304.78 262.896 299.743 260.182 295.009 258.808C281.859 254.99 269.818 252.21 256.146 251.361C258.366 225.431 279.339 206.992 304.689 204.635Z";
const WAVE =
  "M229.936 263.458C235.79 263.11 242.167 263.526 247.957 263.869C274.704 265.453 299.988 273.363 323.5 286.078C333.937 291.723 344.291 298.218 354.869 303.744C359.872 306.358 365.283 308.504 370.493 310.675C372.74 311.612 376.313 312.328 378.186 313.729L377.864 313.933C372.882 313.541 368.033 313.411 363.075 312.686C349.126 310.644 335.927 307.377 322.457 303.272C307.935 298.876 293.197 293.494 279.065 289.082C245.247 278.525 210.861 273.836 175.592 277.945C173.447 278.195 169.301 278.903 167.266 278.733L167.054 278.355C168.432 276.855 172.868 275.291 174.932 274.467C192.682 267.381 210.943 264.332 229.936 263.458Z";
const GREEN =
  "M356.045 266.788C360.809 266.418 368.778 266.853 373.465 267.098C390.811 268.004 408.56 270.538 425.18 275.686C427.351 276.359 431.876 277.067 433.545 278.323L433.531 279.068L432.946 279.335C424.057 277.403 408.466 277.221 399.101 276.815C377.607 276.518 362.648 278.668 341.545 281.676C334.918 277.707 328.951 274.26 322.111 270.675C334.334 268.484 343.547 267.571 356.045 266.788Z";

const VB = { x: 157, y: 194, w: 287, h: 130 };

// Build a square SVG with the mark centred at `markFrac` of the canvas width.
// `bg` null = transparent (for Android adaptive foreground + splash, which sit
// on a backgroundColor set in app.json).
function squareSvg(size, { bg, markFrac }) {
  const markW = size * markFrac;
  const s = markW / VB.w;
  const markH = VB.h * s;
  const tx = (size - markW) / 2 - VB.x * s;
  const ty = (size - markH) / 2 - VB.y * s;
  const bgRect = bg
    ? `<rect width="${size}" height="${size}" fill="${bg}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bgRect}<g transform="translate(${tx} ${ty}) scale(${s})"><path fill="#F9B50C" d="${SUN}"/><path fill="#FFFFFF" d="${WAVE}"/><path fill="#619942" d="${GREEN}"/></g></svg>`;
}

async function render(name, size, opts) {
  const svg = squareSvg(size, opts);
  const out = join(ASSETS, name);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`  ${name}  (${size}x${size})`);
}

const targets = [
  // iOS / default launcher icon: navy bg, mark filling ~66%.
  ["icon.png", 1024, { bg: NAVY, markFrac: 0.66 }],
  // Android adaptive foreground: transparent (bg color is set in app.json),
  // mark kept inside the ~safe zone so the OS mask never clips it.
  ["adaptive-icon.png", 1024, { bg: null, markFrac: 0.5 }],
  // Splash mark: transparent, sits on the navy splash backgroundColor.
  ["splash-icon.png", 1024, { bg: null, markFrac: 0.55 }],
  // Web favicon: small, navy bg.
  ["favicon.png", 64, { bg: NAVY, markFrac: 0.78 }],
];

console.log("Generating brand assets ->", ASSETS);
for (const [name, size, opts] of targets) {
  await render(name, size, opts);
}
console.log("Done.");
