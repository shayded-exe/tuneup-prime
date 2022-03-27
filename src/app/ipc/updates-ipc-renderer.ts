import { IpcChannel } from '@/ipc-channel';
import { ipcRenderer } from 'electron';
import { UpdateInfo } from 'electron-updater';

export function checkUpdates() {
  ipcRenderer.send(IpcChannel.Updates_CheckUpdates);
}

export function onUpdateAvailable(
  func: (updateInfo: UpdateInfo) => void,
): () => void {
  const listener = (_: any, u: UpdateInfo) => func(u);

  ipcRenderer.on(IpcChannel.Updates_UpdateAvailable, listener);

  return () => ipcRenderer.off(IpcChannel.Updates_UpdateAvailable, listener);
}
