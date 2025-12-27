// Metro config with tailwindcss v3 resolution for NativeWind
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

// Force nativewind to use local tailwindcss v3 before loading it
const Module = require("module");
const originalResolveFilename = Module._resolveFilename;
const localTailwind = path.join(__dirname, "node_modules/tailwindcss");

Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith("tailwindcss") && parent?.filename?.includes("nativewind")) {
    const subPath = request.replace("tailwindcss", "");
    return originalResolveFilename.call(this, localTailwind + subPath, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Explicit project root configuration
config.projectRoot = projectRoot;
config.watchFolders = [monorepoRoot];

// Ensure resolver has correct roots
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(monorepoRoot, "node_modules"),
  ],
};

module.exports = withNativeWind(config, {
  input: "./src/styles.css",
  configPath: "./tailwind.config.ts",
});
