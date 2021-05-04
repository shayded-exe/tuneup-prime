import { every, some } from 'lodash';

import * as engine from '../../engine';
import { LibraryConfigFile } from '../../library-config';
import { asyncSeries } from '../../utils';
import {
  FilterField,
  NumericFilterField,
  NumericFilterOperator,
  NumericPlaylistRule,
  PlaylistRule,
  PlaylistRuleAndGroup,
  PlaylistRuleGroup,
  PlaylistRuleNode,
  SmartPlaylist,
  StringFilterField,
  StringFilterOperator,
  StringPlaylistRule,
} from './definitions';

export async function buildSmartPlaylists({
  config,
  engineDb,
}: {
  config: LibraryConfigFile;
  engineDb: engine.EngineDB;
}): Promise<engine.PlaylistWithTracks[]> {
  const tracks = await engineDb.getTracks();

  if (config.smartPlaylists.some(x => x.sources)) {
    console.warn('"sources" filter not yet supported; ignoring...');
  }

  const inputs = config.smartPlaylists.map<engine.PlaylistInput>(
    playlistConfig => ({
      title: playlistConfig.name,
      tracks: filterTracks({ tracks, playlistConfig }),
    }),
  );

  return asyncSeries<engine.PlaylistWithTracks>(
    inputs.map(input => async () => ({
      ...(await engineDb.createOrUpdatePlaylist(input)),
      tracks: input.tracks,
    })),
  );
}

function filterTracks({
  tracks,
  playlistConfig,
}: {
  tracks: engine.Track[];
  playlistConfig: SmartPlaylist;
}) {
  return tracks.filter(track => applyRuleGroup(track, playlistConfig.rules));
}

function applyRuleGroup(
  track: engine.Track,
  group: PlaylistRuleGroup,
): boolean {
  const { type, nodes } = normalizeRuleGroup(group);

  const results = nodes.map(n => applyRuleNode(track, n));
  const operator = type === '&&' ? every : some;

  return operator(results);
}

function applyRuleNode(track: engine.Track, node: PlaylistRuleNode): boolean {
  function isNodeGroup(node: PlaylistRuleNode): node is PlaylistRuleGroup {
    return 'and' in node || 'or' in node;
  }

  return isNodeGroup(node)
    ? applyRuleGroup(track, node)
    : applyRule(track, node);
}

function applyRule(track: engine.Track, rule: PlaylistRule): boolean {
  function isStringRule(rule: PlaylistRule): rule is StringPlaylistRule {
    return Object.values(StringFilterField).includes(rule.field as any);
  }

  function applyStringRule(rule: StringPlaylistRule): boolean {
    let trackValue = getTrackValue(track, rule.field) ?? '';
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
        return new RegExp(ruleValue, rule.caseSensitive ? undefined : 'i').test(
          trackValue,
        );
    }
  }

  function applyNumericRule(rule: NumericPlaylistRule): boolean {
    const trackValue = getTrackValue(track, rule.field) ?? 0;
    const ruleValue = rule.value;

    switch (rule.operator) {
      case NumericFilterOperator.Equals:
        return trackValue === ruleValue;
      case NumericFilterOperator.NotEqual:
        return trackValue !== ruleValue;
      case NumericFilterOperator.GreaterThan:
        return trackValue > ruleValue;
      case NumericFilterOperator.GreaterThanEquals:
        return trackValue >= ruleValue;
      case NumericFilterOperator.LessThan:
        return trackValue < ruleValue;
      case NumericFilterOperator.LessThanEquals:
        return trackValue <= ruleValue;
    }
  }

  return isStringRule(rule) ? applyStringRule(rule) : applyNumericRule(rule);
}

interface NormalizedRuleGroup {
  type: '&&' | '||';
  nodes: PlaylistRuleNode[];
}

function normalizeRuleGroup(group: PlaylistRuleGroup): NormalizedRuleGroup {
  function isAndRuleGroup(
    group: PlaylistRuleGroup,
  ): group is PlaylistRuleAndGroup {
    return 'and' in group;
  }

  return isAndRuleGroup(group)
    ? { type: '&&', nodes: group.and }
    : { type: '||', nodes: group.or };
}

function getTrackValue(
  track: engine.Track,
  field: StringFilterField,
): string | undefined;
function getTrackValue(
  track: engine.Track,
  field: NumericFilterField,
): number | undefined;
function getTrackValue(
  track: engine.Track,
  field: FilterField,
): string | number | undefined {
  function getTrackField() {
    switch (field) {
      case NumericFilterField.Bpm:
        return 'bpmAnalyzed';
      default:
        return field;
    }
  }

  return track[getTrackField()];
}
