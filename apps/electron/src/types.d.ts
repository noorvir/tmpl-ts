export type PasteResult = { status: 'ok' | 'copy_only' | 'error'; message?: string };

export interface OverlayAPI {
  startRequested: () => void;
  stopRequested: () => void;
  textUpdated: (payload: { text: string; length: number }) => void;
  onSessionStarted: (handler: (payload: { startedAt: number }) => void) => void;
  onPasteResult: (handler: (payload: PasteResult) => void) => void;
  onPermissionsRequired: (handler: (payload: { type: 'accessibility' | 'unknown' }) => void) => void;
  getSettings: () => Promise<{ hotkey: string; autocloseAfterPaste: boolean }>;
  setSettings: (s: { hotkey: string; autocloseAfterPaste: boolean }) => Promise<void>;
}

declare global {
  interface Window {
    overlayAPI: OverlayAPI;
  }
}