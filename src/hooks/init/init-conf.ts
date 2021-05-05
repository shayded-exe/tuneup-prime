import { Hook } from '@oclif/config';
import Conf from 'conf';
import yaml from 'js-yaml';

import { AppConf, AppConfKey, setAppConf } from '../../conf';

export default initConf;

export const initConf: Hook<'init'> = async function () {
  setAppConf(
    new Conf<AppConf>({
      // cwd: this.config.cacheDir,
      fileExtension: 'yaml',
      serialize: yaml.dump,
      deserialize: yaml.load as any,
      schema: {
        [AppConfKey.EngineLibraryFolder]: { type: 'string' },
      },
    }),
  );
};
