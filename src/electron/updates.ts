import { isDev } from '@/utils';
import { autoUpdater, UpdateCheckResult } from 'electron-updater';
import path from 'path';

export function init() {
  autoUpdater.autoDownload = false;

  if (isDev()) {
    console.log(__dirname);
    autoUpdater.updateConfigPath = path.resolve(
      __dirname,
      '..',
      'dev-app-update.yml',
    );
  }
}

export async function checkForUpdates(): Promise<
  UpdateCheckResult | undefined
> {
  try {
    return autoUpdater.checkForUpdates();
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
