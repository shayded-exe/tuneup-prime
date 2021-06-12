import { app } from 'electron';
import Store, { Schema } from 'electron-store';
import path from 'path';

export enum AppStoreKey {
  EngineLibraryFolder = 'engineLibraryFolder',
  License = 'license',
  WindowState = 'windowState',
}

export interface WindowState {
  x: number;
  y: number;
}

export interface AppStoreData {
  [AppStoreKey.EngineLibraryFolder]: string;
  [AppStoreKey.License]?: string;
  [AppStoreKey.WindowState]?: WindowState;
}

export type AppStore = Store<AppStoreData>;

export const APP_STORE_SCHEMA: Schema<AppStoreData> = {
  [AppStoreKey.EngineLibraryFolder]: { type: 'string' },
  [AppStoreKey.License]: { type: 'string' },
  [AppStoreKey.WindowState]: {
    type: 'object',
    properties: {
      x: { type: 'number' },
      y: { type: 'number' },
    },
  },
};

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

const DEFAULT_LIBRARY_FOLDER = 'Engine Library';

export function initStore({
  withDefaults = false,
}: { withDefaults?: boolean } = {}) {
  const defaults = () => ({
    engineLibraryFolder: path.resolve(
      app.getPath('music'),
      DEFAULT_LIBRARY_FOLDER,
    ),
  });

  appStore(
    new Store<AppStoreData>({
      schema: APP_STORE_SCHEMA,
      defaults: !withDefaults ? undefined : defaults(),
    }),
  );
}
