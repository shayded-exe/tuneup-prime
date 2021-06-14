import { IpcChannel } from '@/ipc-channel';
import { ipcRenderer } from 'electron';
import { UpdateInfo } from 'electron-updater';

export function checkUpdates() {
  return ipcRenderer.send(IpcChannel.Updates_CheckUpdates);
}

export async function onUpdateAvailable(
  func: (updateInfo: UpdateInfo) => void,
) {
  ipcRenderer.on(IpcChannel.Updates_UpdateAvailable, (_, u) => func(u));
}
