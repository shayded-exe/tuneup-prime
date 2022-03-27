import { Except, Merge, Opaque, SetRequired } from 'type-fest';

import { SQLITE_SEQUENCE } from './sqlite-types';

export interface Tables {
  SQLITE_SEQUENCE: SQLITE_SEQUENCE;
  Information: Information;
  Playlist: Playlist;
  PlaylistEntity: PlaylistEntity;
  Track: RawTrack;
}

export type TableNames = keyof Tables;

export interface Information {
  id: number;
  uuid: string;
  schemaVersionMajor: number;
  schemaVersionMinor: number;
  schemaVersionPatch: number;
}

export interface PlaylistInput {
  title: string;
  parentListId?: number;
  tracks: Track[];
}

export interface Playlist {
  id: number;
  title: string;
  parentListId: number;
  nextListId: number;
  isPersisted: boolean;
  lastEditTime: string;
  isExplicitlyExported: boolean;
}

export type NewPlaylist = Except<Playlist, 'id'>;

export interface PlaylistEntity {
  id: number;
  listId: number;
  trackId: number;
  nextEntityId: number;
  membershipReference: number;
  databaseUuid: string;
}

export type NewPlaylistEntity = Except<PlaylistEntity, 'id'>;

// Non-exhaustive. We don't need everything.
export interface RawTrack {
  id: number;
  absolutePath?: string;
  album?: string;
  artist?: string;
  bitrate: number;
  bpmAnalyzed?: number;
  comment?: string;
  composer?: string;
  dateAdded: number;
  dateCreated: number;
  explicitLyrics: boolean;
  filename: string;
  fileBytes: number;
  fileType: string;
  genre?: string;
  isAnalyzed: boolean;
  key?: CamelotKeyId;
  label?: string;
  length: number;
  originDatabaseUuid: string;
  originTrackId: number;
  path: string;
  playOrder: number;
  rating: number;
  remixer?: string;
  thirdPartySourceId?: number;
  timeLastPlayed?: number;
  title: string;
  year?: number;
  // Performance data
  beatData?: Uint8Array;
  quickCues?: Uint8Array;
  loops?: Uint8Array;
}

export type Track = Merge<
  RawTrack,
  {
    beatData?: BeatData;
    quickCues?: HotCue[];
    loops?: Loop[];
  }
>;

export type CamelotKeyId = Opaque<'CamelotKeyId', number>;

export interface BeatData {
  sampleRate: number;
  sampleCount: number;
  markers: BeatGridMarker[];
}

export interface BeatGridMarker {
  sample: number;
  beatIndex: number;
  beatsToNextMarker: number;
}

export interface HotCue {
  index: number;
  name: string;
  sample: number;
  color: CueColor;
}

export interface Loop {
  index: number;
  name: string;
  startSample: number;
  endSample: number;
  color: CueColor;
}

export interface CueColor {
  red: number;
  green: number;
  blue: number;
}

export type UpdateTrackInput = Except<
  SetRequired<Partial<Track>, 'id'>,
  | 'bitrate'
  | 'bpmAnalyzed'
  | 'dateAdded'
  | 'dateCreated'
  | 'fileType'
  | 'key'
  | 'length'
  | 'timeLastPlayed'
  | 'beatData'
  | 'quickCues'
  | 'loops'
>;
