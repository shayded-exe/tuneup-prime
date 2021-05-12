import { Opaque } from 'type-fest';

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
  tracks: (number | Track)[];
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
  fileType?: string;
  genre?: string;
  isBeatGridLocked: boolean;
  key?: CamelotKeyId;
  label?: string;
  length: number;
  path: string;
  rating?: number;
  remixer?: string;
  timeLastPlayed?: number;
  title?: string;
  year?: number;
}

export type CamelotKeyId = Opaque<'CamelotKeyId', number>;
