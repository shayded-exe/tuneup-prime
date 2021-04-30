import Conf from 'conf';
import yaml from 'js-yaml';

export enum AppConfKey {
  EngineLibraryFolder = 'engineLibraryFolder',
}

export interface AppConf {
  [AppConfKey.EngineLibraryFolder]: string;
}

export const appConf = new Conf<AppConf>({
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load as any,
  schema: {
    [AppConfKey.EngineLibraryFolder]: { type: 'string' },
  },
});
