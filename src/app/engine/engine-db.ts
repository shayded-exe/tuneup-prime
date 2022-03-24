import fs from 'fs';
import knex, { Knex } from 'knex';

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
  static readonly insertChunkSize = 250;

  private readonly dbPath!: string;
  private readonly skipBackup?: boolean;

  private isInitialized = false;

  protected knex!: Knex;
  protected schemaInfo!: schema.Information;

  abstract get version(): Version;

  get uuid(): string {
    return this.schemaInfo.uuid;
  }

  constructor(opts: EngineDB.Options) {
    Object.assign(this, opts);
  }

  async init() {
    if (this.isInitialized) {
      throw new Error('Already initialized');
    }
    if (!this.skipBackup) {
      await this.backup();
    }

    this.knex = knex({
      client: 'sqlite3',
      connection: { filename: this.dbPath },
      useNullAsDefault: true,
    });

    try {
      this.schemaInfo = await this.getSchemaInfo();
    } catch (e) {
      e.message = `Engine is already running. Please close Engine and try again.\n\n${e.message}`;
      throw e;
    }
    this.isInitialized = true;
    console.debug(`Connected to Engine DB ${this.uuid}`);
  }

  async disconnect() {
    await this.knex.destroy();
    console.debug(`Disconnected from Engine DB ${this.uuid}`);
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
    withPerformanceData?: boolean;
  }): Promise<schema.Track[]>;

  abstract getPlaylistTracks(playlistId: number): Promise<schema.Track[]>;

  abstract updateTracks(tracks: schema.UpdateTrackInput[]): Promise<void>;

  protected async getSchemaInfo(): Promise<schema.Information> {
    // Perform in a transaction to force an error if Engine is running
    // TODO: Don't check this if we won't need to write
    const results = await this.knex.transaction(async trx => {
      return trx<schema.Information>('Information') //
        .select('*');
    });

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
