declare module 'knex/types/tables' {
  interface Tables {
    Playlist: Playlist;
    PlaylistEntity: PlaylistEntity;
    Track: Track;
  }
}

export interface Playlist {
  id: number;
  title: string;
  parentListId: number;
  isPersisted: boolean;
  nextListId: number;
  lastEditTime: string;
}

export interface PlaylistEntity {
  id: number;
  listId: number;
  trackId: number;
  databaseUuid: string;
  nextEntityId: number;
  membershipReference: number;
}

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
