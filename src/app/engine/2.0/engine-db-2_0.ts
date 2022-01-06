import { asyncSeries } from '@/utils';
import { Knex } from 'knex';
import { chunk, pick } from 'lodash';

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
        if (!input.parentListId) {
          input.parentListId = 0;
        }

        if (!playlist) {
          const newPlaylist: schema.NewPlaylist = {
            title: input.title,
            parentListId: input.parentListId,
            nextListId: 0,
            isPersisted: true,
            lastEditTime: formatDate(new Date()),
            isExplicitlyExported: true,
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
          // Empty playlist
          await this.table('PlaylistEntity', trx)
            .where({ listId: playlistId })
            .delete();

          // Re-parent playlist
          if (input.parentListId !== playlist.parentListId) {
            // Unlink current playlist from next
            await this.table('Playlist', trx)
              .where({ id: playlistId })
              .update({ nextListId: -1 });

            // Link previous playlist to next
            await this.table('Playlist', trx)
              .where({
                nextListId: playlist.id,
                parentListId: playlist.parentListId,
              })
              .update({ nextListId: playlist.nextListId });

            // Link new previous playlist to current
            await this.table('Playlist', trx)
              .where({
                nextListId: 0,
                parentListId: input.parentListId,
              })
              .update({ nextListId: playlist.id });

            // Set current playlist as last
            await this.table('Playlist', trx)
              .where({ id: playlistId })
              .update({
                parentListId: input.parentListId,
                nextListId: 0,
              });
          }
        }

        if (input.tracks.length) {
          const trackIds = input.tracks.map(t =>
            typeof t === 'number' ? t : t.id,
          );
          const lastEntityId = await this.getLastGeneratedId(
            'PlaylistEntity',
            trx,
          );
          const newEntities = trackIds.map<schema.NewPlaylistEntity>(
            (trackId, i) => ({
              listId: playlistId!,
              trackId,
              nextEntityId:
                i === trackIds.length - 1 //
                  ? 0
                  : lastEntityId + 2 + i,
              membershipReference: 0,
              databaseUuid: this.uuid,
            }),
          );

          await asyncSeries(
            chunk(
              newEntities,
              EngineDB.insertChunkSize,
            ).map(chunkEntities => async () =>
              this.table('PlaylistEntity', trx).insert(chunkEntities),
            ),
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

  async updateTracks(tracks: publicSchema.UpdateTrackInput[]) {
    await this.knex.transaction(async trx =>
      asyncSeries(
        tracks.map(track => async () => {
          const updateKeys: (keyof publicSchema.UpdateTrackInput)[] = [
            'album',
            'artist',
            'comment',
            'composer',
            'filename',
            'genre',
            'label',
            'path',
            'rating',
            'remixer',
            'title',
            'year',
          ];
          await this.table('Track', trx)
            .where({ id: track.id })
            .update(pick(track, updateKeys));
        }),
      ),
    );
  }
}
