import * as engine from '../../engine';
import { asyncSeries } from '../../utils';
import {
  FilterField,
  NumberFilterField,
  SmartPlaylistConfig,
  SmartPlaylistConfigFile,
  StringFilterOperator,
} from './definitions';

export async function buildSmartPlaylists({
  config,
  engineDb,
}: {
  config: SmartPlaylistConfigFile;
  engineDb: engine.EngineDB;
}): Promise<engine.PlaylistWithTracks[]> {
  const tracks = await engineDb.getTracks();

  const inputs = config.smartPlaylists.map<engine.PlaylistInput>(
    playlistConfig => ({
      title: playlistConfig.name,
      tracks: filterTracks({ tracks, playlistConfig }),
    }),
  );

  return asyncSeries<engine.PlaylistWithTracks>(
    inputs.map(input => async () => ({
      ...(await engineDb.createPlaylist(input)),
      tracks: input.tracks,
    })),
  );
}

function filterTracks({
  tracks,
  playlistConfig,
}: {
  tracks: engine.Track[];
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

export function getTrackColumnName(
  filterField: FilterField,
): keyof engine.Track {
  switch (filterField) {
    case NumberFilterField.Bpm:
      return 'bpmAnalyzed';
  }

  return filterField;
}
