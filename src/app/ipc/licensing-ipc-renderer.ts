import { IpcChannel } from '@/ipc-channel';
import { ActivateLicenseResult, LicenseState } from '@/licensing';
import { ipcRenderer } from 'electron';

export function getState(): LicenseState {
  return ipcRenderer.sendSync(IpcChannel.Licensing_GetState);
}

export async function activate(
  licenseKey: string,
): Promise<ActivateLicenseResult> {
  return ipcRenderer.invoke(IpcChannel.Licensing_Activate, licenseKey);
}
