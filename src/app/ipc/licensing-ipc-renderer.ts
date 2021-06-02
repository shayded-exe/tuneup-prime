import { IpcChannel } from '@/ipc-channel';
import { LicenseState } from '@/licensing';
import { ipcRenderer } from 'electron';

export function getLicenseState(): LicenseState {
  return ipcRenderer.sendSync(IpcChannel.Licensing_GetLicenseState);
}
