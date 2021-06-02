import { IpcChannel } from '@/ipc-channel';
import { ipcMain, shell } from 'electron';

export function registerHandlers() {
  ipcMain.on(IpcChannel.Shell_EditFile, async (_, filePath: string) => {
    const err = await shell.openPath(filePath);

    if (err) {
      shell.showItemInFolder(filePath);
    }
  });

  ipcMain.on(IpcChannel.Shell_OpenUrl, (_, url: string) => {
    shell.openExternal(url);
  });
}
