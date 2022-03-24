import fs from 'fs';
import nodePath from 'path';

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
