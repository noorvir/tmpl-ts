import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  shell,
  systemPreferences,
  Tray,
} from "electron";
import Store from "electron-store";

import icon from "../../resources/icon.png?asset";

const store = new Store<{ hotkey: string }>();

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let overlayPendingStartHandler: (() => void) | null = null;
let tray: Tray | null = null;
let isRecording = false;
let isQuitting = false;
let previousFocusedWindow: BrowserWindow | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  // Hide instead of close so the app can keep running in the background
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();

      // On macOS, hide from dock when main window is hidden but keep tray
      if (process.platform === "darwin") {
        app.dock?.hide();
      }
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function createOverlayWindow(): void {
  console.log("createOverlayWindow called");

  // Prevent multiple overlay windows
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    console.log(
      "Overlay window already exists and is not destroyed, skipping creation",
    );
    return;
  }

  // Clean up any existing overlay window first
  if (overlayWindow) {
    console.log("Cleaning up existing destroyed overlay window");
    overlayWindow = null;
  }

  console.log("Creating new overlay window");

  // Store the currently focused window to restore focus later
  const currentFocused = BrowserWindow.getFocusedWindow();
  if (currentFocused && currentFocused !== overlayWindow) {
    previousFocusedWindow = currentFocused;
    console.log("Stored previously focused window:", currentFocused.getTitle());
  }

  try {
    overlayWindow = new BrowserWindow({
      width: 400,
      height: 180,
      frame: false,
      transparent: true,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      show: false, // Don't show immediately to prevent focus stealing
      webPreferences: {
        preload: join(__dirname, "../preload/index.mjs"),
        sandbox: false,
        backgroundThrottling: false,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    console.log("Overlay window created successfully");

    overlayWindow.setVisibleOnAllWorkspaces(true);
    overlayWindow.setAlwaysOnTop(true, "screen-saver");

    // Prevent the overlay from taking focus
    overlayWindow.on("focus", () => {
      console.log("Overlay window received focus, redirecting...");
      if (previousFocusedWindow && !previousFocusedWindow.isDestroyed()) {
        previousFocusedWindow.focus();
      }
    });

    // Clean up when overlay is closed
    overlayWindow.on("closed", () => {
      console.log("Overlay window closed event fired");
      overlayWindow = null;
      previousFocusedWindow = null;
    });

    // Add error handling for crashed renderer
    overlayWindow.webContents.on("render-process-gone", (event, details) => {
      console.error("Overlay renderer process gone:", details);
      overlayWindow = null;
      isRecording = false;
    });

    // Add error handling for unresponsive renderer
    overlayWindow.webContents.on("unresponsive", () => {
      console.error("Overlay renderer became unresponsive");
    });

    overlayWindow.webContents.on("responsive", () => {
      console.log("Overlay renderer became responsive again");
    });

    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      overlayWindow.loadURL(process.env["ELECTRON_RENDERER_URL"] + "#overlay");
    } else {
      overlayWindow.loadFile(join(__dirname, "../renderer/index.html"), {
        hash: "overlay",
      });
    }

    console.log("Overlay window load initiated");
  } catch (error) {
    console.error("Error creating overlay window:", error);
    overlayWindow = null;
    throw error;
  }
}

function showOverlay() {
  console.log("showOverlay called, isRecording:", isRecording);

  try {
    createOverlayWindow();
    if (!overlayWindow) {
      console.error("Failed to create overlay window");
      isRecording = false;
      return;
    }

    // Show the overlay without focusing it
    overlayWindow.showInactive();

    const sendStart = () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        try {
          overlayWindow.webContents.send("overlay:start");
          console.log("Recording started successfully");
        } catch (error) {
          console.error("Error sending overlay:start event:", error);
          isRecording = false;
        }
      } else {
        console.error(
          "Cannot send overlay:start - overlay window is destroyed or null",
        );
        isRecording = false;
      }
    };

    // Clear any pending start handler
    if (overlayPendingStartHandler) {
      overlayPendingStartHandler = null;
    }

    // If the page is still loading, wait until it's ready before sending the event
    if (overlayWindow.webContents.isLoadingMainFrame()) {
      overlayPendingStartHandler = sendStart;
      overlayWindow.webContents.once("did-finish-load", () => {
        overlayPendingStartHandler = null;
        sendStart();
      });
    } else {
      sendStart();
    }
  } catch (error) {
    console.error("Error showing overlay:", error);
    isRecording = false;
    // Clean up overlay if it exists but failed
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      try {
        overlayWindow.close();
      } catch (closeError) {
        console.error("Error closing failed overlay:", closeError);
      }
    }
    overlayWindow = null;
  }
}

