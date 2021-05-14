import { EngineDB_1_6 } from './1.6';
import { EngineDB_2_0 } from './2.0';
import { EngineDB } from './engine-db';
import { getLibraryInfo, LibraryInfo, Version } from './version-detection';

export async function connect<T extends EngineDB>(
  library: string | LibraryInfo,
  opts: { skipBackup?: boolean } = {},
): Promise<T> {
  const { version, dbPath } =
    typeof library === 'object' ? library : await getLibraryInfo(library);

  const engineDb = (() => {
    switch (version) {
      case Version.V1_6:
        return new EngineDB_1_6({ ...opts, dbPath });
      case Version.V2_0:
        return new EngineDB_2_0({ ...opts, dbPath });
    }
  })();

  await engineDb.init();

  return engineDb as unknown as T;
}
