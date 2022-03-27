import { LicenseState } from '@/licensing';

import { readFile } from './file';
import { isLicenseInitialized, licenseState } from './state';
import { verify } from './verify';

export function init() {
  try {
    const license = readFile();
    if (license) {
      licenseState(verify(license));
    }
  } catch (e) {
    console.error(e);
    licenseState(LicenseState.invalid());
  } finally {
    if (!isLicenseInitialized()) {
      licenseState(LicenseState.none());
    }
  }
}
