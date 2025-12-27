# Mobile App (Expo)

React Native app with Expo, tRPC integration, and [twrnc](https://github.com/jaredh159/tailwind-react-native-classnames) for Tailwind styling.

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

## Styling with twrnc

Uses `twrnc` for Tailwind CSS classes in React Native. This is a lightweight runtime that converts Tailwind classes to RN style objects.

```tsx
import tw from '@/lib/tw';

// Basic usage
<View style={tw`flex-1 bg-white dark:bg-black`}>
  <Text style={tw`text-lg font-bold text-primary`}>Hello</Text>
</View>

// Conditional styles
<Pressable style={({ pressed }) => 
  tw.style(`px-4 py-2 rounded-lg`, pressed && `opacity-70`)
}>

// Custom colors defined in tailwind.config.js
<Text style={tw`text-primary`}>Primary color</Text>
```

### Configuration

- `tailwind.config.js` - Theme colors, breakpoints
- `lib/tw.ts` - Configured tw instance with dark mode support

## Development

| Command | Description |
|---------|-------------|
| `npx expo start` | Start dev server |
| `npx expo start --clear` | Clear cache and start |
| `npx expo prebuild` | Generate native projects |
| `npx expo run:ios` | Build and run on iOS |

## Notes

- Uses `twrnc` for Tailwind CSS styling (shares theme with web)
- tRPC client configured in `src/utils/api.ts`
- Location requires development build for full functionality
