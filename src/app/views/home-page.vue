<template>
  <div class="is-flex is-flex-direction-column is-align-items-center">
    <div class="block">
      <img src="../../../img/enjinn.png" alt="ENJINN" />
    </div>

    <div
      v-if="licenseType !== LicenseType.Licensed"
      class="license-notice block"
    >
      <template v-if="licenseType === LicenseType.Trial">
        <span class="has-text-warning has-text-weight-bold">
          TRIAL VERSION
        </span>
        <span v-if="isTrialExpired" key="isExpired" class="has-text-danger">
          expired at {{ trialExpDate }}
        </span>
        <span v-else key="notExpired">expires at {{ trialExpDate }}</span>
      </template>
      <template v-else-if="licenseType === LicenseType.Invalid">
        <span class="has-text-danger has-text-weight-bold">
          INVALID LICENSE
        </span>
        <span>
          please re-enter your license key
        </span>
      </template>
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

    <b-button
      @click="openDocs()"
      type="is-text"
      size="is-medium"
      icon-left="book"
    >
      documentation
    </b-button>

    <div class="is-flex-grow-1"></div>

    <div class="level is-align-self-stretch">
      <div class="level-left is-align-self-flex-end">
        <span class="version">v{{ version }}</span>
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
  flex-direction: column;
  align-items: center;
}

.command {
  display: inline-block;
}

.version {
  opacity: 0.25;
  line-height: normal;
}
</style>

<script lang="ts">
import { SHORT_DATE_TIME_FORMAT } from '@/app/formats';
import * as ipc from '@/app/ipc';
import { LicenseType } from '@/licensing';
import { appStore, AppStoreKey } from '@/store';
import dateFormat from 'dateformat';
import { remote } from 'electron';
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: {},
})
export default class HomePage extends Vue {
  readonly LicenseType = LicenseType;

  readonly licenseState = ipc.licensing.getLicenseState();
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

  libraryFolder: string | null = null;
  isStoreValid = true;

  get licenseType(): LicenseType {
    return this.licenseState.type;
  }

  get isLicensed(): boolean {
    return (
      this.licenseType === LicenseType.Licensed ||
      (this.licenseType === LicenseType.Trial && !this.isTrialExpired)
    );
  }

  get isTrialExpired(): boolean {
    return !!this.licenseState.isExpired;
  }

  get trialExpDate(): string | undefined {
    const expDate = this.licenseState.trialExp;

    return expDate && dateFormat(expDate, SHORT_DATE_TIME_FORMAT);
  }

  get areCommandsDisabled(): boolean {
    return !this.isStoreValid || !this.isLicensed;
  }

  get isSettingsDisabled(): boolean {
    return !this.isLicensed;
  }

  get isSettingsTooltipVisible(): boolean {
    return !this.isSettingsDisabled && !this.isStoreValid;
  }

  mounted() {
    this.libraryFolder = appStore().get(AppStoreKey.EngineLibraryFolder);
    this.isStoreValid = !!this.libraryFolder;
  }

  openDocs() {
    ipc.shell.openUrl('https://github.com/rshea0/enjinn#readme');
  }
}
</script>
