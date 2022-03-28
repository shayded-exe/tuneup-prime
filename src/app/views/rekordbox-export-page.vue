<template>
  <div class="is-flex is-flex-direction-column">
    <command-header
      title="Rekordbox export"
      :homeDisabled="isProcessing"
    ></command-header>

    <div class="label">Rekordbox XML file</div>
    <div class="is-flex">
      <b-field class="is-flex-grow-1">
        <b-input v-model="rekordboxXmlPath" readonly></b-input>
      </b-field>
      <b-button
        :disabled="isProcessing"
        @click="browseRekordboxXml()"
        type="is-info is-outlined"
        icon-left="folder-open"
        class="ml-3"
      >
        select file
      </b-button>
    </div>

    <div class="is-flex is-flex-direction-column is-align-items-center mt-4">
      <b-button
        :disabled="isExporting"
        :loading="isExporting"
        @click="startExport()"
        type="is-primary"
        class="export-button"
      >
        export
      </b-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.export-button {
  padding-left: 2em;
  padding-right: 2em;
}
</style>

<script lang="ts">
import { BaseCommand, CommandHeader, ErrorMessage } from '@/app/components';
import { appStore, AppStoreKey } from '@/store';
import { remote } from 'electron';
import { Component } from 'vue-property-decorator';
import * as engine from '@/app/engine';
import * as rekordbox from '@/app/rekordbox';

@Component({
  components: {
    CommandHeader,
    ErrorMessage,
  },
})
export default class RekordboxExportPage extends BaseCommand {
  rekordboxXmlPath: string = '';

  isExporting = false;

  get isProcessing(): boolean {
    return this.isExporting;
  }

  created() {
    this.rekordboxXmlPath = appStore().get(AppStoreKey.RekordboxXmlPath);
  }

  async browseRekordboxXml() {
    const { filePath } = await remote.dialog.showSaveDialog({
      defaultPath: this.rekordboxXmlPath,
      filters: [{ name: 'Rekordbox XML Files', extensions: ['xml'] }],
    });
    if (filePath) {
      this.rekordboxXmlPath = filePath;
      appStore().set(AppStoreKey.RekordboxXmlPath, filePath);
    }
  }

  async startExport() {
    if (this.isExporting) {
      return;
    }

    try {
      this.isExporting = true;

      await this.connectToEngine();
      await this.exportInternal();
    } catch (e) {
      console.error(e);
    } finally {
      await this.disconnectFromEngine();
      this.isExporting = false;
    }
  }

  private async exportInternal() {
    const playlists = await this.engineDb!.getPlaylistsWithTracks({
      withPerformanceData: true,
    });
    await rekordbox.exportXml({
      filePath: this.rekordboxXmlPath,
      playlists,
    });
  }
}
</script>
