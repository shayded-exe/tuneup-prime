import { LicenseState, LicenseType } from '@/licensing';

let _licenseState: LicenseState | undefined;

export function licenseState(value?: LicenseState | LicenseType): LicenseState {
  if (typeof value === 'string') {
    value = { type: value };
  }
  if (value) {
    _licenseState = value;
  }
  if (!_licenseState) {
    throw new Error('licenseState not initialized');
  }
  return _licenseState;
}

export function isLicensed(): boolean {
  return _licenseState?.type === LicenseType.Licensed;
}
