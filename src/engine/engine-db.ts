import knex, { Knex } from 'knex';
import path from 'path';

import { Playlist, Track } from './types';

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

  async getPlaylists(): Promise<Playlist[]> {
    return this.table('Playlist').select('*');
  }

  async getTracks(): Promise<Track[]> {
    return this.table('Track').select([
      'id',
      'album',
      'artist',
      'bitrate',
      'bpmAnalyzed',
      'comment',
      'composer',
      'dateAdded',
      'dateCreated',
      'explicitLyrics',
      'filename',
      'fileType',
      'genre',
      'isAnalyzed',
      'isMetadataImported',
      'label',
      'length',
      'originDatabaseUuid',
      'path',
      'rating',
      'remixer',
      'thirdPartySourceId',
      'timeLastPlayed',
      'title',
      'year',
    ]);
  }
}
