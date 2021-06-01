import { IpcChannel } from '@/ipc-channel';
import { ipcMain, shell } from 'electron';

ipcMain.on(IpcChannel.EditFile, async (_, filePath: string) => {
  const err = await shell.openPath(filePath);

  if (err) {
    shell.showItemInFolder(filePath);
  }
});

ipcMain.on(IpcChannel.OpenUrl, (_, url: string) => {
  shell.openExternal(url);
});
