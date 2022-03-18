import { Except, Opaque, SetRequired } from 'type-fest';

export interface Information {
  id: number;
  uuid: string;
  schemaVersionMajor: number;
  schemaVersionMinor: number;
  schemaVersionPatch: number;
}

export interface Playlist {
  id: number;
  title: string;
  path: string;
}

export interface PlaylistInput {
  title: string;
  parentListId?: number;
  tracks: Track[];
}

export interface Track {
  id: number;
  album?: string;
  artist?: string;
  bitrate: number;
  bpmAnalyzed?: number;
  comment?: string;
  composer?: string;
  dateAdded?: number;
  dateCreated?: number;
  filename: string;
  fileBytes: number;
  fileType: string;
  genre?: string;
  isBeatGridLocked?: boolean;
  key?: CamelotKeyId;
  label?: string;
  length: number;
  path: string;
  playOrder?: number;
  rating?: number;
  remixer?: string;
  timeLastPlayed?: number;
  title?: string;
  year?: number;
}

export type UpdateTrackInput = Except<
  SetRequired<Partial<Track>, 'id'>,
  | 'bitrate'
  | 'bpmAnalyzed'
  | 'dateAdded'
  | 'dateCreated'
  | 'fileType'
  | 'isBeatGridLocked'
  | 'key'
  | 'length'
  | 'timeLastPlayed'
>;

export type CamelotKeyId = Opaque<'CamelotKeyId', number>;
