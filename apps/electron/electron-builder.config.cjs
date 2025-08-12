/******** electron-builder config ********/

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: "com.example.overlaypaste",
  productName: "Overlay Paste",
  directories: {
    output: "release",
  },
  files: [
    "dist/**/*",
    "package.json"
  ],
  mac: {
    target: ["dmg", "zip"],
    category: "public.app-category.productivity",
    hardenedRuntime: true,
    entitlements: "entitlements.mac.plist",
    entitlementsInherit: "entitlements.mac.plist"
  },
  win: {
    target: ["nsis", "zip"],
  },
  extraMetadata: {
    main: "dist/main.js"
  }
};