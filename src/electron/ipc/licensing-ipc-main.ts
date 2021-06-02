import * as licensing from '@/electron/licensing';
import { IpcChannel } from '@/ipc-channel';
import { ipcMain } from 'electron';

export function registerHandlers() {
  ipcMain.on(
    IpcChannel.Licensing_GetLicenseState,
    e => (e.returnValue = licensing.licenseState()),
  );
}
