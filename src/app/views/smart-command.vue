<template>
  <div>
    <div class="level">
      <div class="level-left">
        <h1 class="title">Smart playlists</h1>
      </div>
      <div class="level-right">
        <b-button
          @click="generateSmartPlaylists()"
          type="is-primary"
          class="enjinn-button"
          >generate</b-button
        >
      </div>
    </div>

    <b-steps :has-navigation="false" vertical>
      <b-step-item label="Connect"></b-step-item>
      <b-step-item label="Build"></b-step-item>
      <b-step-item label="Save"></b-step-item>
    </b-steps>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import BaseCommand from '@/app/components/base-command';

@Component({})
export default class SmartCommand extends BaseCommand {
  async generateSmartPlaylists() {
    await this.connectToEngine();
    console.log(this.engineDb?.uuid);
  }
}
</script>
