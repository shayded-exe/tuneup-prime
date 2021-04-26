import knex from 'knex';

export class EngineDB {
  constructor(filename: string) {
    const connection = knex({
      client: 'sqlite3',
      connection: { filename },
    });
  }
}
