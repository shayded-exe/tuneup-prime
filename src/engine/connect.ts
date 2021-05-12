import { pull } from 'lodash';

import { EngineDB_1_6 } from './1.6';
import { EngineDB_2_0 } from './2.0';
import { EngineDB } from './engine-db';
import { getLibraryInfo, LibraryInfo, Version } from './version-detection';

export async function connect(
  library: string | LibraryInfo,
  opts: { skipBackup?: boolean } = {},
): Promise<EngineDB> {
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

  return engineDb;
}

export async function multiConnect(
  libraries: string | LibraryInfo[],
  opts: { skipBackup?: boolean } = {},
): Promise<MultiEngineDB> {
  const multi = new MultiEngineDB(libraries);
  await multi.connect(opts);
  return multi;
}

export class MultiEngineDB extends Array<EngineDB> {
  constructor(private readonly libraries: string | LibraryInfo[]) {
    super();
  }

  async connect(opts: { skipBackup?: boolean } = {}) {
    try {
      for (let input of this.libraries) {
        const con = await connect(input, opts);
        this.push(con);
      }
    } catch {
      await this.disconnect();
    }
  }

  async disconnect() {
    for (let con of [...this]) {
      await con.disconnect();
      pull(this, con);
    }
  }
}
