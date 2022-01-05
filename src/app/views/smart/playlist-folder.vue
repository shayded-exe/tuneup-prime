<template>
  <b-collapse animation="slide">
    <template #trigger="props">
      <div class="is-flex" role="button">
        <span class="card-header-icon p-0">
          <b-icon :icon="props.open ? 'caret-down' : 'caret-up'"></b-icon>
        </span>

        <p class="card-header-title px-2 py-1">{{ folder.name }}</p>
      </div>
    </template>

    <div class="children">
      <playlist-node
        v-for="(child, index) of folder.children"
        :key="index"
        :node="child"
      ></playlist-node>
    </div>
  </b-collapse>
</template>

<style lang="scss" scoped>
.children {
  $border-width: 4px;

  margin-left: calc(0.75rem - #{$border-width} / 2);
  padding-left: calc(1.25rem - #{$border-width} / 2);
  border-left: $border-width dotted;
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { UIPlaylistFolder } from './ui-playlist';

@Component({
  components: {
    PlaylistNode: () => import('./playlist-node.vue'),
  },
})
export default class PlaylistFolder extends Vue {
  @Prop({ type: Object, required: true }) folder!: UIPlaylistFolder;
}
</script>
