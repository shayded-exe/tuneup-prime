export interface LicenseState {
  type: LicenseType;
  isValid: boolean;
  isExpired?: boolean;
  trialExp?: Date;
}

export enum LicenseType {
  Trial = 'trial',
  Invalid = 'invalid',
  Licensed = 'licensed',
}

export type ActivateLicenseResult = LicenseState | false;

export const DELIMITER = '|';
export const TRIAL_DAYS = 7;

export const INVALID_LICENSE = {
  type: LicenseType.Invalid,
  isValid: false,
} as const;
