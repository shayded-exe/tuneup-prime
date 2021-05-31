import { IpcChannel } from '@/ipc-channel';
import { ipcRenderer } from 'electron';

export function editFile(file: string) {
  ipcRenderer.send(IpcChannel.EditFile, file);
}
