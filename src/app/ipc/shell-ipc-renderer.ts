import { IpcChannel } from '@/ipc-channel';
import { ipcRenderer } from 'electron';

export function editFile(filePath: string) {
  ipcRenderer.send(IpcChannel.Shell_EditFile, filePath);
}

export function openFolder(folderPath: string) {
  ipcRenderer.send(IpcChannel.Shell_OpenFolder, folderPath);
}

export function openUrl(url: string) {
  ipcRenderer.send(IpcChannel.Shell_OpenUrl, url);
}
