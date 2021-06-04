import {
  DELIMITER,
  INVALID_LICENSE,
  LicenseState,
  LicenseType,
} from '@/licensing';

import { verify } from './verify';

const PREFIX = 'TRIAL:';

export function isTrial(license: string) {
  return license.startsWith(PREFIX);
}

export function activateTrial(licenseKey: string): LicenseState {}

export function verifyTrial(license: string): LicenseState {
  if (!isTrial(license) || !verify(license).isValid) {
    return INVALID_LICENSE;
  }

  const [trialData] = license.split(DELIMITER);
  const expDateStr = trialData.replace(PREFIX, '');
  const expDate = new Date(expDateStr);
  const now = new Date();

  if (isNaN(expDate.getTime())) {
    return INVALID_LICENSE;
  }

  const isExpired = now >= expDate;

  return {
    type: LicenseType.Trial,
    isValid: true,
    isExpired,
    trialExp: expDate,
  };
}
