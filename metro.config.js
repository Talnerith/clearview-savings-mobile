// Expo Metro config with one tweak: stub @opentelemetry/api.
//
// @supabase/supabase-js optionally `import()`s @opentelemetry/api for tracing,
// guarded by a runtime try/catch — but Metro (especially the web bundler) tries
// to resolve that dynamic import at build time and fails because the package
// isn't installed. We don't use Supabase tracing, so we resolve it to an empty
// module rather than add an unused dependency.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const EMPTY = require.resolve("./metro-empty-module.js");
const STUBBED = new Set(["@opentelemetry/api"]);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (STUBBED.has(moduleName)) {
    return { type: "sourceFile", filePath: EMPTY };
  }
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = config;
