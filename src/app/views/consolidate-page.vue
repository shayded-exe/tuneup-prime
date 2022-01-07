<template>
  <div class="is-flex is-flex-direction-column">
    <command-header
      title="Consolidate library"
      :homeDisabled="isProcessing"
    ></command-header>

    <div class="is-flex is-flex-direction-column is-align-items-center mt-6">
      <p class="is-size-5 has-text-centered mb-4">
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
          Existing files with the same name will be
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
    </div>

    <error-message :message="error"></error-message>

    <b-modal v-model="didConsolidate" has-modal-card>
      <div class="modal-card card is-align-items-center py-6">
        <div class="block">
          {{ didCopy ? 'Copied' : 'Moved' }} {{ numConsolidated }} /
          {{ numTracks }} tracks to
          <a @click="openTargetFolder()" class="link-text">
            {{ targetFolder }}
          </a>
        </div>

        <div v-if="numAlreadyConsolidated" class="block">
          <span class="has-text-info">
            {{ numAlreadyConsolidated }} tracks were already in the target
            folder
          </span>
        </div>

        <div v-if="numMissing">
          <span class="has-text-warning">
            {{ numMissing }} tracks were not found
          </span>
          <br />
          Use
          <a @click="$router.push('relocate')" class="link-text">relocate</a>
          to fix this
        </div>

        <b-button
          @click="didConsolidate = false"
          type="is-primary"
          class="mt-6"
        >
          ok
        </b-button>
      </div>
    </b-modal>
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
import ErrorMessage from '@/app/components/error-message.vue';
import * as engine from '@/app/engine';
import * as ipc from '@/app/ipc';
import { checkPathExists, makePathUnix } from '@/utils';
import { remote } from 'electron';
import fse from 'fs-extra';
import path from 'path';
import { Component } from 'vue-property-decorator';

interface ConsolidatableTrack {
  track: engine.Track;
  wasConsolidated: boolean;
  oldPath: string;
  newPath: string;
}

@Component({
  components: { CommandHeader, ErrorMessage },
})
export default class ConsolidatePage extends BaseCommand {
  shouldCopy = false;
  didCopy = false;

  isConsolidating = false;
  didConsolidate = false;

  targetFolder = '';

  allTracks: engine.Track[] = [];
  foundTracks: ConsolidatableTrack[] = [];
  alreadyConsolidatedTracks: engine.Track[] = [];
  missingTracks: engine.Track[] = [];

  error = '';

  get canConsolidate(): boolean {
    return !this.isConsolidating;
  }

  get isProcessing(): boolean {
    return this.isConsolidating;
  }

  get numTracks(): number {
    return this.allTracks.length;
  }

  get consolidatedTracks(): ConsolidatableTrack[] {
    return this.foundTracks.filter(x => x.wasConsolidated);
  }

  get numConsolidated(): number {
    return this.consolidatedTracks.length;
  }

  get numAlreadyConsolidated(): number {
    return this.alreadyConsolidatedTracks.length;
  }

  get numMissing(): number {
    return this.missingTracks.length;
  }

  async consolidateLibrary() {
    if (this.isConsolidating) {
      return;
    }

    try {
      this.isConsolidating = true;
      this.error = '';
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
      this.error = e.message;
    } finally {
      await this.disconnectFromEngine();
      this.isConsolidating = false;
    }
  }

  private async consolidateLibraryInternal() {
    const findTracks = async () => {
      this.allTracks = await this.engineDb!.getTracks();
      this.foundTracks = [];
      this.alreadyConsolidatedTracks = [];
      this.missingTracks = [];

      for (const track of this.allTracks) {
        const resolvedPath = path.resolve(this.libraryFolder, track.path);
        const newPath = path.resolve(this.targetFolder, track.filename);

        if (resolvedPath === newPath) {
          this.alreadyConsolidatedTracks.push(track);
        } else if (!(await checkPathExists(resolvedPath))) {
          this.missingTracks.push(track);
        } else {
          this.foundTracks.push({
            track,
            wasConsolidated: false,
            oldPath: resolvedPath,
            newPath,
          });
        }
      }
    };

    const processFile = async (from: string, to: string, copy?: boolean) => {
      if (copy) {
        await fse.copyFile(from, to);
      } else {
        await fse.move(from, to);
      }
    };

    await findTracks();

    for (const item of this.foundTracks) {
      await processFile(item.oldPath, item.newPath, this.shouldCopy);
      item.wasConsolidated = true;
    }

    await this.engineDb!.updateTracks(
      this.foundTracks
        .filter(x => x.wasConsolidated)
        .map(({ track, newPath }) => ({
          id: track.id,
          path: makePathUnix(path.relative(this.libraryFolder, newPath)),
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
