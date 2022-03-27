import { checkPathIsFile } from '@/utils';
import { remote } from 'electron';
import { memoize } from 'lodash';
import path from 'path';

import { EngineDB } from './engine-db';

const V2_SUB_FOLDER = 'Database2';
const DB_FILE = 'm.db';

export enum Version {
  V1_6 = '1.6',
  V2_X = '2.0',
}

export interface LibraryInfo {
  version: Version;
  folder: string;
  dbPath: string;
}

export async function connect(
  libraryFolder: string,
  opts: { skipBackup?: boolean } = {},
): Promise<EngineDB> {
  const { dbPath } = await getLibraryInfo(libraryFolder);

  const engineDb = new EngineDB({ ...opts, dbPath });

  await engineDb.init();

  return engineDb;
}

export const getLibraryFolder = memoize(() => {
  return path.resolve(remote.app.getPath('music'), 'Engine Library');
});

export async function getLibraryInfo(
  libraryFolder: string,
): Promise<LibraryInfo> {
  let dbPath = getDbPath(libraryFolder, Version.V2_X);
  if (await checkPathIsFile(dbPath)) {
    return {
      version: Version.V2_X,
      folder: libraryFolder,
      dbPath,
    };
  }
  dbPath = getDbPath(libraryFolder, Version.V1_6);
  if (await checkPathIsFile(dbPath)) {
    throw new Error(
      `Engine 1.6.x is not supported. Please upgrade to Engine 2.1.x.`,
    );
  }

  throw new Error(`Engine library was not found at "${libraryFolder}"`);
}

function getDbPath(libraryFolder: string, version: Version): string {
  switch (version) {
    case Version.V1_6:
      return path.resolve(libraryFolder, DB_FILE);
    case Version.V2_X:
      return path.resolve(libraryFolder, V2_SUB_FOLDER, DB_FILE);
  }
}
