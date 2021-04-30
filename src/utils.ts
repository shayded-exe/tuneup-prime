import fs from 'fs';

export async function asyncSeries<T>(
  asyncFuncs: readonly (() => Promise<T>)[],
): Promise<T[]> {
  const results = [];

  for (const func of asyncFuncs) {
    results.push(await func());
  }

  return results;
}

export async function checkPathExists(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function checkPathIsFolder(path: string): Promise<boolean> {
  try {
    const stat = await fs.promises.lstat(path);

    return stat.isDirectory();
  } catch {
    return false;
  }
}
