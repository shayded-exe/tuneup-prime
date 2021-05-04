import { asyncSeries } from '../../utils';
import { EngineDB } from '../engine-db';
import { formatDate } from '../format';
import * as publicSchema from '../public-schema';
import * as schema from './schema-2_0';

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

  private async getPlaylistByTitle(
    title: string,
  ): Promise<schema.PlaylistWithPath | undefined> {
    return this.table('Playlist') //
      .join<schema.PlaylistPath>(
        'PlaylistPath',
        'Playlist.id',
        '=',
        'PlaylistPath.id',
      )
      .select('Playlist.*', 'PlaylistPath.path')
      .where('Playlist.title', title)
      .first();
  }

  async createOrUpdatePlaylist(
    input: publicSchema.PlaylistInput,
  ): Promise<publicSchema.Playlist> {
    return this.createOrUpdatePlaylistInternal(input);
  }

  private async createOrUpdatePlaylistInternal(
    input: publicSchema.PlaylistInput,
  ): Promise<schema.PlaylistWithPath> {
    let playlist = await this.getPlaylistByTitle(input.title);
    let playlistId = playlist?.id;

    return this.knex.transaction(
      async (trx): Promise<schema.PlaylistWithPath> => {
        if (!playlist) {
          const newPlaylist: schema.NewPlaylist = {
            title: input.title,
            parentListId: input.parentListId ?? 0,
            nextListId: 0,
            isPersisted: true,
            lastEditTime: formatDate(new Date()),
          };
          [playlistId] = await trx<schema.Playlist>('Playlist').insert(
            newPlaylist,
          );
          playlist = await trx<schema.Playlist>('Playlist')
            .join<schema.PlaylistPath>(
              'PlaylistPath',
              'Playlist.id',
              '=',
              'PlaylistPath.id',
            )
            .select('Playlist.*', 'PlaylistPath.path')
            .where('Playlist.id', playlistId)
            .first();
        } else {
          await trx<schema.PlaylistEntity>('PlaylistEntity') //
            .where('listId', playlistId)
            .delete();
        }

        if (input.tracks.length) {
          const lastEntityId = await this.getLastGeneratedId(
            'PlaylistEntity',
            trx,
          );

          await trx<schema.PlaylistEntity>('PlaylistEntity').insert(
            input.tracks.map<schema.NewPlaylistEntity>((track, i) => ({
              listId: playlistId!,
              trackId: track.id,
              nextEntityId:
                i === input.tracks.length - 1 //
                  ? 0
                  : lastEntityId + 2 + i,
              membershipReference: 0,
              databaseUuid: this.databaseUuid,
            })),
          );
        }

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

  async updateTrackPaths(tracks: publicSchema.Track[]) {
    this.knex.transaction(async trx => {
      await asyncSeries(
        tracks.map(track => async () => {
          await trx<schema.Track>('Track')
            .where('id', track.id)
            .update({ path: track.path });
        }),
      );
    });
  }
}
