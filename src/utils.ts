import fs from 'fs';
import { partialRight } from 'lodash';
import { getDiskInfo } from 'node-disk-info';
import Drive from 'node-disk-info/dist/classes/drive';
import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import ora from 'ora';
import nodePath from 'path';
import terminalLink from 'terminal-link';

export const PromptHints = {
  Select: '(↑/↓) to choose, (enter) to submit',
  Multiselect:
    '(↑/↓) to choose, (space) to select, (a) to select all, (enter) to submit',
};

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
  successMessage?: string;
}): Promise<T> {
  const ctx = ora({
    spinner: 'dots3',
    ...options,
  }).start();

  try {
    const result = await run(ctx);
    if (ctx.isSpinning) {
      ctx.succeed(options.successMessage);
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

export function resolvePathToCwdIfRelative(path: string): string {
  return nodePath.isAbsolute(path)
    ? path
    : nodePath.resolve(process.cwd(), path);
}

export async function getFilesInDir({
  path,
  maxDepth = 0,
}: {
  path: string;
  maxDepth?: number;
}): Promise<{ name: string; path: string }[]> {
  let entries;

  try {
    entries = await fs.promises.readdir(path, {
      withFileTypes: true,
    });
  } catch (e) {
    return [];
  }

  const filesWithPath = entries
    .filter(x => x.isFile())
    .map(x => ({
      name: x.name,
      path: nodePath.resolve(path, x.name),
    }));

  if (maxDepth > 0) {
    for (const dir of entries.filter(x => x.isDirectory())) {
      filesWithPath.push(
        ...(await getFilesInDir({
          path: nodePath.resolve(path, dir.name),
          maxDepth: maxDepth - 1,
        })),
      );
    }
  }

  return filesWithPath;
}

export enum SupportedOS {
  Windows = 'win32',
  MacOS = 'darwin',
  Linux = 'linux',
}

export function getOS(): SupportedOS {
  const os = process.platform;

  if (!Object.values(SupportedOS).includes(os as any)) {
    throw new Error(`Unsupported OS ${os}`);
  }

  return os as SupportedOS;
}

export type ExtDrive = Drive;

export async function getExtDrives(): Promise<ExtDrive[]> {
  function filterDrive(drive: Drive): boolean {
    switch (os) {
      case SupportedOS.Windows:
        return /^[ABD-Z]:$/.test(drive.mounted);
      case SupportedOS.MacOS:
        return /^\/dev\/disk/.test(drive.filesystem);
      case SupportedOS.Linux:
        return drive.filesystem !== 'tempfs' && /^\/mnt\//.test(drive.mounted);
    }
  }

  const os = getOS();
  const drives = await getDiskInfo();

  return drives.filter(filterDrive);
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
