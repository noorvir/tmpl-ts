import { app, shell, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, systemPreferences } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const store = new Store<{ hotkey: string }>()

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isRecording = false

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createOverlayWindow(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) return
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 180,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  overlayWindow.setVisibleOnAllWorkspaces(true)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlayWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#overlay')
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'overlay' })
  }
}

function showOverlay() {
  createOverlayWindow()
  overlayWindow?.showInactive()
  overlayWindow?.webContents.send('overlay:start')
}

function hideOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('overlay:stop')
    overlayWindow.hide()
  }
}

function updateGlobalShortcut() {
  const accelerator = store.get('hotkey') || (process.platform === 'darwin' ? 'CommandOrControl+Shift+R' : 'Control+Shift+R')
  globalShortcut.unregisterAll()
  const ok = globalShortcut.register(accelerator, () => {
    if (!isRecording) {
      isRecording = true
      showOverlay()
    } else {
      isRecording = false
      hideOverlay()
    }
  })
  if (!ok) {
    console.warn('Failed to register global shortcut', accelerator)
  }
}

function createTray() {
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Toggle Recording', click: () => {
      if (!isRecording) {
        isRecording = true
        showOverlay()
      } else {
        isRecording = false
        hideOverlay()
      }
    } },
    { label: 'Settings', click: () => mainWindow?.loadURL((is.dev && process.env['ELECTRON_RENDERER_URL']) ? `${process.env['ELECTRON_RENDERER_URL']}#settings` : 'file://' + join(__dirname, '../renderer/index.html') + '#settings') },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ])
  tray.setToolTip('Desktop App')
  tray.setContextMenu(contextMenu)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createMainWindow()
  createTray()
  updateGlobalShortcut()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC
ipcMain.on('overlay:show', () => showOverlay())
ipcMain.on('overlay:hide', () => hideOverlay())
ipcMain.on('recording:toggle', () => {
  if (!isRecording) {
    isRecording = true
    showOverlay()
  } else {
    isRecording = false
    hideOverlay()
  }
})

ipcMain.handle('permissions:microphone', async () => {
  if (process.platform === 'darwin') {
    try {
      const granted = await systemPreferences.askForMediaAccess('microphone')
      return granted
    } catch {
      return false
    }
  }
  return true
})

ipcMain.handle('audio:save', async (_event, buffer: Buffer) => {
  const dir = join(app.getPath('userData'), 'Recordings')
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  const filename = `recording-${Date.now()}.webm`
  const full = join(dir, filename)
  await writeFile(full, buffer)
  return full
})

ipcMain.handle('settings:getHotkey', async () => {
  return store.get('hotkey') || ''
})

ipcMain.handle('settings:setHotkey', async (_e, accelerator: string) => {
  store.set('hotkey', accelerator)
  updateGlobalShortcut()
})
