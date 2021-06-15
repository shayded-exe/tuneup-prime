<template>
  <div class="level">
    <div class="level-left">
      <div class="level-item">
        <b-button
          :disabled="homeDisabled"
          @click="$router.push('/')"
          type="is-light is-outlined"
          icon-right="home"
        ></b-button>
      </div>
      <div class="level-item">
        <h1 class="title">
          {{ title }}
        </h1>
      </div>
    </div>
    <div class="level-right">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class CommandHeader extends Vue {
  @Prop(String) readonly title!: string;
  @Prop({ default: false }) homeDisabled!: boolean;
}
</script>
