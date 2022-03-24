import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';

export async function postJson<T = object>(
  url: RequestInfo,
  body?: T,
  opts?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...opts,
    method: 'POST',
    timeout: 10 * 1000,
    headers: {
      ...opts?.headers,
      'Content-Type': 'application/json',
    },
    body: body && JSON.stringify(body),
  });
}
