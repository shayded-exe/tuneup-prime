import {
  License,
  LicenseData,
  LicenseState,
  TrialLicenseData,
} from '@/licensing';
import NodeRSA from 'node-rsa';

const PUBLIC_KEY = `-----BEGIN RSA PUBLIC KEY-----
MIIBigKCAYEAp0QcgVROvs+FOeg9cy0wwbLjPRDo/ivXt7enWdFIiPSGD+vCawol
8NZXWdNn+vRG9o+se53wTTvOYJ6cSyOaCfQFFqbTMOzKnpZx3D/H9UzlF98pnWUj
YC0U6RaluFfY+ZOYnEnHFHL0XbkVKI/Uq1tB6t8EOlVnAdRSdsNMKSjUfMJVtQff
944sqrbSBzr0FpSnm4hGMwFwQ3H22l7GqyityX30+ps7Wja0B9e6yx/4EjMJ/9AT
3ujkbCbUTzriXS1jdMSv/JzvTwUTPcToA8BctQiJN4DRh9/YUo/4dFNueahhVXU1
ByF9ovBiqIsYQvClAQ1vk1GwbXKcJ1CCfc8mDrwKrVxzDV5N7UP66RO0EMzA3145
2k+TFGF4hUuz6JzxYMg06q66LzxlBhOOMC2dEu0F3X4WEoygmd+FX2JbfneDpWww
8lHf12NMyOWds4jEhNVPyaiy1cItuGSu5BpFVzZDlE8tdkF5gwCNrYDq6nVbBb5s
0fnFqPp50iOJAgMBAAE=
-----END RSA PUBLIC KEY-----`;

const SIG_ENCODING = 'base64';

export function verify(license: License): LicenseState {
  const isValid = new NodeRSA(PUBLIC_KEY).verify(
    license.data,
    license.sig,
    undefined,
    SIG_ENCODING,
  );
  if (!isValid) {
    return LicenseState.invalid();
  }

  let parsedData: LicenseData;
  try {
    parsedData = JSON.parse(license.data);
  } catch (e) {
    console.error(e);
    return LicenseState.invalid();
  }

  const isActuallyTrial = isTrialData(parsedData);
  if (!!license.isTrial !== isActuallyTrial) {
    console.error(`isTrial signature mismatch`);
    return LicenseState.invalid();
  }

  return isActuallyTrial
    ? LicenseState.trial(license, parsedData as TrialLicenseData)
    : LicenseState.purchased(license);
}

function isTrialData(data: LicenseData): data is TrialLicenseData {
  return 'isTrial' in data && data.isTrial;
}
