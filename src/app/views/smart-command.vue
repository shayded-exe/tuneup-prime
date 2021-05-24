<template>
  <div class="is-flex is-flex-direction-column">
    <div class="level">
      <div class="level-left">
        <div class="level-item">
          <h1 class="title">
            Smart playlists
          </h1>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <b-button @click="readLibraryConfig()" type="is-info is-outlined">
            reload config
          </b-button>
        </div>

        <div class="level-item">
          <b-button
            :disabled="!canGenerate"
            @click="generateSmartPlaylists()"
            type="is-primary"
            class="enjinn-button"
          >
            generate
          </b-button>
        </div>
      </div>
    </div>

    <p class="title is-6">
      The following smart playlists will be generated
    </p>

    <div v-if="libraryConfigReadError" class="message is-danger">
      <div class="message-body">
        {{ libraryConfigReadError }}
      </div>
    </div>

    <div v-if="smartPlaylists" class="table-wrapper">
      <b-table
        :data="smartPlaylists"
        :columns="smartPlaylistColumns"
        :show-header="false"
        detailed
        detail-key="name"
        :show-detail-icon="false"
        :opened-detailed="smartPlaylistNames"
        class="no-border"
      >
        <template #detail="props">
          {{ formatRuleGroup(props.row.rules) }}
        </template>
      </b-table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-wrapper {
  margin-top: -12px;
}
</style>

<script lang="ts">
import BaseCommand from '@/app/components/base-command';
import * as engine from '@/app/engine';
import { every, some } from 'lodash';
import { Component } from 'vue-property-decorator';
import def = engine.config;

@Component({})
export default class SmartCommand extends BaseCommand {
  readonly smartPlaylistColumns = [
    {
      field: 'name',
      label: 'Name',
    },
  ];

  get canGenerate() {
    return !!this.smartPlaylists;
  }

  get smartPlaylists() {
    return this.libraryConfig?.smartPlaylists;
  }

  get smartPlaylistNames() {
    return this.smartPlaylists?.map(p => p.name);
  }

  async mounted() {
    await this.readLibraryConfig();
  }

  formatRuleGroup(group: def.PlaylistRuleGroup): string {
    const formatRuleNode = (node: def.PlaylistRuleNode): string => {
      if (isNodeGroup(node)) {
        return `(${this.formatRuleGroup(node)})`;
      }
      return [node.field, node.operator, node.value].join(' ');
    };

    const { type, nodes } = normalizeRuleGroup(group);

    return nodes.map(formatRuleNode).join(` ${type} `);
  }

  async generateSmartPlaylists() {
    await this.connectToEngine();
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

interface NormalizedRuleGroup {
  type: 'AND' | 'OR';
  nodes: def.PlaylistRuleNode[];
}

function normalizeRuleGroup(group: def.PlaylistRuleGroup): NormalizedRuleGroup {
  function isAndRuleGroup(
    group: def.PlaylistRuleGroup,
  ): group is def.PlaylistRuleAndGroup {
    return 'and' in group;
  }

  return isAndRuleGroup(group)
    ? { type: 'AND', nodes: group.and }
    : { type: 'OR', nodes: group.or };
}

function applyRuleGroup(
  track: engine.Track,
  group: def.PlaylistRuleGroup,
): boolean {
  const { type, nodes } = normalizeRuleGroup(group);

  const results = nodes.map(n => applyRuleNode(track, n));
  const operator = type === 'AND' ? every : some;

  return operator(results);
}

function isNodeGroup(
  node: def.PlaylistRuleNode,
): node is def.PlaylistRuleGroup {
  return 'and' in node || 'or' in node;
}

function applyRuleNode(
  track: engine.Track,
  node: def.PlaylistRuleNode,
): boolean {
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
</script>
