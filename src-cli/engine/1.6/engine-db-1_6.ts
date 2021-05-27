import { Knex } from 'knex';
import {
  chunk,
  Dictionary,
  fromPairs,
  groupBy,
  pick,
  pullAt,
  transform,
} from 'lodash';
import { ConditionalKeys } from 'type-fest';

import { asyncSeries } from '../../utils';
import { EngineDB } from '../engine-db';
import * as publicSchema from '../public-schema';
import { Version } from '../version-detection';
import * as schema from './schema-1_6';

const PLAYLIST_PATH_DELIMITER = ';';

export class EngineDB_1_6 extends EngineDB {
  get version(): Version {
    return Version.V1_6;
  }

  private table<T extends schema.TableNames>(table: T, trx?: Knex.Transaction) {
    let qb = this.knex.table<schema.Tables[T]>(table);
    if (trx) {
      qb = qb.transacting(trx);
    }
    return qb;
  }

  getPlaylists(): Promise<publicSchema.Playlist[]> {
    return this.getPlaylistsInternal();
  }

  private async getPlaylistsInternal(): Promise<schema.List[]> {
    return this.table('List') //
      .select('*')
      .where('isFolder', 0);
  }

  private async getPlaylistById(
    id: number,
    trx?: Knex.Transaction,
  ): Promise<schema.List | undefined> {
    return this.table('List', trx) //
      .select('*')
      .where('id', id)
      .first();
  }

  private async getPlaylistByTitle(
    title: string,
    trx?: Knex.Transaction,
  ): Promise<schema.List | undefined> {
    return this.table('List', trx) //
      .select('*')
      .where('title', title)
      .first();
  }

  private async getPlaylistByPath(
    path: string,
    trx?: Knex.Transaction,
  ): Promise<schema.List | undefined> {
    return this.table('List', trx) //
      .select('*')
      .where('path', path)
      .first();
  }

  async createOrUpdatePlaylist(
    input: schema.PlaylistInput,
  ): Promise<publicSchema.Playlist> {
    return this.createOrUpdatePlaylistInternal(input);
  }

  private async createOrUpdatePlaylistInternal(
    input: schema.PlaylistInput,
  ): Promise<schema.List> {
    let playlist = await this.getPlaylistByTitle(input.title);
    let playlistId = playlist?.id;

    return this.knex.transaction(async (trx): Promise<schema.List> => {
      if (!playlist) {
        playlistId = await this.getNextPlaylistId(trx);

        const newPlaylist: schema.NewList = {
          id: playlistId,
          type: schema.ListType.Playlist,
          title: input.title,
          path: input.path ?? input.title + PLAYLIST_PATH_DELIMITER,
          isFolder: 0,
          isExplicitlyExported: 1,
        };
        await this.table('List', trx).insert(newPlaylist);
        playlist = (await this.getPlaylistById(playlistId, trx))!;

        await this.createPlaylistHierarchy(playlist, trx);
      } else {
        await this.table('ListTrackList', trx)
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
        const newListTracks = trackIds.map<schema.NewListTrackList>(
          (trackId, i) => ({
            listId: playlistId!,
            listType: schema.ListType.Playlist,
            trackId: trackId,
            trackIdInOriginDatabase: trackId,
            trackNumber: i + 1,
            databaseUuid: this.uuid,
          }),
        );

        await asyncSeries(
          chunk(newListTracks, EngineDB.insertChunkSize).map(
            chunkTracks => async () =>
              this.table('ListTrackList', trx).insert(chunkTracks),
          ),
        );
      }

      return playlist!;
    });
  }

