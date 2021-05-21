import Conf, { Schema } from 'conf';

export enum AppConfKey {
  EngineLibraryFolder = 'engineLibraryFolder',
  License = 'license',
}

export interface AppConf {
  [AppConfKey.EngineLibraryFolder]: string;
  [AppConfKey.License]: string;
}

export const APP_CONF_SCHEMA: Schema<AppConf> = {
  [AppConfKey.EngineLibraryFolder]: { type: 'string' },
  [AppConfKey.License]: { type: 'string', minLength: 10 },
};

let _appConf: Conf<AppConf> | undefined;

export function appConf(value?: Conf<AppConf>): Conf<AppConf> {
  if (value) {
    _appConf = value;
  }
  if (!_appConf) {
    throw new Error('appConf not initialized');
  }
  return _appConf;
}
