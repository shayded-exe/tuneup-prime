import { IpcChannel } from '@/ipc-channel';
import { ipcMain, shell } from 'electron';

ipcMain.on(IpcChannel.EditFile, async (_, filePath: string) => {
  const res = await shell.openPath(filePath);

  if (!res) {
    shell.showItemInFolder(filePath);
  }
});

ipcMain.on(IpcChannel.OpenUrl, (_, url: string) => {
  shell.openExternal(url);
});
