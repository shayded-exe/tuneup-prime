import { Knex } from 'knex';

import { asyncSeries } from '../../utils';
import { EngineDB } from '../engine-db';
import { formatDate } from '../format';
import * as publicSchema from '../public-schema';
import { Version } from '../version-detection';
import * as schema from './schema-2_0';

export class EngineDB_2_0 extends EngineDB {
  get version(): Version {
    return Version.V2_0;
  }

  private table<T extends schema.TableNames>(table: T, trx?: Knex.Transaction) {
    let qb = this.knex.table<schema.Tables[T]>(table);
    if (trx) {
      qb = qb.transacting(trx);
    }
    return qb;
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
          [playlistId] = await this.table('Playlist', trx).insert(newPlaylist);
          playlist = await this.table('Playlist', trx)
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
          await this.table('PlaylistEntity', trx) //
            .where('listId', playlistId)
            .delete();
        }

        const trackIds = input.tracks.map(t =>
          typeof t === 'number' ? t : t.id,
        );
        if (trackIds.length) {
          const lastEntityId = await this.getLastGeneratedId(
            'PlaylistEntity',
            trx,
          );

          await this.table('PlaylistEntity', trx).insert(
            trackIds.map<schema.NewPlaylistEntity>((trackId, i) => ({
              listId: playlistId!,
              trackId,
              nextEntityId:
                i === trackIds.length - 1 //
                  ? 0
                  : lastEntityId + 2 + i,
              membershipReference: 0,
              databaseUuid: this.uuid,
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
    return this.table('Track')
      .select([
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
        'isBeatGridLocked',
        'isMetadataImported',
        'key',
        'label',
        'length',
        'originDatabaseUuid',
        'originTrackId',
        'path',
        'rating',
        'remixer',
        'thirdPartySourceId',
        'timeLastPlayed',
        'title',
        'year',
      ])
      .whereNotNull('path')
      .andWhere('originDatabaseUuid', this.uuid);
  }

  async getPlaylistTracks(playlistId: number): Promise<publicSchema.Track[]> {
    throw new Error('Not implemented');
  }

  async updateTrackPaths(tracks: publicSchema.Track[]) {
    this.knex.transaction(async trx => {
      await asyncSeries(
        tracks.map(track => async () => {
          await this.table('Track', trx)
            .where('id', track.id)
            .update({ path: track.path });
        }),
      );
    });
  }
}
