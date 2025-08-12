import { app, BrowserWindow, globalShortcut, ipcMain, clipboard, dialog, shell, nativeTheme } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import Store from 'electron-store';
import { z } from 'zod';
import activeWin from 'active-win';
import os from 'node:os';

// On Windows we optionally use nut-js for paste and focus control
import { keyboard, Key, sleep } from '@nut-tree/nut-js';
let WindowManager: typeof import('node-window-manager') | undefined;
try {
  WindowManager = await import('node-window-manager');
} catch {}

const settingsSchema = z.object({
  hotkey: z.string(),
  autocloseAfterPaste: z.boolean(),
});

const store = new Store<{ hotkey: string; autocloseAfterPaste: boolean }>(
  {
    name: 'settings',
    defaults: {
      hotkey: process.platform === 'darwin' ? 'Cmd+Shift+Space' : 'Ctrl+Shift+Space',
      autocloseAfterPaste: true,
    },
  }
);

let overlayWindow: BrowserWindow | null = null;
let sessionActive = false;
let sessionText = '';
let priorApp: { owner: { name?: string; bundleId?: string; processId?: number } } | null = null;

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 480,
    height: 200,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    overlayWindow.loadURL(devUrl + '/index.html');
  } else {
    overlayWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

async function registerHotkey(hotkey: string): Promise<boolean> {
  globalShortcut.unregisterAll();
  const ok = globalShortcut.register(hotkey, () => {
    if (!sessionActive) {
      void startSession();
    } else {
      void stopAndPaste();
    }
  });
  if (!ok) {
    dialog.showErrorBox('Hotkey Registration Failed', `Could not register global shortcut: ${hotkey}`);
    return false;
  }
  return true;
}

async function startSession() {
  // Track currently active app
  priorApp = await activeWin();
  if (!overlayWindow) createOverlayWindow();
  sessionActive = true;
  sessionText = '';

  overlayWindow!.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow!.setVisibleOnAllWorkspaces(true);
  overlayWindow!.center();
  overlayWindow!.show();
  overlayWindow!.focus();
  overlayWindow!.webContents.send('overlay:sessionStarted', { startedAt: Date.now() });
}

async function refocusPriorApp(): Promise<boolean> {
  if (!priorApp) return false;
  const platform = process.platform;

  try {
    if (platform === 'darwin') {
      const bundleId = priorApp.owner.bundleId;
      if (bundleId) {
        const script = `tell application id "${bundleId}" to activate`;
        await app.whenReady();
        await app.focus({ steal: true });
        await new Promise<void>((resolve, reject) => {
          const osa = require('node:child_process').spawn('osascript', ['-e', script]);
          osa.on('exit', (code: number) => (code === 0 ? resolve() : reject(new Error('osascript failed'))));
        });
        return true;
      }
      return false;
    } else if (platform === 'win32') {
      if (WindowManager) {
        const windows = WindowManager.windowManager.getWindows();
        const target = windows.find(w => w.processId === priorApp!.owner.processId);
        if (target) {
          target.bringToTop();
          target.focus();
          return true;
        }
      }
      return false;
    }
  } catch {
    return false;
  }
  return false;
}

async function simulatePasteKeystroke() {
  // Use nut-js for cross-platform
  await sleep(120);
  if (process.platform === 'darwin') {
    await keyboard.pressKey(Key.LeftSuper, Key.V);
    await keyboard.releaseKey(Key.LeftSuper, Key.V);
  } else {
    await keyboard.pressKey(Key.LeftControl, Key.V);
    await keyboard.releaseKey(Key.LeftControl, Key.V);
  }
}

async function stopAndPaste() {
  const prevClipboard = clipboard.readText();
  const text = sessionText;
  const maxRetries = 2;

  // Write new text to clipboard
  clipboard.writeText(text);

  let focused = false;
  for (let i = 0; i <= maxRetries; i++) {
    focused = await refocusPriorApp();
    if (focused) break;
    await new Promise(r => setTimeout(r, 150));
  }

  if (!focused) {
    overlayWindow?.webContents.send('overlay:pasteResult', { status: 'copy_only', message: 'Could not refocus prior app. Text is on clipboard.' });
    return;
  }

  try {
    await simulatePasteKeystroke();
    // Restore clipboard later
    setTimeout(() => clipboard.writeText(prevClipboard), 750);
    overlayWindow?.webContents.send('overlay:pasteResult', { status: 'ok' });
  } catch (err) {
    if (process.platform === 'darwin') {
      overlayWindow?.webContents.send('overlay:permissionsRequired', { type: 'accessibility' });
    }
    overlayWindow?.webContents.send('overlay:pasteResult', { status: 'copy_only', message: 'Paste not permitted. Text copied to clipboard.' });
  } finally {
    sessionActive = false;
    if (store.get('autocloseAfterPaste')) {
      overlayWindow?.hide();
    }
  }
}

function setupIpc() {
  ipcMain.on('overlay:startRequested', () => {
    if (!sessionActive) void startSession();
  });

  ipcMain.on('overlay:stopRequested', () => {
    if (sessionActive) void stopAndPaste();
  });

  ipcMain.on('overlay:textUpdated', (_e, payload: { text: string; length: number }) => {
    sessionText = payload.text;
  });

  ipcMain.handle('settings:get', async () => store.store);
  ipcMain.handle('settings:set', async (_e, next) => {
    const parsed = settingsSchema.safeParse(next);
    if (!parsed.success) throw new Error('Invalid settings');
    const prevHotkey = store.get('hotkey');
    store.set(parsed.data);
    if (prevHotkey !== parsed.data.hotkey) {
      const ok = await registerHotkey(parsed.data.hotkey);
      if (!ok) {
        // Revert to previous
        store.set('hotkey', prevHotkey as any);
        await registerHotkey(prevHotkey);
        throw new Error('Hotkey already in use');
      }
    }
  });
}

app.whenReady().then(async () => {
  nativeTheme.themeSource = 'dark';
  createOverlayWindow();
  setupIpc();
  await registerHotkey(store.get('hotkey'));

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createOverlayWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});