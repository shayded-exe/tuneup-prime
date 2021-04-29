import knex, { Knex } from 'knex';
import path from 'path';

import { formatDate } from './format';
import {
  Information,
  NewPlaylistEntity,
  Playlist,
  Track,
} from './schema-types';

export class EngineDB {
  private readonly knex: Knex;

  public get table(): Knex {
    return this.knex;
  }

  constructor(filename: string) {
    this.knex = knex({
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
    this.knex.destroy();
  }

  async getSchemaInfo(): Promise<Information> {
    const results = await this.table('Information').select('*');

    if (!results.length) {
      throw new Error('EngineDB: Schema info not found');
    }
    if (results.length > 1) {
      throw new Error('EngineDB: Multiple schema info records found');
    }

    return results[0];
  }

  private async getLastGeneratedId(
    table: Knex.TableNames,
    trx?: Knex.Transaction,
  ): Promise<number> {
    const [id] = await (trx ?? this.table)('SQLITE_SEQUENCE')
      .pluck('seq')
      .where('name', table);

    if (!id) {
      throw new Error(`EngineDB: Failed to get last ${table} id`);
    }
    return id;
  }

  async getPlaylists(): Promise<Playlist[]> {
    return this.table('Playlist').select('*');
  }

  async createPlaylist({
    tracks,
    databaseUuid,
    ...newPlaylist
  }: PlaylistInput): Promise<Playlist> {
    return this.knex.transaction(
      async (trx): Promise<Playlist> => {
        const [playlistId] = await trx('Playlist').insert({
          ...newPlaylist,
          isPersisted: true,
          lastEditTime: formatDate(new Date()),
        });

        const lastEntityId = await this.getLastGeneratedId(
          'PlaylistEntity',
          trx,
        );

        await trx('PlaylistEntity').insert(
          tracks.map<NewPlaylistEntity>((track, i) => ({
            listId: playlistId,
            trackId: track.id,
            nextEntityId:
              i === tracks.length - 1 //
                ? 0
                : lastEntityId + 2 + i,
            membershipReference: 0,
            databaseUuid,
          })),
        );

        const playlist = await trx('Playlist').where('id', playlistId).first();

        return playlist!;
      },
    );
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

export interface PlaylistInput {
  title: string;
  parentListId: number;
  nextListId: number;
  tracks: Track[];
  databaseUuid: string;
}
