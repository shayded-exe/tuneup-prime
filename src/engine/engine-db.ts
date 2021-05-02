import fs from 'fs';
import knex, { Knex } from 'knex';

import * as schema from './public-schema';
import { SQLITE_SEQUENCE } from './sqlite-types';

export abstract class EngineDB {
  protected readonly knex: Knex;

  protected databaseUuid!: string;

  protected constructor(private readonly dbPath: string) {
    this.knex = knex({
      client: 'sqlite3',
      connection: { filename: dbPath },
      useNullAsDefault: true,
    });
  }

  protected async init() {
    await this.backup();
    const { uuid } = await this.getSchemaInfo();

    this.databaseUuid = uuid;
  }

  async disconnect() {
    await this.knex.destroy();
  }

  async backup() {
    await fs.promises.copyFile(this.dbPath, `${this.dbPath}.bak`);
  }

  abstract getPlaylists(): Promise<schema.Playlist[]>;

  abstract createOrUpdatePlaylist(
    input: schema.PlaylistInput,
  ): Promise<schema.Playlist>;

  abstract getTracks(): Promise<schema.Track[]>;

  abstract updateTrackPaths(tracks: schema.Track[]): Promise<void>;

  protected async getSchemaInfo(): Promise<schema.Information> {
    const results = await this.knex<schema.Information>('Information') //
      .select('*');

    if (!results.length) {
      throw new Error('EngineDB: Schema info not found');
    }
    if (results.length > 1) {
      throw new Error('EngineDB: Multiple schema info records found');
    }

    return results[0];
  }

  protected async getLastGeneratedId(
    table: string,
    trx?: Knex.Transaction,
  ): Promise<number> {
    const [id] = await (trx ?? this.knex)<SQLITE_SEQUENCE>('SQLITE_SEQUENCE')
      .pluck('seq')
      .where('name', table);

    if (!id) {
      throw new Error(`EngineDB: Failed to get last ${table} id`);
    }
    return id;
  }
}
