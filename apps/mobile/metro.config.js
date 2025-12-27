// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const path = require("node:path");

// Patch module resolution to use local tailwindcss v3 for nativewind
const Module = require("module");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === "tailwindcss/package.json" && parent?.filename?.includes("nativewind")) {
    return path.join(__dirname, "node_modules/tailwindcss/package.json");
  }
  if (request.startsWith("tailwindcss") && parent?.filename?.includes("nativewind")) {
    const newRequest = path.join(__dirname, "node_modules", request);
    try {
      return originalResolveFilename.call(this, newRequest, parent, isMain, options);
    } catch (e) {
      // Fall through to original resolution
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const { withNativeWind } = require("nativewind/metro");

const config = withTurborepoManagedCache(
  withNativeWind(getDefaultConfig(__dirname), {
    input: "./src/styles.css",
    configPath: "./tailwind.config.ts",
  }),
);
module.exports = config;

/**
 * Move the Metro cache to the `.cache/metro` folder.
 * If you have any environment variables, you can configure Turborepo to invalidate it when needed.
 *
 * @see https://turborepo.com/docs/reference/configuration#env
 * @param {import('expo/metro-config').MetroConfig} config
 * @returns {import('expo/metro-config').MetroConfig}
 */
function withTurborepoManagedCache(config) {
  config.cacheStores = [
    new FileStore({ root: path.join(__dirname, ".cache/metro") }),
  ];
  return config;
}
