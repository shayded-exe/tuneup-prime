import { ActivateLicenseResult, LicenseType } from '@/licensing';
import { appStore, AppStoreKey } from '@/store';
import { postJson } from '@/utils';

import { Endpoints } from './endpoints';
import { licenseState } from './state';

interface Request {
  licenseKey: string;
}

interface Response {
  signedLicense: string;
}

export async function activate(
  licenseKey: string,
): Promise<ActivateLicenseResult> {
  const res = await postJson<Request>(Endpoints.ActivateLicense, {
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
