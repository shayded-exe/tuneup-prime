import { asyncSeries } from '@/utils';
import { Parser as BinaryParser } from 'binary-parser';
import { Knex } from 'knex';
import { chunk, pick } from 'lodash';
import { inflate } from 'pako';

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
      .select('Playlist.*', 'PlaylistPath.path')
      .where('Playlist.isPersisted', true);
  }

  private async getPlaylistByTitle(
    title: string,
  ): Promise<schema.PlaylistWithPath | undefined> {
    return this.table('Playlist')
      .join<schema.PlaylistPath>(
        'PlaylistPath',
        'Playlist.id',
        '=',
        'PlaylistPath.id',
      )
      .select('Playlist.*', 'PlaylistPath.path')
      .where('Playlist.title', title)
      .andWhere('Playlist.isPersisted', true)
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

          // Re-parent playlist if not at root
          if (
            !!input.parentListId &&
            input.parentListId !== playlist.parentListId
          ) {
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
            await this.table('Playlist', trx).where({ id: playlistId }).update({
              parentListId: input.parentListId,
              nextListId: 0,
            });
          }
        }

        if (input.tracks.length) {
          const trackIds = input.tracks.map(t => t.id);
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
            chunk(newEntities, EngineDB.insertChunkSize).map(
              chunkEntities => async () =>
                this.table('PlaylistEntity', trx).insert(chunkEntities),
            ),
          );
        }

        return playlist!;
      },
    );
  }

  async getTracks(
    opts: {
      withPerformanceData?: boolean;
    } = {},
  ): Promise<publicSchema.Track[]> {
    return this.getTracksInternal(opts);
  }

  private async getTracksInternal({
    withPerformanceData,
  }: {
    withPerformanceData?: boolean;
  }): Promise<schema.Track[]> {
    const keys: (keyof schema.Track)[] = [
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
      'fileBytes',
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
      'playOrder',
      'rating',
      'remixer',
      'thirdPartySourceId',
      'timeLastPlayed',
      'title',
      'year',
    ];

    if (withPerformanceData) {
      keys.push('beatData', 'quickCues', 'loops');
    }

    const tracks = await this.table('Track')
      .select(keys)
      .whereNotNull('path')
      .andWhere('originDatabaseUuid', this.uuid);

    return tracks.map(cookRawTrack);
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

// For best results, heat until internal temperature reaches 165F or crust is golden brown
function cookRawTrack(track: schema.RawTrack): schema.Track {
  const colorParser = new BinaryParser() //
    .uint8('red')
    .uint8('green')
    .uint8('blue');

  function qDecompress(data: Uint8Array): Buffer {
    return Buffer.from(inflate(data.subarray(4)));
  }

  function decodeBeatData(rawData: Uint8Array): schema.BeatData {
    const { numDefaultMarkers, numMarkers, ...beatData } = new BinaryParser()
      .doublebe('sampleRate')
      .uint64be('sampleCount', { formatter: Number })
      .seek(1)
      .uint64be('numDefaultMarkers', { formatter: Number })
      .seek(x => x.numDefaultMarkers * 24)
      .uint64be('numMarkers')
      .array('markers', {
        length: 'numMarkers',
        type: new BinaryParser()
          .doublele('sample')
          .int64le('beatIndex', { formatter: Number })
          .uint32le('beatsToNextMarker'),
      })
      .parse(qDecompress(rawData));

    return beatData;
  }

  function decodeQuickCues(rawData: Uint8Array): schema.HotCue[] {
    const { hotCues }: { hotCues: any[] } = new BinaryParser()
      .uint64be('numHotCues')
      .array('hotCues', {
        length: 'numHotCues',
        type: new BinaryParser()
          .uint8('nameLength')
          .string('name', { length: 'nameLength' })
          .doublebe('sample')
          .seek(1)
          .nest('color', { type: colorParser }),
      })
      .parse(qDecompress(rawData));

    return hotCues
      .map(({ nameLength, ...cue }, i) => ({ index: i, ...cue }))
      .filter(cue => !!cue.name);
  }

  function decodeLoops(rawData: Uint8Array): schema.Loop[] {
    const { loops }: { loops: any[] } = new BinaryParser()
      .uint8('numLoops')
      .seek(7)
      .array('loops', {
        length: 'numLoops',
        type: new BinaryParser()
          .uint8('nameLength')
          .string('name', { length: 'nameLength' })
          .doublele('startSample')
          .doublele('endSample')
          .seek(3)
          .nest('color', { type: colorParser }),
      })
      .parse(rawData);

    return loops
      .map(({ nameLength, ...loop }, i) => ({ index: i, ...loop }))
      .filter(loop => !!loop.name);
  }

  return {
    ...track,
    beatData: track.beatData && decodeBeatData(track.beatData),
    quickCues: track.quickCues && decodeQuickCues(track.quickCues),
    loops: track.loops && decodeLoops(track.loops),
  };
}
