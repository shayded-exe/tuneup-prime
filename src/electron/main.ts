import * as store from '@/store';
import { getOS, isDev, SupportedOS } from '@/utils';
import { app, BrowserWindow, nativeTheme, protocol, shell } from 'electron';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';

import * as ipc from './ipc';
import * as licensing from './licensing';
import * as updates from './updates';
import { WindowStateTracker } from './window-state-tracker';

let window: BrowserWindow | undefined;

function init() {
  function lockSingleInstance() {
    if (!app.requestSingleInstanceLock()) {
      app.quit();
    } else {
      app.on('second-instance', () => {
        if (!window) {
          return;
        }
        if (window.isMinimized()) {
          window.restore();
        }
        window.focus();
      });
    }
  }

  function initApp() {
    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
      app.quit();
    });

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', async () => {
      if (isDev() && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
          await installExtension(VUEJS_DEVTOOLS);
        } catch (e) {
          console.error('Vue Devtools failed to install:', e.toString());
        }
      }

      createWindow();
    });

    // Exit cleanly on request from parent process in development mode.
    if (isDev()) {
      if (process.platform === 'win32') {
        process.on('message', data => {
          if (data === 'graceful-exit') {
            app.quit();
          }
        });
      } else {
        process.on('SIGTERM', () => {
          app.quit();
        });
      }
    }
  }

  async function createWindow() {
    const stateTracker = new WindowStateTracker(store.appStore());
    const width = 800;
    const minHeight = 600;

    window = new BrowserWindow({
      width,
      minWidth: width,
      maxWidth: width,
      height: Math.max(stateTracker.state?.height ?? 0, minHeight),
      minHeight: minHeight,
      x: stateTracker.state?.x,
      y: stateTracker.state?.y,
      frame: getOS() !== SupportedOS.Windows,
      resizable: true,
      webPreferences: {
        enableRemoteModule: true,
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env
          .ELECTRON_NODE_INTEGRATION as unknown as boolean,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
        sandbox: false,
      },
    });
    window.removeMenu();
    nativeTheme.themeSource = 'dark';
    stateTracker.track(window);

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      await window.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);

      if (!process.env.IS_TEST) {
        window.webContents.openDevTools();
      }
    } else {
      createProtocol('app');
      window.loadURL('app://./index.html');
    }

    // Open URLs in browser
    window.webContents.setWindowOpenHandler(details => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });
  }

  // Scheme must be registered before the app is ready
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        secure: true,
        standard: true,
      },
    },
  ]);

  lockSingleInstance();
  store.init({ withDefaults: true });
  updates.init();
  licensing.init();
  ipc.init();
  initApp();
}

init();
