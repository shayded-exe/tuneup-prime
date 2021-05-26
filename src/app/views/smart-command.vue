<template>
  <div class="is-flex is-flex-direction-column">
    <command-header title="Smart playlists" class="mb-6">
      <div class="level-item">
        <b-tooltip
          :label="libraryConfigPath"
          type="is-info"
          position="is-left"
          class="big-text"
        >
          <b-button @click="reloadConfig()" type="is-info is-outlined">
            reload config
          </b-button>
        </b-tooltip>
      </div>

      <div class="level-item">
        <b-button
          :disabled="!canGenerate"
          :loading="isGenerating"
          @click="generateSmartPlaylists()"
          type="is-primary"
          class="enjinn-button"
        >
          generate
        </b-button>
      </div>
    </command-header>

    <div v-if="smartPlaylists" class="smart-playlists-section">
      <p class="title is-6 px-4">
        <span v-if="!wasGenerated">
          The following smart playlists will be generated
        </span>
        <span v-else>
          Generated {{ smartPlaylists.length }} smart playlists
        </span>
      </p>

      <div class="list px-4">
        <div
          v-for="playlist of smartPlaylists"
          :key="playlist.name"
          class="list-item mb-4"
        >
          <div class="is-flex is-justify-content-space-between pl-4">
            <span class="has-text-weight-bold is-size-5 py-1">
              {{ playlist.name }}
            </span>

            <b-taglist
              v-if="playlist.wasGenerated"
              attached
              class="block-taglist"
            >
              <b-tag type="is-dark" size="is-medium" class="block-tag">
                tracks
              </b-tag>
              <b-tag type="is-success" size="is-medium" class="block-tag">
                {{ playlist.tracks.length }}
              </b-tag>
            </b-taglist>
          </div>

          <p class="rules px-4 py-2 is-family-code">
            {{ formatRuleGroup(playlist.rules) }}
          </p>
        </div>
      </div>
    </div>
    <div v-else-if="libraryConfigReadError" class="message is-danger">
      <div class="message-body">
        {{ libraryConfigReadError }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.smart-playlists-section {
  min-height: 0;
  display: flex;
  flex-direction: column;

  .list {
    min-height: 0;
    overflow: auto;

    .list-item {
      .rules {
        background-color: $grey-dark;
      }
    }
  }
}
</style>

<script lang="ts">
import BaseCommand from '@/app/components/base-command';
import CommandHeader from '@/app/components/command-header.vue';
import * as engine from '@/app/engine';
import { asyncSeries } from '@/app/utils';
import { cloneDeep, every, some } from 'lodash';
import { Component } from 'vue-property-decorator';
import def = engine.config;

interface ActiveSmartPlaylist extends def.SmartPlaylist {
  wasGenerated?: boolean;
  tracks?: engine.Track[];
}

@Component({
  components: { CommandHeader },
})
export default class SmartCommand extends BaseCommand {
  smartPlaylists: ActiveSmartPlaylist[] | null = null;
  isGenerating = false;
  generateError = '';

  get canGenerate() {
    return !!this.smartPlaylists && !this.isGenerating;
  }

  get wasGenerated() {
    return !!this.smartPlaylists?.some(p => p.wasGenerated);
  }

  get smartPlaylistNames() {
    return this.smartPlaylists?.map(p => p.name);
  }

  async mounted() {
    await this.reloadConfig();
  }

  async reloadConfig() {
    await this.readLibraryConfig();

    if (this.libraryConfig) {
      this.resetPlaylists();
    }
  }

  private resetPlaylists() {
    this.smartPlaylists = cloneDeep(this.libraryConfig!.smartPlaylists);
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
    if (this.isGenerating) {
      return;
    }

    try {
      this.isGenerating = true;
      this.resetPlaylists();
      await this.connectToEngine();

      await this.generateSmartPlaylistsInternal();

      this.generateError = '';
    } catch (e) {
      this.generateError = e.message;
    } finally {
      await this.disconnectFromEngine();
      this.isGenerating = false;
    }
  }

  private async generateSmartPlaylistsInternal() {
    const tracks = await this.engineDb!.getTracks();
    this.smartPlaylists!.forEach(playlist => {
      playlist.tracks = filterTracks({
        tracks,
        playlistConfig: playlist,
      });
    });

    await asyncSeries(
      this.smartPlaylists!.map(playlist => async () => {
        await this.engineDb!.createOrUpdatePlaylist({
          title: playlist.name,
          tracks: playlist.tracks!,
        });
        playlist.wasGenerated = true;
      }),
    );
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
