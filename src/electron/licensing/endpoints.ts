const API_BASE = 'https://enjinn-license-server.netlify.app/.netlify/functions';

export const Endpoints = {
  ActivateLicense: `${API_BASE}/activate-license`,
  TrialLicense: `${API_BASE}/activate-trial`,
} as const;
