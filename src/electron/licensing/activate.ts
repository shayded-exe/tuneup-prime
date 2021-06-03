import { ActivateLicenseResult, LicenseType } from '@/licensing';
import { appStore, AppStoreKey } from '@/store';
import { postJson } from '@/utils';

import { licenseState } from './state';

const LICENSE_API =
  'https://enjinn-license-server.netlify.app/.netlify/functions';

interface Request {
  licenseKey: string;
}

interface Response {
  signedLicense: string;
}

export async function activate(
  licenseKey: string,
): Promise<ActivateLicenseResult> {
  const res = await postJson<Request>(`${LICENSE_API}/activate-license`, {
    licenseKey,
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`License server not found`);
    }
    return false;
  }

  const data: Response = await res.json();
  appStore().set(AppStoreKey.License, data.signedLicense);

  return licenseState(LicenseType.Licensed);
}
