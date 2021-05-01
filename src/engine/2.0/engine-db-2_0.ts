import { EngineDB } from '../engine-db';
import { formatDate } from '../format';
import * as publicSchema from '../public-schema';
import * as schema from './schema-types-2_0';

export class EngineDB_2_0 extends EngineDB {
  static async connect(dbPath: string): Promise<EngineDB_2_0> {
    const db = new EngineDB_2_0(dbPath);
    await db.init();

    return db;
  }

  private table<T extends schema.TableNames>(table: T) {
    return this.knex.table<schema.Tables[T]>(table);
  }

  async getPlaylists(): Promise<publicSchema.Playlist[]> {
    return this.getPlaylistsInternal();
  }

  private async getPlaylistsInternal(): Promise<schema.PlaylistWithPath[]> {
    return this.table('Playlist')
      .join<schema.PlaylistPath>(
        'PlaylistPath',
        'Playlist.id',
        '=',
        'PlaylistPath.id',
      )
      .select('Playlist.*', 'PlaylistPath.path');
  }

  async createPlaylist(
    input: publicSchema.PlaylistInput,
  ): Promise<publicSchema.Playlist> {
    return this.createPlaylistInternal(input);
  }

  private async createPlaylistInternal({
    tracks,
    ...newPlaylist
  }: publicSchema.PlaylistInput): Promise<schema.PlaylistWithPath> {
    return this.knex.transaction(
      async (trx): Promise<schema.PlaylistWithPath> => {
        const [playlistId] = await trx<schema.Playlist>('Playlist').insert({
          ...newPlaylist,
          nextListId: 0,
          isPersisted: true,
          lastEditTime: formatDate(new Date()),
        });

        const lastEntityId = await this.getLastGeneratedId(
          'PlaylistEntity',
          trx,
        );

        await trx<schema.PlaylistEntity>('PlaylistEntity').insert(
          tracks.map<schema.NewPlaylistEntity>((track, i) => ({
            listId: playlistId,
            trackId: track.id,
            nextEntityId:
              i === tracks.length - 1 //
                ? 0
                : lastEntityId + 2 + i,
            membershipReference: 0,
            databaseUuid: this.databaseUuid,
          })),
        );

        const playlist: schema.PlaylistWithPath = await trx<schema.Playlist>(
          'Playlist',
        )
          .join<schema.PlaylistPath>(
            'PlaylistPath',
            'Playlist.id',
            '=',
            'PlaylistPath.id',
          )
          .select('Playlist.*', 'PlaylistPath.path')
          .where('Playlist.id', playlistId)
          .first();

        return playlist!;
      },
    );
  }

  async getTracks(): Promise<publicSchema.Track[]> {
    return this.getTracksInternal();
  }

  private async getTracksInternal(): Promise<schema.Track[]> {
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
