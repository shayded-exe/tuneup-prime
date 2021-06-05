import { LicenseState } from '@/licensing';
import { appStore, AppStoreKey } from '@/store';

import { readFile } from './file';
import { isLicenseInitialized, licenseState } from './state';
import { verify } from './verify';

export function init() {
  try {
    const store = appStore();

    // LEGACY: v1.x
    if (store.get(AppStoreKey.License)) {
      store.delete(AppStoreKey.License);
      return;
    }

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
