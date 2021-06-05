import Store, { Schema } from 'electron-store';
import yaml from 'js-yaml';

export enum AppStoreKey {
  EngineLibraryFolder = 'engineLibraryFolder',
  License = 'license',
}

export interface AppStore {
  [AppStoreKey.EngineLibraryFolder]: string;
  [AppStoreKey.License]: string;
}

export const APP_STORE_SCHEMA: Schema<AppStore> = {
  [AppStoreKey.EngineLibraryFolder]: { type: 'string' },
  [AppStoreKey.License]: { type: 'string' },
};

let _store: Store<AppStore> | undefined;

export function appStore(value?: Store<AppStore>): Store<AppStore> {
  if (value) {
    _store = value;
  }
  if (!_store) {
    throw new Error('appStore not initialized');
  }
  return _store;
}

export function initStore() {
  appStore(
    new Store<AppStore>({
      fileExtension: 'yaml',
      serialize: yaml.dump,
      deserialize: yaml.load as any,
      schema: APP_STORE_SCHEMA,
    }),
  );
}
