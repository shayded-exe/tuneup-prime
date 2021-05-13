import { Except } from 'type-fest';

import * as publicSchema from '../public-schema';
import { SQLITE_SEQUENCE } from '../sqlite-types';

export interface Tables {
  SQLITE_SEQUENCE: SQLITE_SEQUENCE;
  Information: publicSchema.Information;
  Playlist: Playlist;
  PlaylistPath: PlaylistPath;
  PlaylistEntity: PlaylistEntity;
  Track: Track;
}

export type TableNames = keyof Tables;

export interface Playlist {
  id: number;
  title: string;
  parentListId: number;
  nextListId: number;
  isPersisted: boolean;
  lastEditTime: string;
}

export type NewPlaylist = Except<Playlist, 'id'>;

export interface PlaylistWithPath extends Playlist {
  path: string;
}

export interface PlaylistPath {
  id: number;
  path: string;
  position: number;
}

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
export interface Track {
  id: number;
  album: string;
  artist: string;
  bitrate: number;
  bpmAnalyzed: number;
  comment: string;
  composer: string;
  dateAdded: number;
  dateCreated: number;
  explicitLyrics: boolean;
  filename: string;
  fileType: string;
  genre: string;
  isAnalyzed: boolean;
  isBeatGridLocked?: boolean;
  isMetadataImported: boolean;
  key?: publicSchema.CamelotKeyId;
  label: string;
  length: number;
  originDatabaseUuid: string;
  path: string;
  rating: number;
  remixer: string;
  thirdPartySourceId: number;
  timeLastPlayed: number;
  title: string;
  year: number;
}
