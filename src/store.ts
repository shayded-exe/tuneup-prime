import { app } from 'electron';
import Store, { Schema } from 'electron-store';
import path from 'path';

export enum AppStoreKey {
  EngineLibraryFolder = 'engineLibraryFolder',
  RekordboxXmlPath = 'rekordboxXmlPath',
  License = 'license',
  WindowState = 'windowState',
}

export interface WindowState {
  x?: number;
  y?: number;
  height?: number;
}

export interface AppStoreData {
  [AppStoreKey.EngineLibraryFolder]: string;
  [AppStoreKey.RekordboxXmlPath]: string;
  [AppStoreKey.License]?: string;
  [AppStoreKey.WindowState]?: WindowState;
}

export type AppStore = Store<AppStoreData>;

let _store: Store<AppStoreData> | undefined;

export function appStore(value?: Store<AppStoreData>): Store<AppStoreData> {
  if (value) {
    _store = value;
  }
  if (!_store) {
    throw new Error('appStore not initialized');
  }
  return _store;
}

const APP_STORE_SCHEMA: Schema<AppStoreData> = {
  [AppStoreKey.EngineLibraryFolder]: { type: 'string' },
  [AppStoreKey.RekordboxXmlPath]: { type: 'string' },
  [AppStoreKey.License]: { type: 'string' },
  [AppStoreKey.WindowState]: {
    type: 'object',
    properties: {
      x: { type: 'number' },
      y: { type: 'number' },
      height: { type: 'number' },
    },
  },
};

export function init({
  withDefaults = false,
}: { withDefaults?: boolean } = {}) {
  const defaults = (): AppStoreData => ({
    engineLibraryFolder: path.resolve(app.getPath('music'), 'Engine Library'),
    rekordboxXmlPath: path.resolve(
      app.getPath('appData'),
      'Pioneer',
      'rekordbox',
      'rekordbox.xml',
    ),
  });

  appStore(
    new Store<AppStoreData>({
      schema: APP_STORE_SCHEMA,
      defaults: !withDefaults ? undefined : defaults(),
    }),
  );
}
