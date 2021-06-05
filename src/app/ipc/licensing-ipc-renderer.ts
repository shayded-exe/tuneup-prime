import { IpcChannel } from '@/ipc-channel';
import { ActivateLicenseResult, LicenseState } from '@/licensing';
import { ipcRenderer } from 'electron';

export function getState(): LicenseState {
  const serializedState: LicenseState = ipcRenderer.sendSync(
    IpcChannel.Licensing_GetState,
  );

  return LicenseState.clone(serializedState);
}

export async function activate(
  licenseKey: string,
): Promise<ActivateLicenseResult> {
  return ipcRenderer.invoke(IpcChannel.Licensing_Activate, licenseKey);
}

export async function activateTrial(): Promise<LicenseState> {
  return ipcRenderer
    .invoke(IpcChannel.Licensing_ActivateTrial)
    .then(r => LicenseState.clone(r));
}
