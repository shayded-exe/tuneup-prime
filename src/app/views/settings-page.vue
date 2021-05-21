<template>
  <div>
    <b-field label="Engine library folder">
      <b-input v-model="engineLibraryFolder"></b-input>
    </b-field>

    <b-button type="is-primary" icon-left="save" class="enjinn-button"
      >save</b-button
    >
  </div>
</template>

<script lang="ts">
import { appStore, AppStoreKey } from '@/store';
import { Component, Vue } from 'vue-property-decorator';

@Component({})
export default class SettingsPage extends Vue {
  engineLibraryFolder = appStore().get(AppStoreKey.EngineLibraryFolder);
}
</script>
