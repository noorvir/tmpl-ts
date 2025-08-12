import { contextBridge, ipcRenderer, clipboard } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // clipboard
  readClipboard: async (): Promise<string> => clipboard.readText(),
  writeClipboard: async (text: string): Promise<void> => {
    clipboard.writeText(text)
  },

  // overlay controls
  showOverlay: (): void => {
    ipcRenderer.send('overlay:show')
  },
  hideOverlay: (): void => {
    ipcRenderer.send('overlay:hide')
  },
  toggleRecording: (): void => {
    ipcRenderer.send('recording:toggle')
  },

  // microphone permission (macOS)
  ensureMicPermission: async (): Promise<boolean> => ipcRenderer.invoke('permissions:microphone'),

  // overlay events
  onOverlayStart: (cb: () => void): void => {
    ipcRenderer.on('overlay:start', cb)
  },
  removeOverlayStart: (cb: () => void): void => {
    ipcRenderer.removeListener('overlay:start', cb)
  },
  onOverlayStop: (cb: () => void): void => {
    ipcRenderer.on('overlay:stop', cb)
  },
  removeOverlayStop: (cb: () => void): void => {
    ipcRenderer.removeListener('overlay:stop', cb)
  },

  // audio save
  saveAudio: async (buffer: Buffer): Promise<string> => ipcRenderer.invoke('audio:save', buffer),

  // settings
  getHotkey: async (): Promise<string> => ipcRenderer.invoke('settings:getHotkey'),
  setHotkey: async (accelerator: string): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('settings:setHotkey', accelerator),
  openSettings: (): void => {
    location.hash = '#settings'
  },
  goHome: (): void => {
    location.hash = ''
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
