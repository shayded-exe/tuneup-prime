import Conf from 'conf';

export enum AppConfKey {
  EngineLibraryFolder = 'engineLibraryFolder',
}

export interface AppConf {
  [AppConfKey.EngineLibraryFolder]: string;
}

export let appConf: Conf<AppConf>;

export function setAppConf(conf: Conf<AppConf>) {
  appConf = conf;
}
