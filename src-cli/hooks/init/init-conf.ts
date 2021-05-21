import { Hook } from '@oclif/config';
import Conf from 'conf';
import yaml from 'js-yaml';

import { APP_CONF_SCHEMA, appConf, AppConf, AppConfKey } from '../../conf';
import { licenseState, LicenseState, verifyLicense } from '../../licensing';

export default initConf;

export const initConf: Hook<'init'> = async function () {
  // Has to be part of initConf hook because hooks run concurrently
  // and we need to have the conf loaded to check the license.
  const initLicense = async () => {
    const license = appConf().get(AppConfKey.License);

    if (!license) {
      licenseState(LicenseState.Unlicensed);
    } else if (!verifyLicense(license)) {
      licenseState(LicenseState.Invalid);
    } else {
      licenseState(LicenseState.Licensed);
      const activateCmd = this.config.findCommand('activate', { must: true });
      activateCmd.hidden = true;
    }
  };

  appConf(
    new Conf<AppConf>({
      cwd: this.config.configDir,
      fileExtension: 'yaml',
      serialize: yaml.dump,
      deserialize: yaml.load as any,
      schema: APP_CONF_SCHEMA,
    }),
  );

  await initLicense();
};
