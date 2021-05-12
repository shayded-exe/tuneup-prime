import { camelCase, groupBy, transform } from 'lodash';

import { asyncSeries } from '../../utils';
import { EngineDB } from '../engine-db';
import * as publicSchema from '../public-schema';
import { Version } from '../version-detection';
import * as schema from './schema-1_6';

export class EngineDB_1_6 extends EngineDB {
  get version(): Version {
    return Version.V1_6;
  }

  private table<T extends schema.TableNames>(table: T) {
    return this.knex.table<schema.Tables[T]>(table);
  }

  getPlaylists(): Promise<publicSchema.Playlist[]> {
    return this.getPlaylistsInternal();
  }

  private async getPlaylistsInternal(): Promise<schema.List[]> {
    return this.table('List').select('*');
  }

  private async getPlaylistByTitle(
    title: string,
  ): Promise<schema.List | undefined> {
    return this.table('List') //
      .select('*')
      .where('title', title)
      .first();
  }

  async createOrUpdatePlaylist(
    input: publicSchema.PlaylistInput,
  ): Promise<publicSchema.Playlist> {
    return this.createOrUpdatePlaylistInternal(input);
  }

  private async createOrUpdatePlaylistInternal(
    input: publicSchema.PlaylistInput,
  ): Promise<schema.List> {
    let playlist = await this.getPlaylistByTitle(input.title);
    let playlistId = playlist?.id;

    return this.knex.transaction(async (trx): Promise<schema.List> => {
      if (!playlist) {
        const { maxId } = (await trx<schema.List>('List')
          .max('id', { as: 'maxId' })
          .first())!;
        playlistId = +maxId + 1;

        const newPlaylist: schema.NewList = {
          id: playlistId,
          title: input.title,
          type: schema.ListType.Playlist,
          path: `${input.title};`,
          isFolder: 0,
          isExplicitlyExported: 1,
        };
        await trx<schema.List>('List').insert(newPlaylist);
        playlist = await trx<schema.List>('Playlist')
          .select('*')
          .where('id', playlistId!)
          .first();

        await trx<schema.ListParentList>('ListParentList').insert({
          listOriginId: newPlaylist.id,
          listOriginType: newPlaylist.type,
          listParentId: newPlaylist.id,
          listParentType: newPlaylist.type,
        });
      } else {
        await trx<schema.ListTrackList>('ListTrackList')
          .where({
            listId: playlistId,
            listType: schema.ListType.Playlist,
          })
          .delete();
      }

      if (input.tracks.length) {
        await trx<schema.ListTrackList>('ListTrackList').insert(
          input.tracks.map<schema.NewListTrackList>((track, i) => ({
            listId: playlistId!,
            listType: schema.ListType.Playlist,
            trackId: track.id,
            trackIdInOriginDatabase: track.id,
            trackNumber: i + 1,
            databaseUuid: this.databaseUuid,
          })),
        );
      }

      return playlist!;
    });
  }

  async getTracks(): Promise<publicSchema.Track[]> {
    const tracks = await this.getTracksWithMeta();

    return tracks.map(track => ({ ...track, ...track.meta }));
  }

  private async getTracksWithMeta(): Promise<schema.TrackWithMeta[]> {
    const tracks = await this.table('Track').select('*');
    const textMetas = await this.table('MetaData').select('*');
    const textMetaMap = groupBy(textMetas, x => x.id);
    const intMetas = await this.table('MetaDataInteger').select('*');
    const intMetaMap = groupBy(intMetas, x => x.id);

    return tracks.map<schema.TrackWithMeta>(track => {
      return {
        ...track,
        meta: {
          ...transform(
            textMetaMap[track.id] ?? [],
            (result, meta) => {
              const key = camelCase(schema.MetaDataType[meta.type]);
              result[key] = meta.text;
            },
            {} as any,
          ),
          ...transform(
            intMetaMap[track.id] ?? [],
            (result, meta) => {
              const key = camelCase(schema.MetaDataIntegerType[meta.type]);
              result[key] = meta.value;
            },
            {} as any,
          ),
        },
      };
    });
  }

  async getPlaylistTracks(playlistId: number): Promise<publicSchema.Track[]> {
    const subQuery = this.table('ListTrackList').where('listId', playlistId);

    return this.table('Track') //
      .select('*')
      .whereIn('id', subQuery);
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

  async mapExternalTrackIdsToInternal(
    tracks: publicSchema.Track[],
  ): Promise<publicSchema.Track[]> {
    throw new Error('Not implemented');
  }
}

// const TRACK_SELECT_COLS: (keyof schema.Track)[] = [
//   'id',
//   'bitrate',
//   'bpmAnalyzed',
//   'filename',
//   'isBeatGridLocked',
//   'isExternalTrack',
//   'length',
//   'path',
//   'trackType',
//   'year',
// ];
