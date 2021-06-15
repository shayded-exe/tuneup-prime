import {
  ActivateLicenseResult,
  GUMROAD_PRODUCT_ID,
  License,
  LicenseState,
} from '@/licensing';
import { postJson } from '@/utils';
import * as fetch from 'node-fetch';

import { writeFile } from './file';
import { licenseState } from './state';

const API_BASE = 'https://license.shayded.com/.netlify/functions';

interface ActivateLicenseRequest {
  productId: string;
  licenseKey: string;
}

interface ActivateLicenseResponse {
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
  const res = await postJson<ActivateLicenseRequest>(
    `${API_BASE}/activate-license`,
    {
      productId: GUMROAD_PRODUCT_ID,
      licenseKey,
    },
  );

  if (!res.ok) {
    check404(res);
    return false;
  }

  const { license }: ActivateLicenseResponse = await res.json();
  await writeFile(license);

  return licenseState(LicenseState.purchased(license));
}

interface ActivateTrialRequest {
  productId: string;
}

export async function activateTrial(): Promise<LicenseState> {
  const res = await postJson<ActivateTrialRequest>(
    `${API_BASE}/activate-trial`,
    {
      productId: GUMROAD_PRODUCT_ID,
    },
  );

  check404(res);

  const { license }: ActivateLicenseResponse = await res.json();
  await writeFile(license);

  return licenseState(LicenseState.trial(license));
}
