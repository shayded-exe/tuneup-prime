import { LicenseType } from '@/licensing';
import { appStore, AppStoreKey } from '@/store';

import { licenseState } from './state';
import { createTrial, TrialLicense, verifyTrial } from './trial';
import { verify } from './verify';

export function init() {
  try {
    if (licenseState()) {
      throw new Error('Licensing is already initialized');
    }
  } catch {}

  const store = appStore();
  const license = store.get(AppStoreKey.License);

  if (!license) {
    const trial = createTrial();
    store.set(AppStoreKey.License, trial.licenseKey);
    setTrial(trial);
  } else {
    const trial = verifyTrial(license);
    if (trial) {
      setTrial(trial);
    } else if (verify(license)) {
      licenseState(LicenseType.Licensed);
    } else {
      licenseState(LicenseType.Invalid);
    }
  }
}

function setTrial(trial: TrialLicense) {
  licenseState({
    type: LicenseType.Trial,
    isExpired: trial.isExpired,
    trialExp: trial.expDate,
  });
}
