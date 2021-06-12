import { checkPathIsFile } from '@/utils';
import chalk from 'chalk';
import path from 'path';

export enum Version {
  V1_6 = '1.6',
  V2_0 = '2.0',
}

const V2_SUB_FOLDER = 'Database2';
const DB_FILE = 'm.db';

export interface LibraryInfo {
  version: Version;
  folder: string;
  dbPath: string;
}

export async function getLibraryInfo(
  libraryFolder: string,
): Promise<LibraryInfo> {
  let dbPath = getDbPath(libraryFolder, Version.V2_0);
  if (await checkPathIsFile(dbPath)) {
    return {
      version: Version.V2_0,
      folder: libraryFolder,
      dbPath,
    };
  }
  dbPath = getDbPath(libraryFolder, Version.V1_6);
  if (await checkPathIsFile(dbPath)) {
    return {
      version: Version.V1_6,
      folder: libraryFolder,
      dbPath,
    };
  }

  throw new Error(
    chalk`Path {blue "${libraryFolder}"} is not an Engine library`,
  );
}

function getDbPath(libraryFolder: string, version: Version): string {
  switch (version) {
    case Version.V1_6:
      return path.resolve(libraryFolder, DB_FILE);
    case Version.V2_0:
      return path.resolve(libraryFolder, V2_SUB_FOLDER, DB_FILE);
  }
}