function hideOverlay() {
  console.log("hideOverlay called, isRecording:", isRecording);

  // CRITICAL: Set isRecording to false FIRST to prevent infinite loops
  isRecording = false;

  try {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      // If we scheduled a start but the page hasn't finished loading yet, cancel it
      if (overlayPendingStartHandler) {
        if (overlayWindow.webContents.isLoadingMainFrame()) {
          overlayWindow.webContents.removeListener(
            "did-finish-load",
            overlayPendingStartHandler,
          );
        }
        overlayPendingStartHandler = null;
      }

      // Send stop event to overlay
      try {
        overlayWindow.webContents.send("overlay:stop");
      } catch (error) {
        console.error("Error sending overlay:stop event:", error);
      }

      // Hide the overlay
      overlayWindow.hide();

      // Restore focus to the previously focused window
      if (previousFocusedWindow && !previousFocusedWindow.isDestroyed()) {
        previousFocusedWindow.focus();
        previousFocusedWindow = null;
      }

      console.log("Overlay hidden successfully");
    } else {
      console.log("No overlay window to hide or window is destroyed");
    }
  } catch (error) {
    console.error("Error hiding overlay:", error);
  }
}

// New function to completely destroy overlay and reset state
function destroyOverlay() {
  console.log("destroyOverlay called");

  // CRITICAL: Reset recording state first
  isRecording = false;

  try {
    if (overlayPendingStartHandler) {
      console.log("Clearing pending start handler in destroyOverlay");
      overlayPendingStartHandler = null;
    }

    if (overlayWindow) {
      if (!overlayWindow.isDestroyed()) {
        console.log("Closing overlay window");
        overlayWindow.close();
      } else {
        console.log("Overlay window already destroyed");
      }
      overlayWindow = null;
    }

    if (previousFocusedWindow && !previousFocusedWindow.isDestroyed()) {
      console.log("Restoring focus in destroyOverlay");
      previousFocusedWindow.focus();
    }
    previousFocusedWindow = null;
  } catch (error) {
    console.error("Error destroying overlay:", error);
  }
}

// Health check function to monitor overlay state
function startHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(() => {
    // Check for orphaned overlay windows or corrupted state
    if (overlayWindow && overlayWindow.isDestroyed() && isRecording) {
      console.warn(
        "Health check: Overlay window is destroyed but recording state is true, resetting",
      );
      isRecording = false;
      overlayWindow = null;
      previousFocusedWindow = null;
    }

    // Check for crashed overlay
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      try {
        // Try to access webContents to see if it's responsive
        const title = overlayWindow.getTitle();
        // If we can get the title without error, the window is probably fine
      } catch (error) {
        console.warn(
          "Health check: Overlay window is unresponsive, cleaning up",
        );
        isRecording = false;
        destroyOverlay();
      }
    }
  }, 5000); // Check every 5 seconds
}

function stopHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

