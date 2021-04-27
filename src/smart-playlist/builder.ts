import * as engine from '../engine';
import { SmartPlaylistConfig } from './definitions';

export async function buildSmartPlaylists({
  config,
  engineDb,
}: {
  config: SmartPlaylistConfig;
  engineDb: engine.EngineDB;
}) {
  const playlists = await engineDb.getPlaylists();
  const tracks = await engineDb.getTracks();

  config.smartPlaylists.forEach(playlistConfig => {
    const newPlaylist: engine.NewPlaylist = {
      title: playlistConfig.name,
      parentListId: 0,
      nextListId: 0,
      isPersisted: true,
      lastEditTime: engine.formatDate(new Date()),
    };
  });

  const updatedPlaylists = await engineDb.getPlaylists();
  console.log(updatedPlaylists);
}
