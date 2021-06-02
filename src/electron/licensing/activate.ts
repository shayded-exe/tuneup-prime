import { LicenseType } from '@/licensing';
import { appStore, AppStoreKey } from '@/store';
import { postJson } from '@/utils';

import { licenseState } from './state';

const LICENSE_API =
  'https://enjinn-license-server.netlify.app/.netlify/functions';

interface ActivateInput {
  licenseKey: string;
}

interface ActivateOutput {
  signedLicense: string;
}

export async function activate(
  licenseKey: string,
): Promise<ActivateOutput | false> {
  const res = await postJson<ActivateInput>(`${LICENSE_API}/activate-license`, {
    licenseKey,
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`License server not found`);
    }
    return false;
  }

  const data: ActivateOutput = await res.json();
  appStore().set(AppStoreKey.License, data.signedLicense);
  licenseState(LicenseType.Licensed);

  return data;
}
