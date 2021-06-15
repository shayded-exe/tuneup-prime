import * as updates from '@/electron/updates';
import { IpcChannel } from '@/ipc-channel';
import { BrowserWindow, ipcMain } from 'electron';
import { UpdateInfo } from 'electron-updater';

export function registerHandlers() {
  ipcMain.on(IpcChannel.Updates_CheckUpdates, async _ => {
    await updates.checkForUpdates();
  });
}

export function updateAvailable(updateInfo: UpdateInfo) {
  const [win] = BrowserWindow.getAllWindows();

  win.webContents.send(IpcChannel.Updates_UpdateAvailable, updateInfo);
}
