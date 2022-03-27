<template>
  <div class="is-flex is-flex-direction-column">
    <command-header title="Smart playlists" :homeDisabled="isProcessing">
      <div class="level-item">
        <b-button
          tag="a"
          :href="Links.Examples"
          target="_blank"
          type="is-text"
          icon-left="question"
        >
          examples
        </b-button>
      </div>

      <div class="level-item">
        <b-button
          :disabled="isProcessing"
          @click="editConfig()"
          type="is-light is-outlined"
          icon-left="edit"
        >
          edit
        </b-button>
      </div>

      <div class="level-item">
        <b-button
          :disabled="isProcessing"
          @click="reloadConfig()"
          type="is-light is-outlined"
          icon-left="sync"
        >
          reload
        </b-button>
      </div>

      <div class="level-item">
        <b-button
          :disabled="!canGenerate"
          :loading="isGenerating"
          @click="generatePlaylists()"
          type="is-primary"
        >
          generate
        </b-button>
      </div>
    </command-header>

    <template v-if="playlistNodes">
      <p class="title is-5 mb-4">
        <span v-if="!numGenerated">
          <span v-if="playlistNodes.length">
            The following {{ playlists.length }} smart playlists will be
            generated
          </span>
          <span v-else>No smart playlists defined</span>
        </span>
        <span v-else>Generated {{ numGenerated }} smart playlists</span>
      </p>

      <div class="list pr-4">
        <playlist-node
          v-for="(node, index) of playlistNodes"
          :key="index"
          :node="node"
          class=""
        ></playlist-node>
      </div>
    </template>

    <error-message :message="error"></error-message>
  </div>
</template>

<style lang="scss" scoped>
.list {
  min-height: 0;
  overflow: auto;
}
</style>

<script lang="ts">
import { BaseCommand, CommandHeader, ErrorMessage } from '@/app/components';
import * as engine from '@/app/engine';
import * as ipc from '@/app/ipc';
import Links from '@/links';
import { flatTree, walkTree } from '@/utils';
import { cloneDeep, every, last, some } from 'lodash';
import { Component } from 'vue-property-decorator';
import PlaylistFolder from './playlist-folder.vue';
import PlaylistNode from './playlist-node.vue';
import Playlist from './playlist.vue';
import {
  isUIPlaylistNodeFolder,
  UIPlaylist,
  UIPlaylistFolder,
  UIPlaylistNode,
} from './ui-playlist';
import def = engine.config;

@Component({
  components: {
    CommandHeader,
    ErrorMessage,
    Playlist,
    PlaylistFolder,
    PlaylistNode,
  },
})
export default class SmartPlaylistsPage extends BaseCommand {
  readonly Links = Links;

  playlistNodes: UIPlaylistNode[] | null = null;

  isGenerating = false;

  error = '';

  get isProcessing(): boolean {
    return this.isGenerating;
  }

  get canGenerate(): boolean {
    return !!this.playlistNodes?.length && !this.isProcessing;
  }

  get numGenerated(): number | undefined {
    return this.playlists?.filter(x => x.wasGenerated).length;
  }

  private get playlists(): UIPlaylist[] | null {
    if (!this.playlistNodes) {
      return null;
    }

    return flatTree({
      tree: this.playlistNodes,
      isBranch: isUIPlaylistNodeFolder,
      getChildren: x => x.children,
    }) as UIPlaylist[];
  }

  async created() {
    await this.reloadConfig();
  }

  editConfig() {
    ipc.shell.editFile(this.libraryConfigPath);
  }

  async reloadConfig() {
    try {
      await this.readLibraryConfig();
      this.error = '';
    } catch (e) {
      this.error = e.message;
      this.playlistNodes = null;

      return;
    }

    this.reloadPlaylists();
  }

