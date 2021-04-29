import * as engine from '../engine';
import { Track } from '../engine';
import { asyncSeries } from '../utils';
import {
  SmartPlaylistConfig,
  SmartPlaylistConfigFile,
  StringFilterOperator,
} from './definitions';
import { getTrackColumnName } from './mapping';

export interface SmartPlaylistOutput {
  playlist: engine.Playlist;
  tracks: engine.Track[];
}

export async function buildSmartPlaylists({
  config,
  engineDb,
}: {
  config: SmartPlaylistConfigFile;
  engineDb: engine.EngineDB;
}): Promise<SmartPlaylistOutput[]> {
  const { uuid: databaseUuid } = await engineDb.getSchemaInfo();
  const playlists = await engineDb.getPlaylists();
  const tracks = await engineDb.getTracks();

  const inputs = config.smartPlaylists.map<engine.PlaylistInput>(
    playlistConfig => ({
      title: playlistConfig.name,
      parentListId: 0,
      nextListId: 0,
      tracks: filterTracks({ tracks, playlistConfig }),
      databaseUuid,
    }),
  );

  return asyncSeries<SmartPlaylistOutput>(
    inputs.map(input => async () => ({
      playlist: await engineDb.createPlaylist(input),
      tracks: input.tracks,
    })),
  );
}

function filterTracks({
  tracks,
  playlistConfig,
}: {
  tracks: Track[];
  playlistConfig: SmartPlaylistConfig;
}) {
  return tracks.filter(track => {
    return playlistConfig.rules.every(rule => {
      let trackValue = track[getTrackColumnName(rule.field)] as string;
      trackValue ??= '';
      let ruleValue = rule.value;

      if (!rule.caseSensitive && rule.operator !== StringFilterOperator.Regex) {
        trackValue = trackValue.toLocaleLowerCase();
        ruleValue = ruleValue.toLocaleLowerCase();
      }

      switch (rule.operator) {
        case StringFilterOperator.Equals:
          return trackValue === ruleValue;
        case StringFilterOperator.NotEqual:
          return trackValue !== ruleValue;
        case StringFilterOperator.Contains:
          return trackValue.includes(ruleValue);
        case StringFilterOperator.Excludes:
          return !trackValue.includes(ruleValue);
        case StringFilterOperator.Regex:
          return new RegExp(
            ruleValue,
            rule.caseSensitive ? undefined : 'i',
          ).test(trackValue);
      }
    });
  });
}
