<template>
  <div class="is-flex is-flex-direction-column is-align-items-stretch">
    <div class="block is-align-self-center">
      <img src="../../../img/enjinn.png" alt="ENJINN" />
    </div>

    <div class="commands block is-flex-grow-1">
      <router-link
        v-for="command of commands"
        :key="command.route"
        :to="command.route"
        class="command-link"
      >
        <b-button
          type="is-light"
          size="is-large"
          icon-pack="em"
          :icon-left="command.icon"
          class="emoji-button"
        >
          {{ command.label }}
        </b-button>
      </router-link>
    </div>

    <div class="level">
      <div class="level-left"></div>
      <div class="level-right">
        <div class="level-item">
          <router-link to="settings">
            <b-button
              type="is-info is-outlined"
              size="is-medium"
              icon-left="cog"
            >
              settings
            </b-button>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.command-link {
  display: block;
}
</style>

<script lang="ts">
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
}
</script>