  private reloadPlaylists() {
    this.playlistNodes = walkTree({
      tree: cloneDeep(this.libraryConfig!.smartPlaylists),
      isBranch: isUIPlaylistNodeFolder,
      getChildren: folder => folder.children,
      walkLeaf: (playlist: UIPlaylist) => {
        playlist.wasGenerated = false;
        playlist.formattedRules = formatRuleGroup(playlist.rules);
      },
    });
  }

  async generatePlaylists() {
    if (this.isGenerating) {
      return;
    }

    try {
      this.isGenerating = true;
      this.reloadPlaylists();
      await this.connectToEngine();

      await this.generatePlaylistsInternal();

      this.error = '';
    } catch (e) {
      this.error = e.message;
    } finally {
      await this.disconnectFromEngine();
      this.isGenerating = false;
    }
  }

  private async generatePlaylistsInternal() {
    const tracks = await this.engineDb!.getTracks();

    const createPlaylistFolder = async (
      folder: UIPlaylistFolder,
      parents?: UIPlaylistFolder[],
    ) => {
      const { id } = await this.engineDb!.createOrUpdatePlaylist({
        title: folder.name,
        parentListId: last(parents)?.id,
        tracks: [],
      });

      folder.id = id;

      await createNodes(folder.children, [...(parents ?? []), folder]);
    };

    const createPlaylist = async (
      playlist: UIPlaylist,
      parents?: UIPlaylistFolder[],
    ) => {
      playlist.tracks = filterTracks({ tracks, playlist });

      await this.engineDb!.createOrUpdatePlaylist({
        title: playlist.name,
        parentListId: last(parents)?.id,
        tracks: playlist.tracks,
      });

      playlist.wasGenerated = true;
    };

    const createNode = async (
      node: UIPlaylistNode,
      parents?: UIPlaylistFolder[],
    ) => {
      await (def.isPlaylistNodeFolder(node)
        ? createPlaylistFolder(node, parents)
        : createPlaylist(node, parents));
    };

    const createNodes = async (
      nodes: UIPlaylistNode[],
      parents?: UIPlaylistFolder[],
    ) => {
      for (const node of nodes) {
        await createNode(node, parents);
      }
    };

    await createNodes(this.playlistNodes!);
  }
}

function filterTracks({
  tracks,
  playlist,
}: {
  tracks: engine.Track[];
  playlist: def.Playlist;
}) {
  return tracks.filter(track => applyRuleGroup(track, playlist.rules));
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

function formatRuleGroup(group: def.PlaylistRuleGroup): string {
  function formatRuleNode(node: def.PlaylistRuleNode): string {
    if (isNodeGroup(node)) {
      return `(${formatRuleGroup(node)})`;
    }
    const rule = normalizeRule(node);
    return [rule.field, rule.operator, rule.value].join(' ');
  }

  const { type, nodes } = normalizeRuleGroup(group);

  return nodes.map(formatRuleNode).join(` ${type} `);
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

type NormalizedPlaylistRule =
  | def.StringPlaylistRuleObject
  | def.NumericPlaylistRuleObject;

function normalizeRule(rule: def.PlaylistRule): NormalizedPlaylistRule {
  if (!Array.isArray(rule)) {
    return rule;
  }

  const [field, operator, value, opts] = rule;

  return {
    field,
    operator,
    value,
    ...opts,
  } as NormalizedPlaylistRule;
}

function applyRule(track: engine.Track, rule: def.PlaylistRule): boolean {
  function isStringRule(
    rule: NormalizedPlaylistRule,
  ): rule is def.StringPlaylistRuleObject {
    return Object.values(def.StringFilterField).includes(rule.field as any);
  }

  function applyStringRule(rule: def.StringPlaylistRuleObject): boolean {
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

  function applyNumericRule(rule: def.NumericPlaylistRuleObject): boolean {
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

  const normalizedRule = normalizeRule(rule);

  return isStringRule(normalizedRule)
    ? applyStringRule(normalizedRule)
    : applyNumericRule(normalizedRule);
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
