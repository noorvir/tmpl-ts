# Mobile App

React Native app with Expo, tRPC, camera, location, and NativeWind styling.

## Quick Start

```bash
# 1. Install deps (from monorepo root)
bun install

# 2. Generate Prisma client (first time only)
cd packages/db && bunx prisma generate

# 3. Start backend
cd apps/web && bun dev

# 4. Start mobile (new terminal)
cd apps/mobile && bun dev
```

Press `i` for iOS simulator, `a` for Android.

## Development Build

For camera/location access, you need a native build:

```bash
bun run prebuild    # Generate ios/ and android/
bun run ios         # Build and run on iOS
```

After the initial build, just run `bun dev` for hot reload.

Only rebuild when adding native packages or changing `app.config.ts`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start Metro dev server |
| `bun run ios` | Build and run on iOS |
| `bun run android` | Build and run on Android |
| `bun run prebuild` | Generate native projects |
| `bun run prebuild:clean` | Clean rebuild native projects |

## Configuration

Edit `app.config.ts` for bundle ID, permissions, icons, and splash screen.

## Troubleshooting

- **Camera/location not working**: Need development build, not Expo Go
- **Metro issues**: `npx expo start --clear`
- **Full reset**: `bun run clean && bun install && bun run prebuild:clean`
