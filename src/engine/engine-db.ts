import knex, { Knex } from 'knex';
import path from 'path';

export class EngineDB {
  private readonly connection: Knex;

  public get table(): Knex {
    return this.connection;
  }

  constructor(filename: string) {
    this.connection = knex({
      client: 'sqlite3',
      connection: { filename },
      useNullAsDefault: true,
    });
  }

  static connect(engineLibraryFolder: string): EngineDB {
    const dbPath = path.resolve(engineLibraryFolder, 'Database2', 'm.db');

    return new EngineDB(dbPath);
  }

  disconnect() {
    this.connection.destroy();
  }
}
