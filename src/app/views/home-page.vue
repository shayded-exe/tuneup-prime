<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <img src="../../../img/enjinn.png" alt="ENJINN" />

    <div class="commands">
      <router-link to="smart">
        <div class="box">
          <i class="em em-brain"></i>
          smart
        </div>
      </router-link>
    </div>

    <b-button
      tag="router-link"
      to="settings"
      type="is-primary"
      icon-left="cog"
      class="enjinn-button"
      >settings</b-button
    >
  </div>
</template>

<style lang="scss" scoped></style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: {},
})
export default class HomePage extends Vue {}
</script>
