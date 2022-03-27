import { resolvePathToBaseIfRelative } from '@/utils';
import { Parser as BinaryParser } from 'binary-parser';
import fs from 'fs';
import knex, { Knex } from 'knex';
import { chunk, clamp, pick } from 'lodash';
import { inflate } from 'pako';

import { getLibraryFolder } from './connect';
import { formatDate } from './format';
import * as schema from './schema';
import { SQLITE_SEQUENCE } from './sqlite-types';

export namespace EngineDB {
  export interface Options {
    dbPath: string;
    skipBackup?: boolean;
  }
}

export class EngineDB {
  static readonly insertChunkSize = 250;

  private readonly dbPath!: string;
  private readonly skipBackup?: boolean;

  private isInitialized = false;

  private knex!: Knex;
  private schemaInfo!: schema.Information;

  get uuid(): string {
    return this.schemaInfo.uuid;
  }

  constructor(opts: EngineDB.Options) {
    Object.assign(this, opts);
  }

  async init() {
    if (this.isInitialized) {
      throw new Error('Already initialized');
    }
    if (!this.skipBackup) {
      await this.backup();
    }

    this.knex = knex({
      client: 'sqlite3',
      connection: { filename: this.dbPath },
      useNullAsDefault: true,
    });

    try {
      this.schemaInfo = await this.getSchemaInfo();
    } catch (e) {
      e.message = `Engine is already running. Please close Engine and try again.\n\n${e.message}`;
      throw e;
    }
    this.isInitialized = true;
    console.debug(`Connected to Engine DB ${this.uuid}`);
  }

  async disconnect() {
    await this.knex.destroy();
    console.debug(`Disconnected from Engine DB ${this.uuid}`);
  }

  async backup() {
    await fs.promises.copyFile(this.dbPath, `${this.dbPath}.bak`);
  }

  private table<T extends schema.TableNames>(table: T, trx?: Knex.Transaction) {
    return (trx ?? this.knex).table<schema.Tables[T]>(table);
  }

  private async getSchemaInfo(): Promise<schema.Information> {
    // Perform in a transaction to force an error if Engine is running
    // TODO: Don't check this if we won't need to write
    const results = await this.knex.transaction(async trx => {
      return trx<schema.Information>('Information') //
        .select('*');
    });

    if (!results.length) {
      throw new Error('EngineDB: Schema info not found');
    }
    if (results.length > 1) {
      throw new Error('EngineDB: Multiple schema info records found');
    }

    return results[0];
  }

  private playlistsQb(trx?: Knex.Transaction) {
    return this.table('Playlist', trx) //
      .select('*')
      .where({ isPersisted: true });
  }

  async getPlaylists(): Promise<schema.Playlist[]> {
    return this.playlistsQb();
  }

  private async getPlaylistByProps(
    props: Partial<schema.Playlist>,
    trx?: Knex.Transaction,
  ): Promise<schema.Playlist | undefined> {
    return this.playlistsQb(trx) //
      .andWhere(props)
      .first();
  }

  async createOrUpdatePlaylist(
    input: schema.PlaylistInput,
  ): Promise<schema.Playlist> {
    let playlist = await this.getPlaylistByProps({ title: input.title });
    let playlistId: number | undefined;

    return this.knex.transaction(async (trx): Promise<schema.Playlist> => {
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
        [playlistId!] = await this.table('Playlist', trx).insert(newPlaylist);
        playlist = (await this.getPlaylistByProps({ id: playlistId }, trx))!;
      } else {
        playlistId = playlist.id;

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
          await this.table('Playlist', trx) //
            .where({ id: playlistId })
            .update({
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

        for (const entities of chunk(newEntities, EngineDB.insertChunkSize)) {
          await this.table('PlaylistEntity', trx).insert(entities);
        }
      }

      return playlist;
    });
  }

  async getTracks({
    withPerformanceData,
  }: {
    withPerformanceData?: boolean;
  } = {}): Promise<schema.Track[]> {
    const keys: (keyof schema.RawTrack)[] = [
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
      'isPlayed',
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

  async getPlaylistTracks(id: number): Promise<schema.Track[]> {
    throw new Error('Not implemented');
  }

  async updateTracks(tracks: schema.UpdateTrackInput[]): Promise<void> {
    await this.knex.transaction(async trx => {
      for (const track of tracks) {
        const updateKeys: (keyof schema.UpdateTrackInput)[] = [
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
      }
    });
  }

  private async getLastGeneratedId(
    table: schema.TableNames,
    trx?: Knex.Transaction,
  ): Promise<number> {
    const [id] = await (trx ?? this.knex)<SQLITE_SEQUENCE>('SQLITE_SEQUENCE')
      .pluck('seq')
      .where({ name: table });

    if (!id) {
      throw new Error(`EngineDB: Failed to get last ${table} id`);
    }
    return id;
  }
}

// For best results, heat until internal temperature reaches 165F or crust is golden brown
function cookRawTrack(track: schema.RawTrack): schema.Track {
  return {
    ...track,
    absolutePath: resolvePathToBaseIfRelative({
      path: track.path,
      basePath: getLibraryFolder(),
    }),
    normalizedRating: normalizeRating(track.rating),
    beatData: track.beatData && decodeBeatData(track.beatData),
    quickCues: track.quickCues && decodeQuickCues(track.quickCues),
    loops: track.loops && decodeLoops(track.loops),
  };
}

const colorParser = new BinaryParser()
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
        .uint32le('beatsToNextMarker')
        .seek(4),
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

function normalizeRating(rating: number): number {
  return Math.round(clamp(rating, 0, 100) / 5);
}
