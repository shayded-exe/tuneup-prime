<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="block">
      <img src="../../../img/enjinn.png" alt="ENJINN" />
    </div>

    <div v-if="!license.isPurchased" class="license-notice mb-6">
      <div v-if="license.isTrial" key="isTrial">
        <p class="has-text-warning has-text-weight-bold">
          TRIAL VERSION
        </p>
        <p v-if="license.isExpired" key="isExpired" class="has-text-danger">
          expired at {{ trialExpDate }}
        </p>
        <span v-else key="!isExpired">expires at {{ trialExpDate }}</span>
      </div>
      <div v-else-if="license.isInvalid" key="isInvalid">
        <p class="has-text-danger has-text-weight-bold">
          INVALID LICENSE
        </p>
        <p>
          please re-enter your license key
        </p>
      </div>

      <div class="buy-buttons">
        <b-button
          v-if="!license.exists"
          :disabled="isActivatingTrial"
          :loading="isActivatingTrial"
          @click="activateTrial()"
          type="is-primary"
          icon-left="flask"
        >
          start {{ trialDays }}d trial
        </b-button>
        <b-button
          v-if="license.isTrial"
          tag="a"
          :href="Links.Purchase"
          target="_blank"
          type="is-primary"
          icon-left="credit-card"
        >
          buy
        </b-button>
        <b-button
          :disabled="isActivatingTrial"
          @click="$router.push('activate')"
          type="is-primary"
          :class="{ 'is-outlined': !license.isInvalid }"
          icon-left="check"
        >
          activate
        </b-button>
      </div>
    </div>

    <div class="commands block">
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

    <div class="help-links">
      <b-button
        tag="a"
        :href="Links.Help"
        target="_blank"
        type="is-text"
        size="is-medium"
        icon-left="question"
      >
        help forum
      </b-button>

      <b-button
        tag="a"
        :href="Links.Docs"
        target="_blank"
        type="is-text"
        size="is-medium"
        icon-left="book"
      >
        documentation
      </b-button>
    </div>

    <div class="is-flex-grow-1"></div>

    <div class="level is-align-self-stretch">
      <div class="level-left is-align-self-flex-end">
        <div>
          <p>
            by
            <a :href="Links.Shayded" target="_blank" class="shayded-link">
              SHAYDED
            </a>
          </p>
          <p class="version">v{{ version }}</p>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <b-tooltip
            :active="isSettingsTooltipVisible"
            label="Set your library folder here first"
            type="is-info is-light"
            position="is-left"
            always
          >
            <b-button
              :disabled="isSettingsDisabled"
              @click="$router.push('settings')"
              type="is-info is-outlined"
              size="is-medium"
              icon-left="cog"
            >
              settings
            </b-button>
          </b-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.license-notice {
  margin-top: -1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.buy-buttons {
  &:not(:first-child) {
    margin-left: 3rem;
  }

  > :not(:first-child) {
    margin-left: 1rem;
  }
}

.command {
  display: inline-block;
}

.shayded-link {
  opacity: 0.75;
  font-size: 1.15em;
  font-style: italic;
}

.version {
  opacity: 0.25;
  line-height: normal;
}
</style>

<script lang="ts">
import { SHORT_DATE_TIME_FORMAT } from '@/app/formats';
import * as ipc from '@/app/ipc';
import { TRIAL_DAYS } from '@/licensing';
import Links from '@/links';
import { appStore, AppStoreKey } from '@/store';
import dateFormat from 'dateformat';
import { remote } from 'electron';
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: {},
})
export default class HomePage extends Vue {
  readonly Links = Links;
  readonly trialDays = TRIAL_DAYS;
  readonly version = remote.app.getVersion();

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

  license = ipc.licensing.getState();
  isActivatingTrial = false;

  libraryFolder: string | null = null;
  areSettingsValid = true;

  get trialExpDate(): string | undefined {
    const expDate = this.license.expDate;
    return expDate && dateFormat(expDate, SHORT_DATE_TIME_FORMAT);
  }

  get areCommandsDisabled(): boolean {
    return !this.areSettingsValid || !this.license.isLicensed;
  }

  get isSettingsDisabled(): boolean {
    return !this.license.isLicensed;
  }

  get isSettingsTooltipVisible(): boolean {
    return !this.areSettingsValid && !this.isSettingsDisabled;
  }

  mounted() {
    this.libraryFolder =
      appStore().get(AppStoreKey.EngineLibraryFolder) ?? null;
    this.areSettingsValid = !!this.libraryFolder;
  }

  async activateTrial() {
    if (this.isActivatingTrial) {
      return;
    }

    try {
      this.isActivatingTrial = true;
      this.license = await ipc.licensing.activateTrial();

      this.$buefy.notification.open({
        message: 'Trial started, enjoy!',
        type: 'is-success',
        position: 'is-bottom-left',
        duration: 5000,
      });
    } catch (e) {
      this.$buefy.notification.open({
        message:
          'Failed to start trial, please check your internet connection.',
        type: 'is-danger',
        position: 'is-bottom-left',
        duration: 5000,
      });
    } finally {
      this.isActivatingTrial = false;
    }
  }
}
</script>
