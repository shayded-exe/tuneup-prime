import { camelCase, groupBy, transform } from 'lodash';

import { asyncSeries } from '../../utils';
import { EngineDB } from '../engine-db';
import * as publicSchema from '../public-schema';
import { EngineVersion } from '../version-detection';
import * as schema from './schema-1_6';

export class EngineDB_1_6 extends EngineDB {
  get version(): EngineVersion {
    return EngineVersion.V1_6;
  }

  static async connect(dbPath: string): Promise<EngineDB_1_6> {
    const db = new EngineDB_1_6(dbPath);
    await db.init();

    return db;
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
            databaseUuid: this.uuid,
          })),
        );
      }

      return playlist!;
    });
  }

  async getTracks(): Promise<publicSchema.Track[]> {
    const tracks = await this.getTracksInternal();

    return tracks.map(track => ({
      ...track,
      ...track.meta,
      isBeatGridLocked: !!track.isBeatGridLocked,
    }));
  }

  private async getTracksInternal(): Promise<schema.TrackWithMeta[]> {
    const tracks = await this.table('Track')
      .select([
        'id',
        'bitrate',
        'bpmAnalyzed',
        'filename',
        'isBeatGridLocked',
        'isExternalTrack',
        'length',
        'path',
        'trackType',
        'year',
      ])
      .whereNotNull('path')
      .andWhere('isExternalTrack', 0);
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

function getMetaValue(
  meta: schema.MetaData | schema.MetaDataInteger,
): string | number {
  return isTextMeta(meta) ? meta.text : meta.value;
}

function isTextMeta(
  meta: schema.MetaData | schema.MetaDataInteger,
): meta is schema.MetaData {
  return 'text' in meta;
}
