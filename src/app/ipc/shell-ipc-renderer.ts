import { IpcChannel } from '@/ipc-channel';
import { ipcRenderer } from 'electron';

export function editFile(file: string) {
  ipcRenderer.send(IpcChannel.Shell_EditFile, file);
}

export function openUrl(url: string) {
  ipcRenderer.send(IpcChannel.Shell_OpenUrl, url);
}
