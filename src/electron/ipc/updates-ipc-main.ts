import * as updates from '@/electron/updates';
import { IpcChannel } from '@/ipc-channel';
import { ipcMain } from 'electron';

export function registerHandlers() {
  ipcMain.on(IpcChannel.Updates_CheckUpdates, async _ => {
    await updates.checkForUpdates();
  });
}
