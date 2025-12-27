# Mobile App (Expo)

React Native app with Expo, tRPC integration, and native styling.

## Quick Start

```bash
# From monorepo root
bun install

# Start backend
cd apps/web && bun dev

# Start mobile
cd apps/mobile && npx expo start
```

Then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go on your phone

## Features

- **Home** - Welcome screen
- **Location** - GPS location with reverse geocoding

## Development

| Command | Description |
|---------|-------------|
| `npx expo start` | Start dev server |
| `npx expo start --clear` | Clear cache and start |
| `npx expo prebuild` | Generate native projects |
| `npx expo run:ios` | Build and run on iOS |

## Notes

- Uses React Native StyleSheet for styling (native look)
- tRPC client configured in `src/utils/api.ts`
- Location requires development build for full functionality in simulator
