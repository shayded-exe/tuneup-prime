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
