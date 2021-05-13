import { camelCase, Dictionary, fromPairs, groupBy, transform } from 'lodash';

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

      const trackIds = input.tracks.map(t =>
        typeof t === 'number' ? t : t.id,
      );
      if (trackIds.length) {
        await trx<schema.ListTrackList>('ListTrackList').insert(
          trackIds.map<schema.NewListTrackList>((trackId, i) => ({
            listId: playlistId!,
            listType: schema.ListType.Playlist,
            trackId,
            trackIdInOriginDatabase: trackId,
            trackNumber: i + 1,
            databaseUuid: this.databaseUuid,
          })),
        );
      }

      return playlist!;
    });
  }

  async getTracks(opts?: {
    ids?: number[];
    skipMeta?: boolean;
  }): Promise<publicSchema.Track[]> {
    const tracks = await this.getTracksInternal(opts);

    return tracks.map(track => ({ ...track, ...track.meta }));
  }

  private async getTracksInternal({
    ids,
    skipMeta,
  }: {
    ids?: number[];
    skipMeta?: boolean;
  } = {}): Promise<schema.TrackWithMeta[]> {
    const tracks = await (() => {
      let qb = this.table('Track').select('*');
      if (ids) {
        qb = qb.whereIn('id', ids);
      }
      return qb;
    })();

    if (skipMeta) {
      return tracks;
    }

    const trackIds = tracks.map(t => t.id);
    const textMetas = await this.table('MetaData')
      .select('*')
      .whereIn('id', trackIds);
    const textMetaMap = groupBy(textMetas, x => x.id);
    const intMetas = await this.table('MetaDataInteger')
      .select('*')
      .whereIn('id', trackIds);
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
    const subQuery = this.table('ListTrackList')
      .select('trackId')
      .where('listId', playlistId);

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

  async getExtTrackMapping(
    tracks: publicSchema.Track[],
  ): Promise<Dictionary<number>> {
    const copiedTracks = await this.table('CopiedTrack')
      .select('*')
      .whereIn(
        'trackId',
        tracks.map(t => t.id),
      );
    return fromPairs(
      copiedTracks.map(x => [x.trackId, x.idOfTrackInSourceDatabase]),
    );
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
