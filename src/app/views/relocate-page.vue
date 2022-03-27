<template>
  <div class="is-flex is-flex-direction-column">
    <command-header title="Relocate tracks" :homeDisabled="isProcessing">
      <div class="level-item">
        <b-button
          :disabled="!canFind"
          :loading="isFinding"
          @click="findMissingTracks()"
          type="is-light is-outlined"
          icon-left="search"
        >
          find missing
        </b-button>
      </div>

      <div class="level-item">
        <b-button
          :disabled="!canRelocate"
          :loading="isRelocating"
          @click="relocateTracks()"
          type="is-primary"
        >
          relocate
        </b-button>
      </div>
    </command-header>

    <template v-if="tracks">
      <p class="title is-5 mb-4">
        <span v-if="!didRelocate">
          Found {{ tracks.length }} missing tracks
        </span>
        <span v-else>
          Relocated {{ numRelocated }} / {{ tracks.length }} missing tracks
        </span>
      </p>

      <div class="tracks pr-4">
        <div
          v-for="track of tracks"
          :key="track.data.id"
          class="track mb-2"
          :class="{ 'was-relocated': track.wasRelocated }"
        >
          <p class="py-1">{{ track.data.artist }} - {{ track.data.title }}</p>

          <div class="paths px-4 py-2 is-family-code">
            <div class="is-flex is-justify-content-space-between">
              <p class="old-path has-text-danger">{{ track.oldPath }}</p>

              <p
                v-if="!track.wasRelocated"
                @click="relocateSingleTrack(track)"
                class="link-text has-text-link"
              >
                select file
              </p>
            </div>
            <p v-if="track.wasRelocated" class="has-text-link">
              {{ track.newPath }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <error-message :message="error"></error-message>
  </div>
</template>

<style lang="scss" scoped>
.tracks {
  min-height: 0;
  overflow: auto;

  .track {
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
import { BaseCommand, CommandHeader, ErrorMessage } from '@/app/components';
import * as engine from '@/app/engine';
import {
  checkPathExists,
  getFilesInDir,
  makePathUnix,
  resolvePathToBaseIfRelative,
} from '@/utils';
import { remote } from 'electron';
import { uniq } from 'lodash';
import * as musicmeta from 'music-metadata';
import path from 'path';
import { Component } from 'vue-property-decorator';

interface RelocatableTrack {
  data: engine.Track;
  wasRelocated: boolean;
  ext: string;
  oldPath: string;
  newPath: string | null;
}

@Component({
  components: { CommandHeader, ErrorMessage },
})
export default class RelocatePage extends BaseCommand {
  tracks: RelocatableTrack[] | null = null;

  isFinding = false;

  isRelocating = false;
  didRelocate = false;

  error = '';

  get canFind(): boolean {
    return !this.isProcessing;
  }

  get canRelocate(): boolean {
    return !this.isProcessing && !!this.numMissing;
  }

  get numTracks(): number | undefined {
    return this.tracks?.length;
  }

  get numMissing(): number | undefined {
    return this.tracks?.filter(x => !x.wasRelocated).length;
  }

  get numRelocated(): number | undefined {
    return this.tracks?.filter(x => x.wasRelocated).length;
  }

  get isProcessing(): boolean {
    return this.isFinding || this.isRelocating;
  }

  async findMissingTracks() {
    if (this.isFinding) {
      return;
    }

    try {
      this.isFinding = true;
      this.didRelocate = false;
      this.tracks = null;
      await this.connectToEngine();

      this.tracks = await this.findMissingTracksInternal();

      this.error = '';
    } catch (e) {
      this.tracks = null;
      this.error = e.message;
    } finally {
      await this.disconnectFromEngine();
      this.isFinding = false;
    }
  }

  private async findMissingTracksInternal(): Promise<RelocatableTrack[]> {
    const tracks = await this.engineDb!.getTracks();
    const missing: RelocatableTrack[] = [];

    for (const track of tracks) {
      if (!(await checkPathExists(track.absolutePath))) {
        const parsedPath = path.parse(track.path);
        missing.push({
          data: track,
          wasRelocated: false,
          ext: parsedPath.ext,
          oldPath: track.path,
          newPath: null,
        });
      }
    }

    return missing;
  }

  async relocateSingleTrack(track: RelocatableTrack) {
    if (this.isRelocating) {
      return;
    }

    try {
      this.isRelocating = true;
      this.error = '';

      const filterExt = track.ext.slice(1);
      const filePath = await remote.dialog
        .showOpenDialog({
          properties: ['openFile'],
          filters: [
            {
              name: `${filterExt} files`,
              extensions: [filterExt],
            },
          ],
        })
        .then(x => x.filePaths[0]);
      if (!filePath) {
        return;
      }

      await this.connectToEngine();

      this.setNewTrackPath(track, filePath);
      await this.updateTracks([track]);
    } catch (e) {
      this.error = e.message;
    } finally {
      await this.disconnectFromEngine();
      this.isRelocating = false;
      this.didRelocate = true;
    }
  }

  async relocateTracks() {
    if (this.isRelocating) {
      return;
    }

    try {
      this.isRelocating = true;
      this.error = '';

      const searchFolder = await remote.dialog
        .showOpenDialog({
          properties: ['openDirectory'],
        })
        .then(x => x.filePaths[0]);
      if (!searchFolder) {
        return;
      }

      await this.connectToEngine();

      await this.relocateTracksInternal({
        tracks: this.tracks!,
        searchFolder,
      });
    } catch (e) {
      this.error = e.message;
    } finally {
      await this.disconnectFromEngine();
      this.isRelocating = false;
      this.didRelocate = true;
    }

    if (!this.numRelocated) {
      this.$buefy.notification.open({
        message: `Didn't find any of your tracks`,
        type: 'is-danger',
        position: 'is-bottom-right',
        duration: 5000,
      });
    } else if (this.numRelocated !== this.numTracks) {
      this.$buefy.notification.open({
        message: `Relocated ${this.numRelocated} / ${this.numTracks} tracks`,
        type: 'is-warning',
        position: 'is-bottom-right',
        duration: 5000,
      });
    } else {
      this.$buefy.notification.open({
        message: `Relocated ${this.numRelocated} tracks`,
        type: 'is-success',
        position: 'is-bottom-right',
        duration: 5000,
      });
    }
  }

  private async relocateTracksInternal({
    tracks,
    searchFolder,
  }: {
    tracks: RelocatableTrack[];
    searchFolder: string;
  }) {
    const searchFiles = await getFilesInDir({
      path: searchFolder,
      extensions: uniq(tracks.map(x => x.ext)),
      maxDepth: 10,
    });
    // Keyed by filename
    const searchFileMap = new Map(searchFiles.map(x => [x.name, x]));

    // Keyed by path
    const metaCache = new Map<string, musicmeta.IAudioMetadata>();

    async function findTrackViaMeta(
      track: RelocatableTrack,
    ): Promise<string | undefined> {
      async function getTrackMeta(
        path: string,
      ): Promise<musicmeta.IAudioMetadata | undefined> {
        let meta = metaCache.get(path);

        if (meta) {
          return meta;
        }

        try {
          meta = await musicmeta.parseFile(path, { skipCovers: true });
          metaCache.set(path, meta);

          return meta;
        } catch {
          return;
        }
      }

      for (const file of searchFileMap.values()) {
        if (file.ext !== track.ext) {
          continue;
        }

        const meta = await getTrackMeta(file.path);
        if (!meta) {
          continue;
        }

        if (
          meta.common.title === track.data.title &&
          meta.common.artist === track.data.artist &&
          meta.common.album === track.data.album
        ) {
          return file.path;
        }
      }

      return;
    }

    for (const track of tracks) {
      let foundPath = searchFileMap.get(track.data.filename)?.path;
      if (!foundPath) {
        foundPath = await findTrackViaMeta(track);
      }
      if (!foundPath) {
        track.wasRelocated = false;
        return;
      }

      this.setNewTrackPath(track, foundPath);
    }

    await this.updateTracks(tracks);
  }

  private setNewTrackPath(track: RelocatableTrack, newPath: string) {
    // Paths are unix style regardless of OS
    track.newPath = track.data.path = makePathUnix(
      path.relative(this.libraryFolder, newPath),
    );
    track.wasRelocated = true;
  }

  private async updateTracks(tracks: RelocatableTrack[]) {
    await this.engineDb!.updateTracks(
      tracks.map(({ data }) => ({
        id: data.id,
        path: data.path,
      })),
    );
  }
}
</script>
