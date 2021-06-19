<template>
  <div class="is-flex is-flex-direction-column">
    <command-header
      title="Consolidate library"
      :homeDisabled="isProcessing"
    ></command-header>

    <div class="is-flex is-flex-direction-column is-align-items-center mt-6">
      <p class="title is-5 has-text-centered mb-4">
        Consolidate will
        <span class="operation-text">{{ shouldCopy ? 'copy' : 'move' }}</span>
        all your tracks into the folder you select
        <br />
        and update their paths in Engine
      </p>

      <p class="is-italic is-flex is-align-items-center mb-6">
        <b-icon
          class="mr-2"
          pack="em"
          icon="em-warning"
          size="is-small"
        ></b-icon>

        <span>
          Existing files will be
          <strong>overwritten</strong>
        </span>
      </p>

      <b-field class="mb-5">
        <b-switch :disabled="isProcessing" v-model="shouldCopy">
          Copy files instead of moving
        </b-switch>
      </b-field>

      <b-button
        :disabled="!canConsolidate"
        :loading="isConsolidating"
        @click="consolidateLibrary()"
        type="is-primary"
      >
        consolidate
      </b-button>

      <div v-if="didConsolidate" class="block mt-6">
        {{ didCopy ? 'Copied' : 'Moved' }} {{ numConsolidated }} /
        {{ numTracks }} tracks to
        <a @click="openTargetFolder()" class="has-text-link">
          {{ targetFolder }}
        </a>
      </div>

      <p v-if="numMissing">
        <span class="has-text-warning">
          {{ numMissing }} tracks were not found
        </span>
        <br />
        Use
        <a @click="$router.push('relocate')" class="link-text">relocate</a>
        to fix this
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.operation-text {
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
</style>

<script lang="ts">
import BaseCommand from '@/app/components/base-command';
import CommandHeader from '@/app/components/command-header.vue';
import * as engine from '@/app/engine';
import { checkPathExists, makePathUnix } from '@/utils';
import { remote } from 'electron';
import { Component } from 'vue-property-decorator';
import fse from 'fs-extra';
import path from 'path';
import * as ipc from '@/app/ipc';

interface ConsolidatableTrack {
  track: engine.Track;
  wasConsolidated: boolean;
  oldPath: string;
}

@Component({
  components: { CommandHeader },
})
export default class ConsolidateCommand extends BaseCommand {
  shouldCopy = false;
  didCopy = false;

  isConsolidating = false;
  consolidateError = '';
  didConsolidate = false;

  targetFolder = '';

  allTracks: engine.Track[] | null = null;
  foundTracks: ConsolidatableTrack[] | null = null;

  get canConsolidate(): boolean {
    return !this.isConsolidating;
  }

  get isProcessing(): boolean {
    return this.isConsolidating;
  }

  get numTracks(): number | undefined {
    return this.allTracks?.length;
  }

  get consolidatedTracks(): ConsolidatableTrack[] | undefined {
    return this.foundTracks?.filter(x => x.wasConsolidated);
  }

  get numConsolidated(): number | undefined {
    return this.consolidatedTracks?.length;
  }

  get numMissing(): number | undefined {
    if (!this.didConsolidate) {
      return 0;
    }
    return this.allTracks!.length - this.foundTracks!.length;
  }

  async consolidateLibrary() {
    if (this.isConsolidating) {
      return;
    }

    try {
      this.isConsolidating = true;
      this.consolidateError = '';
      this.didConsolidate = false;

      this.targetFolder = await remote.dialog
        .showOpenDialog({
          properties: ['openDirectory'],
        })
        .then(x => x.filePaths[0]);
      if (!this.targetFolder) {
        return;
      }

      await this.connectToEngine();

      await this.consolidateLibraryInternal();
      this.didConsolidate = true;
      this.didCopy = this.shouldCopy;
    } catch (e) {
      this.consolidateError = e.message;
    } finally {
      await this.disconnectFromEngine();
      this.isConsolidating = false;
    }
  }

  private async consolidateLibraryInternal() {
    const findTracks = async () => {
      const tracks = await this.engineDb!.getTracks();
      const found: ConsolidatableTrack[] = [];

      for (const track of tracks) {
        const resolvedPath = path.resolve(this.libraryFolder, track.path);
        if (await checkPathExists(resolvedPath)) {
          found.push({
            track,
            wasConsolidated: false,
            oldPath: resolvedPath,
          });
        }
      }

      return { tracks, found };
    };

    async function processFile(from: string, to: string, copy?: boolean) {
      if (copy) {
        await fse.copyFile(from, to);
      } else {
        await fse.move(from, to);
      }
    }

    const { tracks, found } = await findTracks();
    this.allTracks = tracks;
    this.foundTracks = found;

    for (const item of found) {
      const targetPath = path.resolve(this.targetFolder, item.track.filename);
      item.track.path = makePathUnix(
        path.relative(this.libraryFolder, targetPath),
      );
      // no overwrite
      // if (path.normalize(item.oldPath) === path.normalize(item.track.path)) {
      //   continue;
      // }

      await processFile(item.oldPath, targetPath, this.shouldCopy);
      item.wasConsolidated = true;
    }

    await this.engineDb!.updateTracks(
      found
        .filter(x => x.wasConsolidated)
        .map(({ track }) => ({
          id: track.id,
          path: track.path,
        })),
    );
  }

  openTargetFolder() {
    if (this.targetFolder) {
      ipc.shell.openFolder(this.targetFolder);
    }
  }
}
</script>
