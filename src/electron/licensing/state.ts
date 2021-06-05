import { LicenseState } from '@/licensing';

let _licenseState: LicenseState | undefined;

export function isLicenseInitialized(): boolean {
  return !!_licenseState;
}

export function licenseState(value?: LicenseState): LicenseState {
  if (value) {
    _licenseState = value;
  }
  if (!_licenseState) {
    throw new Error('licenseState not initialized');
  }
  return _licenseState;
}
