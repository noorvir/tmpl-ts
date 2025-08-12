## Minimal v1: Global Hotkey, Overlay UI, Paste-on-Stop

### Architecture
- Main process: registers global shortcut, manages overlay window, tracks prior active app, orchestrates Stop/Paste. Settings via `electron-store`.
- Renderer: React UI with textarea, timer, char count, hotkey hint, buttons. IPC to main.

### Windowing
- One frameless, transparent, always-on-top BrowserWindow (480x200). Focusable.

### Global Shortcut
- Default: macOS Cmd+Shift+Space, Windows Ctrl+Shift+Space. Toggles start/stop.

### Focus Tracking
- On start, snapshot active app via `active-win`. On stop, refocus prior app:
  - macOS: `osascript -e 'tell application id "BUNDLE" to activate'`
  - Windows: `node-window-manager` bringToTop/focus

### Clipboard & Paste
- Backup clipboard → write session text → refocus → after 100–200 ms send paste (Cmd/Ctrl+V via `@nut-tree/nut-js`) → restore clipboard after ~750 ms.

### IPC Channels
- renderer → main: `overlay:startRequested`, `overlay:stopRequested`, `overlay:textUpdated`
- main → renderer: `overlay:sessionStarted`, `overlay:pasteResult`, `overlay:permissionsRequired`

### Settings
- `electron-store`: `hotkey`, `autocloseAfterPaste`. Validate with `zod`. Re-register hotkey on change.

### Errors/Permissions
- On macOS if synthetic keys fail: send `overlay:permissionsRequired` and emit copy-only result.

### Build
- Renderer: Vite + React. Main built with `tsc`. Packaging with `electron-builder`.

### Scripts
- `pnpm -F electron-app dev` to run renderer + main with live reload.
- `pnpm -F electron-app package` to build installers.