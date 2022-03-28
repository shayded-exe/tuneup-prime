import * as schema from './schema';

export type PlaylistNode = PlaylistFolder | schema.Playlist;

export interface PlaylistFolder extends schema.Playlist {
  children: PlaylistNode[];
}
