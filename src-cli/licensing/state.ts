export enum LicenseState {
  Unlicensed = 'unlicensed',
  Invalid = 'invalid',
  Licensed = 'licensed',
}

let _licenseState: LicenseState | undefined;

export function licenseState(value?: LicenseState): LicenseState {
  if (value) {
    _licenseState = value;
  }
  if (!_licenseState) {
    throw new Error('licenseState not initialized');
  }
  return _licenseState;
}

export function isLicensed(): boolean {
  return _licenseState === LicenseState.Licensed;
}
