const { contextBridge, ipcRenderer } = require('electron');

/** @type {import('./types').OverlayAPI} */
const api = {
  startRequested: () => ipcRenderer.send('overlay:startRequested'),
  stopRequested: () => ipcRenderer.send('overlay:stopRequested'),
  textUpdated: (payload) => ipcRenderer.send('overlay:textUpdated', payload),
  onSessionStarted: (handler) => ipcRenderer.on('overlay:sessionStarted', (_e, p) => handler(p)),
  onPasteResult: (handler) => ipcRenderer.on('overlay:pasteResult', (_e, p) => handler(p)),
  onPermissionsRequired: (handler) => ipcRenderer.on('overlay:permissionsRequired', (_e, p) => handler(p)),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (s) => ipcRenderer.invoke('settings:set', s),
};

contextBridge.exposeInMainWorld('overlayAPI', api);