# Mobile App (Expo)

A React Native mobile app built with Expo, featuring tRPC backend integration and NativeWind styling.

## Features

- 📱 **Cross-platform** - iOS and Android from a single codebase
- 🔐 **Authentication** - Secure auth with better-auth
- 📡 **tRPC** - Type-safe API communication with the backend
- 🎨 **NativeWind** - Tailwind CSS for styling (v4 in monorepo, v3 for mobile)
- 📍 **Location** - GPS location access with expo-location

## Quick Start

```bash
# From monorepo root
bun install

# Start backend (in one terminal)
cd apps/web && bun dev

# Start mobile (in another terminal)
cd apps/mobile && npx expo start --go --ios
```

## Development Notes

### NativeWind + Tailwind Version

The monorepo uses Tailwind CSS v4, but NativeWind requires v3. The `metro.config.js` includes a module resolution patch to handle this:

```js
// Forces nativewind to use local tailwindcss v3
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith("tailwindcss") && parent?.filename?.includes("nativewind")) {
    // Resolve from local node_modules
  }
  // ...
};
```

### Commands

| Command | Description |
|---------|-------------|
| `npx expo start --go` | Start with Expo Go |
| `npx expo start --clear` | Clear cache and start |
| `npx expo prebuild` | Generate native projects |
| `npx expo run:ios` | Run on iOS (requires prebuild) |

### Troubleshooting

- **Metro issues**: `npx expo start --clear`
- **Clean rebuild**: `bun run clean && bun install`
- **Location not working**: Need development build (`npx expo prebuild && npx expo run:ios`)
