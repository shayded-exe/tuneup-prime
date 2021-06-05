import { License } from '@/licensing';
import { checkPathExistsSync } from '@/utils';
import Ajv from 'ajv';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

import schema from './enjinn.lic.schema.json';

export const FILENAME = 'enjinn.lic';

const validate = new Ajv({
  strictTuples: false,
}).compile<License>(schema);

export function getPath(): string {
  return path.resolve(app.getPath('userData'), FILENAME);
}

export function readFile(): License | false {
  const filePath = getPath();

  if (!checkPathExistsSync(filePath)) {
    return false;
  }

  const licenseStr = fs.readFileSync(filePath, 'utf-8');
  const license = JSON.parse(Buffer.from(licenseStr, 'base64').toString());

  return validate(license) && license;
}

export async function writeFile(license: License) {
  const filePath = getPath();
  const licenseStr = Buffer.from(JSON.stringify(license)).toString('base64');

  await fs.promises.writeFile(filePath, licenseStr, 'utf-8');
}
