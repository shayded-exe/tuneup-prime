import {
  DELIMITER,
  INVALID_LICENSE,
  LicenseState,
  LicenseType,
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

export function verify(license: string): LicenseState {
  const parts = license.split(DELIMITER);
  if (parts.length !== 2) {
    return INVALID_LICENSE;
  }
  const [licenseKey, sig] = parts;

  const isValid = new NodeRSA(PUBLIC_KEY).verify(
    licenseKey,
    sig,
    undefined,
    SIG_ENCODING,
  );

  return {
    type: isValid ? LicenseType.Licensed : LicenseType.Invalid,
    isValid,
  };
}
