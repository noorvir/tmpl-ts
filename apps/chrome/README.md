# Acme Chrome Extension

A React-based Chrome extension built with the Acme monorepo template.

## Features

- React-based popup and content scripts
- Uses components from the shared UI package
- Hot reload development with Bun
- TypeScript support
- Tailwind CSS styling

## Development

```bash
# Install dependencies
pnpm install

# Build the extension
pnpm build

# Development mode with hot reload
pnpm dev
```

## Loading the Extension

1. Build the extension: `pnpm build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `apps/chrome/dist` directory

## Project Structure

- `src/background.ts` - Service worker background script
- `src/popup.tsx` - React popup component
- `src/content.tsx` - React content script component  
- `src/manifest.json` - Extension manifest
- `public/` - Static assets (icons, HTML)

## Components

The extension uses shared UI components from `@acme/ui`:
- Button
- Input  
- Label
- Toast

## Hot Reload

The development server watches for changes and rebuilds automatically. After making changes:
1. The extension will rebuild automatically
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Reload any tabs where you want to test the content script