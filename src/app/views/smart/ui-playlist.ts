import * as engine from '@/app/engine';

import def = engine.config;

export type UIPlaylistNode = UIPlaylistFolder | UIPlaylist;

export interface UIPlaylistFolder extends def.PlaylistFolder {
  id?: number;
  children: UIPlaylistNode[];
}

export interface UIPlaylist extends def.Playlist {
  wasGenerated?: boolean;
  tracks?: engine.Track[];
  formattedRules?: string;
}

export function isUIPlaylistNodeFolder(
  node: UIPlaylistNode,
): node is UIPlaylistFolder {
  return def.isPlaylistNodeFolder(node);
}
