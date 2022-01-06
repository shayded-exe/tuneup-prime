import fs from 'fs';
import { getDiskInfo } from 'node-disk-info';
import Drive from 'node-disk-info/dist/classes/drive';
import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import nodePath from 'path';

export function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
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

export function walkTree<TBranch, TLeaf>({
  tree,
  isBranch,
  getChildren,
  walkBranch,
  walkLeaf,
}: {
  tree: (TBranch | TLeaf)[];
  isBranch: (node: TBranch | TLeaf) => node is TBranch;
  getChildren: (branch: TBranch) => (TBranch | TLeaf)[];
  walkBranch?: (branch: TBranch) => void;
  walkLeaf?: (leaf: TLeaf) => void;
}): (TBranch | TLeaf)[] {
  tree.forEach(node => {
    if (isBranch(node)) {
      walkBranch?.(node);
      walkTree({
        tree: getChildren(node),
        isBranch,
        getChildren,
        walkBranch,
        walkLeaf,
      });
    } else {
      walkLeaf?.(node);
    }
  });

  return tree;
}

export function flatTree<TBranch, TLeaf>({
  tree,
  isBranch,
  getChildren,
}: {
  tree: (TBranch | TLeaf)[];
  isBranch: (node: TBranch | TLeaf) => node is TBranch;
  getChildren: (branch: TBranch) => (TBranch | TLeaf)[];
}): TLeaf[] {
  return tree.flatMap(node =>
    isBranch(node)
      ? flatTree({ tree: getChildren(node), isBranch, getChildren })
      : node,
  );
}

export async function checkPathExists(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

export function checkPathExistsSync(path: string): boolean {
  try {
    fs.accessSync(path);
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

export function makePathUnix(path: string): string {
  return path.replace(/\\/g, '/');
}

export function resolvePathToBaseIfRelative({
  path,
  basePath,
}: {
  path: string;
  basePath: string;
}): string {
  return nodePath.isAbsolute(path) ? path : nodePath.resolve(basePath, path);
}

export async function getFilesInDir({
  path,
  extensions,
  maxDepth = 0,
}: {
  path: string;
  extensions?: string[];
  maxDepth?: number;
}): Promise<{ name: string; path: string; ext: string }[]> {
  let entries;

  try {
    entries = await fs.promises.readdir(path, {
      withFileTypes: true,
    });
  } catch (e) {
    return [];
  }

  const files = entries
    .filter(x => x.isFile())
    .map(x => ({
      name: x.name,
      path: nodePath.resolve(path, x.name),
      ext: nodePath.parse(x.name).ext,
    }))
    .filter(x => !extensions || extensions.includes(x.ext));

  if (maxDepth > 0) {
    for (const dir of entries.filter(x => x.isDirectory())) {
      files.push(
        ...(await getFilesInDir({
          path: nodePath.resolve(path, dir.name),
          extensions,
          maxDepth: maxDepth - 1,
        })),
      );
    }
  }

  return files;
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

export function getOSName(): string {
  const os = getOS();

  switch (os) {
    case SupportedOS.Windows:
      return 'Windows';
    case SupportedOS.MacOS:
      return 'macOS';
    case SupportedOS.Linux:
      return 'Linux';
  }
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
