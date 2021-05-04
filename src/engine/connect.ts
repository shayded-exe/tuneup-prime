import { EngineDB_1_6 } from './1.6';
import { EngineDB_2_0 } from './2.0';
import { EngineDB } from './engine-db';
import { EngineVersion, getLibraryInfo } from './version-detection';

export async function connect(libraryFolder: string): Promise<EngineDB> {
  const { version, dbPath } = await getLibraryInfo(libraryFolder);

  switch (version) {
    case EngineVersion.V1_6:
      return EngineDB_1_6.connect(dbPath);
    case EngineVersion.V2_0:
      return EngineDB_2_0.connect(dbPath);
  }
}
