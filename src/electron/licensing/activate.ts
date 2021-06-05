import { ActivateLicenseResult, License, LicenseState } from '@/licensing';
import { postJson } from '@/utils';
import * as fetch from 'node-fetch';

import { writeFile } from './file';
import { licenseState } from './state';

const API_BASE = 'https://enjinn-license-server.netlify.app/.netlify/functions';

interface Request {
  licenseKey: string;
}

interface Response {
  license: License;
}

function check404(res: fetch.Response) {
  if (res.status === 404) {
    throw new Error(`License server not found`);
  }
}

export async function activate(
  licenseKey: string,
): Promise<ActivateLicenseResult> {
  const res = await postJson<Request>(`${API_BASE}/activate-license`, {
    licenseKey,
  });

  if (!res.ok) {
    check404(res);
    return false;
  }

  const { license }: Response = await res.json();
  await writeFile(license);

  return licenseState(LicenseState.purchased(license));
}

export async function activateTrial(): Promise<LicenseState> {
  const res = await postJson(`${API_BASE}/activate-trial`);

  check404(res);

  const { license }: Response = await res.json();
  await writeFile(license);

  return licenseState(LicenseState.trial(license));
}
