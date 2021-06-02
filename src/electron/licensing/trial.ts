const PREFIX = 'TRIAL';
const DELIMITER = '|';
const TRIAL_DAYS = 7;

export function isTrial(license: string) {
  return license.startsWith(PREFIX + DELIMITER);
}

export function createTrial(): TrialLicense {
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + TRIAL_DAYS);
  const licenseKey = [PREFIX, expDate.toISOString()].join(DELIMITER);

  return {
    licenseKey,
    isExpired: false,
    expDate,
  };
}

export interface TrialLicense {
  licenseKey: string;
  isExpired: boolean;
  expDate: Date;
}

export function verifyTrial(licenseKey: string): false | TrialLicense {
  const parts = licenseKey.split(DELIMITER);
  if (parts.length !== 2) {
    return false;
  }
  const [prefix, data] = parts;

  if (prefix !== PREFIX) {
    return false;
  }

  const expDate = new Date(data);
  const now = new Date();

  if (isNaN(expDate.getTime())) {
    return false;
  }

  return {
    licenseKey,
    isExpired: now >= expDate,
    expDate: expDate,
  };
}
