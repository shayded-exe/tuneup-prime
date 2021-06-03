import * as licensing from '@/electron/licensing';
import { IpcChannel } from '@/ipc-channel';
import { ipcMain } from 'electron';

export function registerHandlers() {
  ipcMain.on(IpcChannel.Licensing_GetState, e => {
    e.returnValue = licensing.licenseState();
  });

  ipcMain.handle(
    IpcChannel.Licensing_Activate,
    async (_, licenseKey: string) => {
      return licensing.activate(licenseKey);
    },
  );
}
