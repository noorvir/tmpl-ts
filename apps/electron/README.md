# Electron Overlay Paste (v1)

Run dev:

```bash
pnpm --filter electron-app run dev
```

Build production:

```bash
pnpm --filter electron-app run build && pnpm --filter electron-app run start
```

Package installers:

```bash
pnpm --filter electron-app run package
```

Default hotkey: macOS Cmd+Shift+Space, Windows Ctrl+Shift+Space.

Implements global hotkey to toggle overlay, always-on-top frameless window with textarea, timer, char count, Stop and Paste, and Copy Only. On stop, backs up clipboard, copies text, refocuses prior app, pastes (Cmd/Ctrl+V), and restores clipboard. Settings persisted via electron-store.