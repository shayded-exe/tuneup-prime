export interface LicenseState {
  type: LicenseType;
  isExpired?: boolean;
  trialExp?: Date;
}

export enum LicenseType {
  Trial = 'trial',
  Invalid = 'invalid',
  Licensed = 'licensed',
}
