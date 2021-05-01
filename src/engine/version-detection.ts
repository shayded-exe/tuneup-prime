import chalk from 'chalk';
import path from 'path';

import { checkPathIsFile } from '../utils';

export enum EngineVersion {
  V1_6 = '1.6',
  V2_0 = '2.0',
}

const DB_FILE_NAME = 'm.db';

export async function detectLibraryVersion(
  libraryFolder: string,
): Promise<{
  version: EngineVersion;
  dbPath: string;
}> {
  let dbPath = getDbPath(libraryFolder, EngineVersion.V2_0);
  if (await checkPathIsFile(dbPath)) {
    return {
      version: EngineVersion.V2_0,
      dbPath,
    };
  }
  dbPath = getDbPath(libraryFolder, EngineVersion.V1_6);
  if (await checkPathIsFile(dbPath)) {
    return {
      version: EngineVersion.V1_6,
      dbPath,
    };
  }

  throw new Error(
    chalk`Path {blue "${libraryFolder}"} is not an Engine library`,
  );
}

function getDbPath(libraryFolder: string, version: EngineVersion): string {
  switch (version) {
    case EngineVersion.V1_6:
      return path.resolve(libraryFolder, DB_FILE_NAME);
    case EngineVersion.V2_0:
      return path.resolve(libraryFolder, 'Database2', DB_FILE_NAME);
  }
}
