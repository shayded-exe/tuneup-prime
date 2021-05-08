import { appConf, AppConfKey } from '../conf';
import { postJson } from '../utils';
import { licenseState, LicenseState } from './state';

const LICENSE_API =
  'https://enjinn-license-server.netlify.app/.netlify/functions';

interface ActivateLicenseInput {
  licenseKey: string;
}

interface ActivateLicenseOutput {
  signedLicense: string;
}

export async function activateLicense(
  licenseKey: string,
): Promise<ActivateLicenseOutput | false> {
  const res = await postJson<ActivateLicenseInput>(
    `${LICENSE_API}/activate-license`,
    { licenseKey },
  );

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`License server not found`);
    }
    return false;
  }

  const data: ActivateLicenseOutput = await res.json();
  appConf().set(AppConfKey.License, data.signedLicense);
  licenseState(LicenseState.Licensed);

  return data;
}
