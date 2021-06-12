<template>
  <form @submit="activate">
    <h1 class="title">
      Activate
    </h1>

    <b-field label="License key" class="is-flex-grow-1">
      <b-input :placeholder="licenseKeyFormat" v-model="licenseKey"></b-input>
    </b-field>

    <div v-if="activateError" class="message is-danger">
      <div class="message-body">
        {{ activateError }}
      </div>
    </div>

    <div class="level">
      <div class="level-left"></div>
      <div class="level-right">
        <div class="level-item">
          <b-button
            :disabled="isProcessing"
            @click="cancel()"
            type="is-light is-outlined"
            icon-left="times"
          >
            cancel
          </b-button>
        </div>
        <div class="level-item">
          <b-button
            :disabled="!canActivate"
            :loading="isActivating"
            native-type="submit"
            type="is-primary"
            icon-left="check"
          >
            activate
          </b-button>
        </div>
      </div>
    </div>
  </form>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import * as ipc from '@/app/ipc';

@Component
export default class ActivatePage extends Vue {
  readonly licenseKeyRegex = /^[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}$/;
  readonly licenseKeyFormat = Array(4)
    .fill('X'.repeat(8))
    .join('-');

  licenseKey = '';

  isActivating = false;
  activateError = '';

  get isProcessing(): boolean {
    return this.isActivating;
  }

  get isValid() {
    return this.licenseKeyRegex.test(this.licenseKey);
  }

  get canActivate(): boolean {
    return this.isValid && !this.isProcessing;
  }

  cancel() {
    this.goHome();
  }

  async activate(e: Event) {
    e.preventDefault();
    if (!this.canActivate) {
      return;
    }

    try {
      this.isActivating = true;
      const result = await ipc.licensing.activate(this.licenseKey);

      if (!result) {
        this.activateError = `License key isn't valid`;
        return;
      }

      this.$buefy.notification.open({
        message: 'Thanks for buying the full version of ENJINN!',
        type: 'is-success',
        position: 'is-bottom-left',
        duration: 5000,
      });
      this.goHome();
    } catch (e) {
      console.error(e);
      this.activateError = e.message;
    } finally {
      this.isActivating = false;
    }
  }

  private goHome() {
    this.$router.push('/');
  }
}
</script>