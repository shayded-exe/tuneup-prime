import fs from 'fs';
import { partialRight } from 'lodash';
import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import ora from 'ora';
import path from 'path';
import terminalLink from 'terminal-link';

export function isStandalone(): boolean {
  return __dirname.includes('snapshot');
}

export async function asyncSeries<T>(
  asyncFuncs: readonly (() => Promise<T>)[],
): Promise<T[]> {
  const results = [];

  for (const func of asyncFuncs) {
    results.push(await func());
  }

  return results;
}

export const urlFallbackLink = partialRight(terminalLink, {
  fallback: (_, url) => url,
});

export async function spinner<T = void>({
  run,
  ...options
}: ora.Options & {
  run: (ctx: ora.Ora) => Promise<T>;
}): Promise<T> {
  const ctx = ora({
    spinner: 'dots3',
    ...options,
  }).start();

  try {
    const result = await run(ctx);
    if (ctx.isSpinning) {
      ctx.succeed();
    }

    return result;
  } catch (e) {
    ctx.fail(e.message);
    throw e;
  }
}

export async function checkPathExists(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function checkPathIsDir(path: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(path);

    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function checkPathIsFile(path: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(path);

    return stat.isFile();
  } catch {
    return false;
  }
}

export async function getFilesInDir({
  path: _path,
  maxDepth = 0,
}: {
  path: string;
  maxDepth?: number;
}): Promise<{ name: string; path: string }[]> {
  const entries = await fs.promises.readdir(_path, {
    withFileTypes: true,
  });

  const filesWithPath = entries
    .filter(x => x.isFile())
    .map(x => ({
      name: x.name,
      path: path.resolve(_path, x.name),
    }));

  if (maxDepth > 0) {
    for (const dir of entries.filter(x => x.isDirectory())) {
      filesWithPath.push(
        ...(await getFilesInDir({
          path: path.resolve(_path, dir.name),
          maxDepth: maxDepth - 1,
        })),
      );
    }
  }

  return filesWithPath;
}

export async function postJson<T = object>(
  url: RequestInfo,
  body: T,
  opts?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...opts,
    method: 'POST',
    headers: {
      ...opts?.headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