function updateGlobalShortcut() {
  const accelerator =
    store.get("hotkey") ||
    (process.platform === "darwin"
      ? "CommandOrControl+Shift+R"
      : "Control+Shift+R");

  try {
    // Unregister all existing shortcuts
    globalShortcut.unregisterAll();

    // Register the new shortcut with proper error handling
    const success = globalShortcut.register(accelerator, () => {
      try {
        console.log("Global hotkey pressed, isRecording:", isRecording);

        if (!isRecording) {
          console.log("Starting recording via global hotkey");
          isRecording = true;

          // If overlay exists but is in a bad state, destroy it first
          if (overlayWindow && overlayWindow.isDestroyed()) {
            console.log(
              "Overlay window is destroyed but reference exists, cleaning up",
            );
            overlayWindow = null;
          }

          showOverlay();
        } else {
          console.log("Stopping recording via global hotkey");
          isRecording = false;
          hideOverlay();

          // After a few seconds, destroy the overlay to prevent accumulation of hidden windows
          setTimeout(() => {
            if (!isRecording && overlayWindow && !overlayWindow.isVisible()) {
              console.log(
                "Destroying hidden overlay window to prevent accumulation",
              );
              destroyOverlay();
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Error in global shortcut handler:", error);
        isRecording = false;
        // Force cleanup on error
        destroyOverlay();
      }
    });

    if (!success) {
      console.error(`Failed to register global shortcut: ${accelerator}`);
      console.error(
        "This shortcut may already be in use by another application",
      );
    } else {
      console.log(`Global shortcut registered: ${accelerator}`);
    }
  } catch (error) {
    console.error("Error updating global shortcut:", error);
  }
}

function createTray() {
  try {
    tray = new Tray(icon);

    // Ensure tray is visible and clickable
    if (process.platform === "darwin") {
      tray.setIgnoreDoubleClickEvents(false);
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show Main Window",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            // Show in dock when main window is shown
            if (process.platform === "darwin") {
              app.dock?.show();
            }
          } else {
            createMainWindow();
          }
        },
      },
      {
        label: "Toggle Recording",
        click: () => {
          try {
            if (!isRecording) {
              isRecording = true;
              showOverlay();
            } else {
              isRecording = false;
              hideOverlay();
            }
          } catch (error) {
            console.error("Error toggling recording from tray:", error);
            isRecording = false;
          }
        },
      },
      {
        label: "Settings",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            // Show in dock when main window is shown
            if (process.platform === "darwin") {
              app.dock?.show();
            }
            const url =
              is.dev && process.env["ELECTRON_RENDERER_URL"]
                ? `${process.env["ELECTRON_RENDERER_URL"]}#settings`
                : "file://" +
                  join(__dirname, "../renderer/index.html") +
                  "#settings";
            mainWindow.loadURL(url);
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setToolTip("Desktop App - Background Recording");
    tray.setContextMenu(contextMenu);

    // Double-click tray to show main window
    tray.on("double-click", () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        // Show in dock when main window is shown
        if (process.platform === "darwin") {
          app.dock?.show();
        }
      }
    });
  } catch (error) {
    console.error("Error creating tray:", error);
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // On macOS, start as a menubar app by hiding initially
  if (process.platform === "darwin") {
    app.dock?.hide();
  }

  createMainWindow();
  createTray();
  updateGlobalShortcut();
  startHealthCheck();

  // Log tray creation status
  if (tray) {
    console.log("Tray icon created successfully");
  } else {
    console.error("Failed to create tray icon");
  }

  app.on("activate", function () {
    // On macOS, re-create window when dock icon is clicked or app is activated
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      // Show in dock when activated
      if (process.platform === "darwin") {
        app.dock?.show();
      }
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("will-quit", () => {
  try {
    console.log("App will quit, cleaning up");
    stopHealthCheck();
    globalShortcut.unregisterAll();
    destroyOverlay();
  } catch (error) {
    console.error("Error during app quit:", error);
  }
});

app.on("window-all-closed", () => {
  // Keep running in background so global shortcuts and tray continue to work
  // Only quit on non-macOS platforms if explicitly requested
  if (process.platform !== "darwin" && isQuitting) {
    app.quit();
  }
});

// IPC handlers with error handling
ipcMain.on("overlay:show", () => {
  try {
    showOverlay();
  } catch (error) {
    console.error("Error showing overlay via IPC:", error);
  }
});

ipcMain.on("overlay:hide", () => {
  try {
    hideOverlay();
  } catch (error) {
    console.error("Error hiding overlay via IPC:", error);
  }
});

ipcMain.on("recording:toggle", () => {
  try {
    console.log("IPC recording toggle called, isRecording:", isRecording);
    if (!isRecording) {
      isRecording = true;
      showOverlay();
    } else {
      isRecording = false;
      hideOverlay();
    }
  } catch (error) {
    console.error("Error toggling recording via IPC:", error);
    isRecording = false;
    destroyOverlay();
  }
});

ipcMain.handle("permissions:microphone", async () => {
  if (process.platform === "darwin") {
    try {
      const granted = await systemPreferences.askForMediaAccess("microphone");
      return granted;
    } catch {
      return false;
    }
  }
  return true;
});

ipcMain.handle("audio:save", async (_event, buffer: Buffer) => {
  const dir = join(app.getPath("userData"), "Recordings");
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const filename = `recording-${Date.now()}.webm`;
  const full = join(dir, filename);
  await writeFile(full, buffer);
  return full;
});

ipcMain.handle("settings:getHotkey", async () => {
  return store.get("hotkey") || "";
});

ipcMain.handle("settings:setHotkey", async (_e, accelerator: string) => {
  try {
    store.set("hotkey", accelerator);
    updateGlobalShortcut();
    return { success: true };
  } catch (error) {
    console.error("Error setting hotkey:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
