import fs from 'fs';
import knex, { Knex } from 'knex';
import { Dictionary } from 'lodash';

import * as schema from './public-schema';
import { SQLITE_SEQUENCE } from './sqlite-types';
import { Version } from './version-detection';

export namespace EngineDB {
  export interface Options {
    dbPath: string;
    skipBackup?: boolean;
  }
}

export abstract class EngineDB {
  private readonly dbPath!: string;
  private readonly skipBackup?: boolean;

  private isInitialized = false;

  protected readonly knex: Knex;

  protected schemaInfo!: schema.Information;

  abstract get version(): Version;

  get uuid(): string {
    return this.schemaInfo.uuid;
  }

  constructor(opts: EngineDB.Options) {
    Object.assign(this, opts);

    this.knex = knex({
      client: 'sqlite3',
      connection: { filename: opts.dbPath },
      useNullAsDefault: true,
    });
  }

  async init() {
    if (this.isInitialized) {
      throw new Error('Already initialized');
    }
    if (!this.skipBackup) {
      await this.backup();
    }

    this.schemaInfo = await this.getSchemaInfo();
    this.isInitialized = true;
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

  abstract getTracks(opts?: {
    ids?: number[];
    skipMeta?: boolean;
  }): Promise<schema.Track[]>;

  abstract getPlaylistTracks(playlistId: number): Promise<schema.Track[]>;

  abstract updateTrackPaths(tracks: schema.Track[]): Promise<void>;

  abstract getExtTrackMapping(
    tracks: schema.Track[],
  ): Promise<Dictionary<number>>;

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
