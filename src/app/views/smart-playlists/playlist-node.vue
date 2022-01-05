<template>
  <playlist-folder v-if="isFolder" :folder="node"></playlist-folder>
  <playlist v-else :playlist="node" class="mb-2"></playlist>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import PlaylistFolder from './playlist-folder.vue';
import Playlist from './playlist.vue';
import { isUIPlaylistNodeFolder, UIPlaylistNode } from './ui-playlist';

@Component({
  components: {
    PlaylistFolder,
    Playlist,
  },
})
export default class PlaylistNode extends Vue {
  @Prop({ type: Object, required: true }) node!: UIPlaylistNode;

  get isFolder(): boolean {
    return isUIPlaylistNodeFolder(this.node);
  }
}
</script>
