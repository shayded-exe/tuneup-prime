import { Except } from 'type-fest';

declare module 'knex/types/tables' {
  interface Tables {
    Information: Information;
    Playlist: Playlist;
    PlaylistEntity: PlaylistEntity;
    Track: Track;
    SQLITE_SEQUENCE: SQLITE_SEQUENCE;
  }
}

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
  parentListId: number;
  nextListId: number;
  isPersisted: boolean;
  lastEditTime: string;
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
  isMetadataImported: boolean;
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

export interface SQLITE_SEQUENCE {
  name: string;
  seq: number;
}
