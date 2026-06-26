// Expo flat-config ESLint. Keeps lint aligned with the Expo/React Native
// defaults so CI (.github/workflows/ci.yml) catches issues the same way locally.
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/*", "dist-check/*", "dist-web-check/*", ".expo/*", "node_modules/*"],
  },
  {
    // Node build/tooling scripts (not React Native app code) — allow Node globals.
    files: ["scripts/**/*.mjs", "*.config.js"],
    languageOptions: {
      globals: {
        Buffer: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "writable",
      },
    },
  },
  {
    rules: {
      // The screens fetch their data on mount via useEffect -> async loader.
      // This new (React-Compiler-era) rule flags any setState reachable from a
      // mount effect, i.e. the canonical client-side "fetch on mount" pattern.
      // CLAUDE.md deliberately forbids a data-fetching/state library, so
      // useEffect is the correct tool here. The rest of the strict Expo ruleset
      // stays on. See https://react.dev/learn/you-might-not-need-an-effect.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
