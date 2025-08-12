export {};

declare global {
  interface Window {
    overlayAPI: import('../types').OverlayAPI;
  }
}