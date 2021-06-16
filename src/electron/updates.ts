import { IpcChannel } from '@/ipc-channel';
import { isDev } from '@/utils';
import { BrowserWindow } from 'electron';
import { autoUpdater, UpdateCheckResult, UpdateInfo } from 'electron-updater';
import path from 'path';

export function init() {
  function onUpdateAvailable(updateInfo: UpdateInfo) {
    const [win] = BrowserWindow.getAllWindows();

    win.webContents.send(IpcChannel.Updates_UpdateAvailable, updateInfo);
  }

  autoUpdater.autoDownload = false;

  if (isDev()) {
    autoUpdater.updateConfigPath = path.resolve(
      __dirname,
      '..',
      'dev-app-update.yml',
    );
  }

  autoUpdater.on('update-available', onUpdateAvailable);
}

export async function checkForUpdates(): Promise<
  UpdateCheckResult | undefined
> {
  try {
    return await autoUpdater.checkForUpdates();
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
