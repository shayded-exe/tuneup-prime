<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="block">
      <img src="../../../img/enjinn.png" alt="ENJINN" />
    </div>

    <div class="commands block is-flex-grow-1">
      <div v-for="command of commands" :key="command.route" class="command m-2">
        <b-button
          :disabled="areCommandsDisabled"
          @click="$router.push(command.route)"
          type="is-light is-outlined"
          size="is-medium"
          icon-pack="em"
          :icon-left="command.icon"
          class="emoji-button"
        >
          {{ command.label }}
        </b-button>
      </div>
    </div>

    <div class="level is-align-self-stretch">
      <div class="level-left"></div>
      <div class="level-right">
        <div class="level-item">
          <b-tooltip
            :active="isSettingsTooltipVisible"
            label="Set your library folder here first"
            type="is-info is-light"
            position="is-left"
            always
          >
            <router-link to="settings">
              <b-button
                type="is-info is-outlined"
                size="is-medium"
                icon-left="cog"
              >
                settings
              </b-button>
            </router-link>
          </b-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.command {
  display: inline-block;
}
</style>

<script lang="ts">
import { appStore, AppStoreKey } from '@/store';
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: {},
})
export default class HomePage extends Vue {
  readonly commands: {
    label: string;
    route: string;
    icon: string;
  }[] = [
    {
      label: 'smart playlists',
      route: 'smart',
      icon: 'em-brain',
    },
    {
      label: 'relocate tracks',
      route: 'relocate',
      icon: 'em-mag',
    },
  ];

  libraryFolder: string | null = null;
  isStoreValid = true;

  get areCommandsDisabled() {
    return !this.isStoreValid;
  }

  get isSettingsTooltipVisible() {
    return !this.isStoreValid;
  }

  mounted() {
    this.libraryFolder = appStore().get(AppStoreKey.EngineLibraryFolder);
    this.isStoreValid = !!this.libraryFolder;
  }
}
</script>
