import { appStore, AppStoreKey } from '@/store';

import { licenseState } from './state';
import { isTrial, verifyTrial } from './trial';
import { verify } from './verify';

export function init() {
  try {
    if (licenseState()) {
      throw new Error('Licensing is already initialized');
    }
  } catch {}

  const store = appStore();
  const license = store.get(AppStoreKey.License);

  if (isTrial(license)) {
    licenseState(verifyTrial(license));
  } else {
    licenseState(verify(license));
  }
}
