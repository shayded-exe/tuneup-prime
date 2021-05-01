import { camelCase, groupBy, transform } from 'lodash';

import { EngineDB } from '../engine-db';
import * as publicSchema from '../public-schema';
import * as schema from './schema-1_6';

export class EngineDB_1_6 extends EngineDB {
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

  async createPlaylist(
    input: publicSchema.PlaylistInput,
  ): Promise<publicSchema.Playlist> {
    return this.createPlaylistInternal(input);
  }

  private async createPlaylistInternal(
    input: publicSchema.PlaylistInput,
  ): Promise<schema.List> {
    return this.knex.transaction(
      async (trx): Promise<schema.List> => {
        const { maxId } = (await trx<schema.List>('List')
          .max('id', { as: 'maxId' })
          .first())!;
        const newPlaylist: schema.NewList = {
          id: +maxId + 1,
          title: input.title,
          type: schema.ListType.Playlist,
          path: `${input.title};`,
          isFolder: 0,
          isExplicitlyExported: 1,
        };
        await trx<schema.List>('List').insert(newPlaylist);
        await trx<schema.ListParentList>('ListParentList').insert({
          listOriginId: newPlaylist.id,
          listOriginType: newPlaylist.type,
          listParentId: newPlaylist.id,
          listParentType: newPlaylist.type,
        });

        await trx<schema.ListTrackList>('ListTrackList').insert(
          input.tracks.map<schema.NewListTrackList>((track, i) => ({
            listId: newPlaylist.id,
            listType: schema.ListType.Playlist,
            trackId: track.id,
            trackIdInOriginDatabase: track.id,
            trackNumber: i + 1,
            databaseUuid: this.databaseUuid,
          })),
        );

        const playlist = await trx<schema.List>('Playlist')
          .select('*')
          .where('id', newPlaylist.id)
          .first();

        return playlist!;
      },
    );
  }

  async getTracks(): Promise<publicSchema.Track[]> {
    const tracks = await this.getTracksInternal();

    return tracks.map(track => ({ ...track, ...track.meta }));
  }

  private async getTracksInternal(): Promise<schema.TrackWithMeta[]> {
    const tracks = await this.table('Track').select([
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
    ]);
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
