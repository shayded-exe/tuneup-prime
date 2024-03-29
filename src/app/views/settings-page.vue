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
        type="is-info is-outlined"
        icon-left="folder-open"
        class="ml-3"
      >
        browse
      </b-button>
    </div>

    <div v-if="isValid" class="message is-success">
      <div class="message-body">
        Detected Engine version {{ libraryInfo.version }}
      </div>
    </div>

    <error-message :message="error"></error-message>

    <div class="level">
      <div class="level-left"></div>
      <div class="level-right">
        <div class="level-item">
          <b-button
            @click="cancel()"
            type="is-light is-outlined"
            icon-left="times"
          >
            cancel
          </b-button>
        </div>
        <div class="level-item">
          <b-button
            :disabled="!isValid"
            @click="save()"
            type="is-primary"
            icon-left="save"
          >
            save
          </b-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ErrorMessage from '@/app/components/error-message.vue';
import * as engine from '@/app/engine';
import { appStore, AppStoreKey } from '@/store';
import { checkPathExists, checkPathIsDir } from '@/utils';
import { remote } from 'electron';
import path from 'path';
import { Component, Vue, Watch } from 'vue-property-decorator';

@Component({
  components: { ErrorMessage },
})
export default class SettingsPage extends Vue {
  libraryFolder: string | null = null;
  libraryInfo: engine.LibraryInfo | null = null;

  error = '';

  get isValid() {
    return this.libraryInfo;
  }

  mounted() {
    this.libraryFolder =
      appStore().get(AppStoreKey.EngineLibraryFolder) ?? null;
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

  @Watch('libraryFolder')
  async updateLibrary(value?: string) {
    const info = await validateLibraryFolder(value);
    if (typeof info === 'string') {
      this.error = info;
      this.libraryInfo = null;
      return;
    }

    this.error = '';
    this.libraryInfo = info;
    await engine.config.createDefaultIfNotFound(info.folder);
  }
}

async function validateLibraryFolder(
  folder?: string,
): Promise<engine.LibraryInfo | string> {
  if (!folder) {
    return 'Please specify your Engine library folder';
  }
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
