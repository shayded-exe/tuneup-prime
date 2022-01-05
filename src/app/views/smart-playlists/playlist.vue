<template>
  <div>
    <div class="is-flex is-justify-content-space-between pl-2">
      <span class="py-1">
        {{ playlist.name }}
      </span>
      <b-taglist v-if="playlist.wasGenerated" attached class="block-taglist">
        <b-tag type="is-dark" size="is-medium" class="block-tag">
          tracks
        </b-tag>
        <b-tag
          size="is-medium"
          :class="[
            playlist.tracks.length ? 'is-success' : 'is-warning',
            'block-tag',
          ]"
        >
          {{ playlist.tracks.length }}
        </b-tag>
      </b-taglist>
    </div>

    <p class="rules px-4 py-2 is-family-code">
      {{ playlist.formattedRules }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.rules {
  background-color: $grey-dark;
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { UIPlaylist } from './ui-playlist';

@Component
export default class Playlist extends Vue {
  @Prop({ type: Object, required: true }) playlist!: UIPlaylist;
}
</script>
