<template>
  <div class="is-flex is-flex-direction-column">
    <command-header title="Relocate tracks" class="mb-6">
      <div class="level-item">
        <b-button
          :loading="isFinding"
          @click="findMissingTracks()"
          type="is-info is-outlined"
        >
          find missing tracks
        </b-button>
      </div>

      <div class="level-item">
        <b-button
          :disabled="!canRelocate"
          :loading="isRelocating"
          @click="relocateMissingTracks()"
          type="is-primary"
          class="enjinn-button"
        >
          relocate
        </b-button>
      </div>
    </command-header>

    <template v-if="tracks">
      <p class="title is-5 px-4">
        <span v-if="!numRelocated">
          Found {{ tracks.length }} missing tracks
        </span>
        <span v-else>
          Relocated {{ numRelocated }} / {{ tracks.length }} missing tracks
        </span>
      </p>

      <div class="list px-4">
        <div
          v-for="item of tracks"
          :key="item.track.id"
          class="list-item mb-4"
          :class="{ 'was-relocated': item.wasRelocated }"
        >
          <p class="is-size-5 py-1">
            {{ item.track.filename }}
          </p>

          <div class="paths px-4 py-2 is-family-code">
            <p class="old-path has-text-danger">{{ item.oldPathDir }}</p>
            <p v-if="item.wasRelocated" class="has-text-link">
              {{ item.newPathDir }}
            </p>
          </div>
        </div>
      </div>
    </template>
    <div v-else-if="findError" class="message is-danger">
      <div class="message-body">
        {{ findError }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list {
  min-height: 0;
  overflow: auto;

  .list-item {
    .paths {
      background-color: $grey-dark;
    }

    &.was-relocated {
      .old-path {
        text-decoration: line-through;
      }
    }
  }
}
</style>

<script lang="ts">
import BaseCommand from '@/app/components/base-command';
import CommandHeader from '@/app/components/command-header.vue';
import * as engine from '@/app/engine';
import { checkPathExists, getFilesInDir } from '@/app/utils';
import { remote } from 'electron';
import { keyBy } from 'lodash';
import path from 'path';
import { Component } from 'vue-property-decorator';

interface RelocatableTrack {
  track: engine.Track;
  wasRelocated: boolean;
  oldPathDir: string;
  newPathDir: string | null;
}

@Component<RelocateCommand>({
  components: { CommandHeader },
})
export default class RelocateCommand extends BaseCommand {
  tracks: RelocatableTrack[] | null = null;

  isFinding = false;
  findError = '';

  isRelocating = false;
  relocateError = '';

  get canFindMissingTracks() {
    return !this.isProcessing;
  }

  get canRelocate() {
    return !this.isProcessing && this.tracks?.some(x => !x.wasRelocated);
  }

  get numRelocated() {
    return this.tracks?.filter(x => x.wasRelocated).length;
  }

  get isProcessing() {
    return this.isFinding || this.isRelocating;
  }

  async findMissingTracks() {
    if (this.isFinding) {
      return;
    }

    try {
      this.isFinding = true;
      this.tracks = null;
      await this.connectToEngine();

      this.tracks = await this.findMissingTracksInternal();

      this.findError = '';
    } catch (e) {
      this.tracks = null;
      this.findError = e.message;
    } finally {
      await this.disconnectFromEngine();
      this.isFinding = false;
    }
  }

  private async findMissingTracksInternal(): Promise<RelocatableTrack[]> {
    const tracks = await this.engineDb!.getTracks();
    const missing: RelocatableTrack[] = [];

    for (const track of tracks) {
      const resolvedPath = path.isAbsolute(track.path)
        ? track.path
        : path.resolve(this.libraryFolder, track.path);
      if (!(await checkPathExists(resolvedPath))) {
        missing.push({
          track,
          wasRelocated: false,
          oldPathDir: path.parse(track.path).dir,
          newPathDir: null,
        });
      }
    }

    return missing;
  }

  async relocateMissingTracks() {
    if (this.isRelocating) {
      return;
    }

    const searchFolder = await remote.dialog
      .showOpenDialog({
        properties: ['openDirectory'],
      })
      .then(x => x.filePaths[0]);

    if (!searchFolder) {
      return;
    }

    try {
      this.isRelocating = true;
      await this.connectToEngine();

      await this.relocateTracks({
        tracks: this.tracks!,
        searchFolder,
      });

      this.relocateError = '';
    } catch (e) {
      this.relocateError = e.message;
    } finally {
      await this.disconnectFromEngine();
      this.isRelocating = false;
    }
  }

  private async relocateTracks({
    tracks,
    searchFolder,
  }: {
    tracks: RelocatableTrack[];
    searchFolder: string;
  }) {
    const searchFiles = await getFilesInDir({
      path: searchFolder,
      maxDepth: 5,
    });
    const searchFileMap = keyBy(searchFiles, x => x.name);

    tracks.forEach(item => {
      const newPath = searchFileMap[item.track.filename];
      if (!newPath) {
        item.wasRelocated = false;
        return;
      }

      // Paths are unix style regardless of OS
      item.track.path = path
        .relative(this.libraryFolder, newPath.path)
        .replace(/\\/g, '/');
      item.newPathDir = path.parse(item.track.path).dir;
      item.wasRelocated = true;
    });

    await this.engineDb!.updateTracks(
      tracks.map(({ track }) => ({
        id: track.id,
        path: track.path,
      })),
    );
  }
}
</script>
