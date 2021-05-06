import { flags } from '@oclif/command';
import chalk from 'chalk';
import { every, some } from 'lodash';

import { BaseEngineCommand } from '../base-commands';
import * as engine from '../engine';
import { LibraryConfigFile, readLibraryConfig } from '../library-config';
import * as def from '../library-config/smart-playlist';
import { asyncSeries, spinner } from '../utils';

export default class Smart extends BaseEngineCommand {
  static readonly description = 'generate smart playlists';

  static readonly flags = {
    help: flags.help({ char: 'h' }),
  };

  private libraryConfig!: LibraryConfigFile;

  private get smartPlaylists(): def.SmartPlaylist[] {
    return this.libraryConfig.smartPlaylists;
  }

  async run() {
    await this.connectToEngine();
    this.libraryConfig = await readLibraryConfig(this.libraryFolder);

    if (this.smartPlaylists.some(x => x.sources)) {
      this.warn('"sources" filter not yet supported; ignoring...');
    }

    const inputs = await spinner({
      text: 'Build smart playlists',
      run: async ctx => {
        const tracks = await this.engineDb.getTracks();
        const inputs = this.smartPlaylists.map<engine.PlaylistInput>(
          playlistConfig => ({
            title: playlistConfig.name,
            tracks: filterTracks({ tracks, playlistConfig }),
          }),
        );

        const numEmpty = inputs.filter(x => !x.tracks.length).length;
        if (numEmpty) {
          ctx.warn(
            chalk`Built {blue ${inputs.length.toString()}} smart playlists, but {yellow ${numEmpty.toString()}} didn't match any tracks`,
          );
        } else {
          ctx.succeed(
            chalk`Built {blue ${inputs.length.toString()}} smart playlists`,
          );
        }
        inputs.forEach(({ title, tracks }) => {
          if (tracks.length) {
            this.log(
              chalk`    {blue ${title}} [{green ${tracks.length.toString()}} tracks]`,
            );
          } else {
            this.log(chalk`    {blue ${title}} [{yellow 0} tracks]`);
          }
        });

        return inputs;
      },
    });

    await spinner({
      text: 'Save smart playlists to Engine',
      run: async () =>
        asyncSeries(
          inputs.map(input => async () =>
            this.engineDb.createOrUpdatePlaylist(input),
          ),
        ),
    });
  }
}

function filterTracks({
  tracks,
  playlistConfig,
}: {
  tracks: engine.Track[];
  playlistConfig: def.SmartPlaylist;
}) {
  return tracks.filter(track => applyRuleGroup(track, playlistConfig.rules));
}

function applyRuleGroup(
  track: engine.Track,
  group: def.PlaylistRuleGroup,
): boolean {
  function isAndRuleGroup(
    group: def.PlaylistRuleGroup,
  ): group is def.PlaylistRuleAndGroup {
    return 'and' in group;
  }

  interface NormalizedRuleGroup {
    type: '&&' | '||';
    nodes: def.PlaylistRuleNode[];
  }

  function normalizeRuleGroup(
    group: def.PlaylistRuleGroup,
  ): NormalizedRuleGroup {
    return isAndRuleGroup(group)
      ? { type: '&&', nodes: group.and }
      : { type: '||', nodes: group.or };
  }

  const { type, nodes } = normalizeRuleGroup(group);

  const results = nodes.map(n => applyRuleNode(track, n));
  const operator = type === '&&' ? every : some;

  return operator(results);
}

function applyRuleNode(
  track: engine.Track,
  node: def.PlaylistRuleNode,
): boolean {
  function isNodeGroup(
    node: def.PlaylistRuleNode,
  ): node is def.PlaylistRuleGroup {
    return 'and' in node || 'or' in node;
  }

  return isNodeGroup(node)
    ? applyRuleGroup(track, node)
    : applyRule(track, node);
}

function applyRule(track: engine.Track, rule: def.PlaylistRule): boolean {
  function isStringRule(
    rule: def.PlaylistRule,
  ): rule is def.StringPlaylistRule {
    return Object.values(def.StringFilterField).includes(rule.field as any);
  }

  function applyStringRule(rule: def.StringPlaylistRule): boolean {
    let trackValue = getTrackValue(track, rule.field) ?? '';
    let ruleValue = rule.value;

    if (
      !rule.caseSensitive &&
      rule.operator !== def.StringFilterOperator.Regex
    ) {
      trackValue = trackValue.toLocaleLowerCase();
      ruleValue = ruleValue.toLocaleLowerCase();
    }

    switch (rule.operator) {
      case def.StringFilterOperator.Equals:
        return trackValue === ruleValue;
      case def.StringFilterOperator.NotEqual:
        return trackValue !== ruleValue;
      case def.StringFilterOperator.Contains:
        return trackValue.includes(ruleValue);
      case def.StringFilterOperator.Excludes:
        return !trackValue.includes(ruleValue);
      case def.StringFilterOperator.Regex:
        return new RegExp(ruleValue, rule.caseSensitive ? undefined : 'i').test(
          trackValue,
        );
    }
  }

  function applyNumericRule(rule: def.NumericPlaylistRule): boolean {
    const trackValue = getTrackValue(track, rule.field) ?? 0;
    const ruleValue = rule.value;

    switch (rule.operator) {
      case def.NumericFilterOperator.Equals:
        return trackValue === ruleValue;
      case def.NumericFilterOperator.NotEqual:
        return trackValue !== ruleValue;
      case def.NumericFilterOperator.GreaterThan:
        return trackValue > ruleValue;
      case def.NumericFilterOperator.GreaterThanEquals:
        return trackValue >= ruleValue;
      case def.NumericFilterOperator.LessThan:
        return trackValue < ruleValue;
      case def.NumericFilterOperator.LessThanEquals:
        return trackValue <= ruleValue;
    }
  }

  return isStringRule(rule) ? applyStringRule(rule) : applyNumericRule(rule);
}

function getTrackValue(
  track: engine.Track,
  field: def.StringFilterField,
): string | undefined;
function getTrackValue(
  track: engine.Track,
  field: def.NumericFilterField,
): number | undefined;
function getTrackValue(
  track: engine.Track,
  field: def.FilterField,
): string | number | undefined {
  function getTrackField() {
    switch (field) {
      case def.NumericFilterField.Bpm:
        return 'bpmAnalyzed';
      default:
        return field;
    }
  }

  return track[getTrackField()];
}
