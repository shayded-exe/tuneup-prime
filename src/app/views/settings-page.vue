<template>
  <div>
    <div class="label">
      Engine library folder
    </div>
    <div class="is-flex">
      <b-field class="is-flex-grow-1">
        <b-input v-model="libraryFolder"></b-input>
      </b-field>
      <b-button
        @click="browseLibraryFolder()"
        icon-left="folder-open"
        class="ml-3"
        >browse</b-button
      >
    </div>

    <article v-if="isValid" class="message is-success">
      <div class="message-body">
        Detected Engine version {{ libraryInfo.version }}
      </div>
    </article>
    <div v-if="!isValid" class="message is-danger">
      <div class="message-body">
        {{ libraryError }}
      </div>
    </div>

    <div class="level">
      <div class="level-left"></div>
      <div class="level-right">
        <div class="level-item">
          <b-button @click="cancel()" icon-left="times">cancel</b-button>
        </div>
        <div class="level-item">
          <b-button
            @click="save()"
            type="is-primary"
            icon-left="save"
            class="enjinn-button"
            :disabled="!isValid"
            >save</b-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { appStore, AppStoreKey } from '@/store';
import { Component, Vue } from 'vue-property-decorator';
import { checkPathExists, checkPathIsDir } from '@/app/utils';
import path from 'path';
import * as engine from '@/app/engine';
import { remote } from 'electron';

@Component<SettingsPage>({
  watch: {
    async libraryFolder(value: string) {
      await this.updateLibrary(value);
    },
  },
})
export default class SettingsPage extends Vue {
  libraryFolder: string | null = null;

  libraryError = '';
  libraryInfo: engine.LibraryInfo | null = null;

  get isValid() {
    return this.libraryInfo;
  }

  mounted() {
    this.libraryFolder = appStore().get(AppStoreKey.EngineLibraryFolder);
  }

  async browseLibraryFolder() {
    const { filePaths } = await remote.dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (filePaths.length) {
      this.libraryFolder = filePaths[0];
    }
  }

  cancel() {
    this.goHome();
  }

  save() {
    appStore().set(AppStoreKey.EngineLibraryFolder, this.libraryFolder);
    this.goHome();
  }

  private goHome() {
    this.$router.push('/');
  }

  private async updateLibrary(value: string) {
    const info = await validateLibraryFolder(value);
    if (typeof info === 'string') {
      this.libraryError = info;
      this.libraryInfo = null;
    } else {
      this.libraryError = '';
      this.libraryInfo = info;
    }
  }
}

async function validateLibraryFolder(
  folder: string,
): Promise<engine.LibraryInfo | string> {
  if (!(await checkPathExists(folder))) {
    return `Path doesn't exist`;
  }
  if (!(await checkPathIsDir(folder))) {
    return `Path isn't a folder`;
  }
  if (!path.isAbsolute(folder)) {
    return 'Path must be absolute';
  }

  try {
    return await engine.getLibraryInfo(folder);
  } catch {
    return `Path isn't an Engine library`;
  }
}
</script>
