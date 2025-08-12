export {}

declare global {
  interface Window {
    electron: typeof import('@electron-toolkit/preload').electronAPI
    api: {
      readClipboard: () => Promise<string>
      writeClipboard: (text: string) => Promise<void>
      showOverlay: () => void
      hideOverlay: () => void
      toggleRecording: () => void
      ensureMicPermission: () => Promise<boolean>
      onOverlayStart: (cb: () => void) => void
      removeOverlayStart: (cb: () => void) => void
      onOverlayStop: (cb: () => void) => void
      removeOverlayStop: (cb: () => void) => void
      saveAudio: (buffer: Buffer) => Promise<string>
      getHotkey: () => Promise<string>
      setHotkey: (accelerator: string) => Promise<{ success: boolean; error?: string }>
      openSettings: () => void
      goHome: () => void
    }
  }
}