  private async createPlaylistHierarchy(
    playlist: schema.List,
    trx?: Knex.Transaction,
  ) {
    const getOrCreatePlaylistFolder = async (
      path: string,
    ): Promise<schema.List> => {
      const existing = await this.getPlaylistByPath(path, trx);
      if (existing) {
        return existing;
      }

      const id = await this.getNextPlaylistId(trx);
      const newFolder: schema.NewList = {
        id,
        type: schema.ListType.Playlist,
        title: playlistPathToTitle(path),
        path,
        isFolder: 1,
        isExplicitlyExported: 1,
      };
      await this.table('List', trx).insert(newFolder);

      return (await this.getPlaylistById(id, trx))!;
    };

    const createListChild = async ({
      list,
      child,
    }: {
      list: schema.List;
      child: schema.List;
    }) => {
      const value: schema.ListHierarchy = {
        listId: list.id,
        listType: list.type,
        listIdChild: child.id,
        listTypeChild: child.type,
      };
      const existing = await this.table('ListHierarchy', trx)
        .where(value)
        .first();

      if (!existing) {
        await this.table('ListHierarchy', trx).insert(value);
      }
    };

    const createListParent = async ({
      list,
      parent,
    }: {
      list: schema.List;
      parent: schema.List;
    }) => {
      const value: schema.ListParentList = {
        listOriginId: list.id,
        listOriginType: list.type,
        listParentId: parent.id,
        listParentType: parent.type,
      };
      const existing = await this.table('ListParentList', trx)
        .where(value)
        .first();

      if (!existing) {
        await this.table('ListParentList', trx).insert(value);
      }
    };

    const paths = destructurePlaylistPath(playlist.path);
    const folderPaths = paths.slice(0, -1);

    const folders = await asyncSeries(
      folderPaths.map(path => async () => {
        const folder = await getOrCreatePlaylistFolder(path);
        if (!folder.isFolder) {
          throw new Error(
            `EngineDB: Can't create playlist as child of non-folder playlist "${path}"`,
          );
        }
        return folder;
      }),
    );

    const lists = [playlist, ...folders];

    await asyncSeries(
      lists.map(list => async () => {
        const children = lists.filter(
          l => l !== list && l.path.startsWith(list.path),
        );
        await asyncSeries(
          children.map(child => async () => createListChild({ list, child })),
        );

        const parentPath = getPlaylistPathParent(list.path);
        const parent = lists.find(l => l.path === parentPath)!;
        await createListParent({ list, parent });
      }),
    );
  }

  private async getNextPlaylistId(trx?: Knex.Transaction): Promise<number> {
    const [{ maxId }] = await this.table('List', trx).max('id', {
      as: 'maxId',
    });

    return +maxId + 1;
  }

  async getTracks(opts?: {
    ids?: number[];
    skipMeta?: boolean;
  }): Promise<publicSchema.Track[]> {
    const tracks = await this.getTracksInternal(opts);

    return tracks.map(track => ({
      ...track,
      ...track.meta,
      isBeatGridLocked: !!track.isBeatGridLocked,
    }));
  }

  private async getTracksInternal({
    ids,
    skipMeta,
  }: {
    ids?: number[];
    skipMeta?: boolean;
  } = {}): Promise<schema.TrackWithMeta[]> {
    const tracks = await (() => {
      let qb = this.table('Track')
        .select('*')
        .whereNotNull('path')
        .andWhere('isExternalTrack', 0);
      if (ids) {
        qb = qb.and.whereIn('id', ids);
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
              const key = schema.MetaDataType[meta.type];
              result[key] = meta.text;
            },
            {} as any,
          ),
          ...transform(
            intMetaMap[track.id] ?? [],
            (result, meta) => {
              const key = schema.MetaDataIntegerType[meta.type];
              result[key] = meta.value;
            },
            {} as any,
          ),
        },
      };
    });
  }

  async getPlaylistTracks(playlistId: number): Promise<publicSchema.Track[]> {
    return this.getTracks({
      ids: await this.table('ListTrackList')
        .pluck('trackId')
        .where('listId', playlistId),
      skipMeta: true,
    });
  }

  async updateTracks(updates: publicSchema.UpdateTrackInput[]) {
    await this.knex.transaction(async trx =>
      asyncSeries(
        updates.map(trackUpdates => async () => {
          const updateKeys: (keyof publicSchema.UpdateTrackInput)[] = [
            'filename',
            'path',
            'year',
          ];
          await this.table('Track', trx)
            .where('id', trackUpdates.id)
            .update(pick(trackUpdates, updateKeys));

          const stringMetaUpdateKeys: ConditionalKeys<
            publicSchema.UpdateTrackInput,
            string | undefined
          >[] = [
            'album',
            'artist',
            'comment',
            'composer',
            'genre',
            'label',
            'title',
          ];

          await asyncSeries(
            stringMetaUpdateKeys
              .filter(key => trackUpdates[key])
              .map(key => async () => {
                const metaType = schema.MetaDataType[key as any];

                await this.table('MetaData', trx)
                  .where('id', trackUpdates.id)
                  .andWhere('type', metaType)
                  .update({ text: trackUpdates[key] });
              }),
          );
        }),
      ),
    );
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

function playlistPathToTitle(path: string): string {
  const parts = path.split(PLAYLIST_PATH_DELIMITER);
  return parts[parts.length - 2];
}

function getPlaylistPathParent(path: string): string {
  const parts = path.split(PLAYLIST_PATH_DELIMITER);
  if (parts.length <= 2) {
    return path;
  }
  pullAt(parts, parts.length - 2);
  return parts.join(PLAYLIST_PATH_DELIMITER);
}

function destructurePlaylistPath(path: string): string[] {
  return path
    .split(PLAYLIST_PATH_DELIMITER)
    .filter(p => p)
    .map(
      (_, i, parts) =>
        parts.slice(0, i + 1).join(PLAYLIST_PATH_DELIMITER) +
        PLAYLIST_PATH_DELIMITER,
    );
}
