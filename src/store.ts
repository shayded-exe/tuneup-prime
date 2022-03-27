import { app } from 'electron';
import Store, { Schema } from 'electron-store';
import path from 'path';

export enum AppStoreKey {
  RekordboxXmlPath = 'rekordboxXmlPath',
  WindowState = 'windowState',
}

export interface AppStoreData {
  [AppStoreKey.RekordboxXmlPath]: string;
  [AppStoreKey.WindowState]?: WindowState;
}

export interface WindowState {
  x?: number;
  y?: number;
  height?: number;
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
  [AppStoreKey.RekordboxXmlPath]: { type: 'string' },
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
    rekordboxXmlPath: path.resolve(
      app.getPath('appData'),
      'Pioneer',
      'rekordbox',
      'rekordbox.xml',
    ),
  });

  const store = new Store<AppStoreData>({
    schema: APP_STORE_SCHEMA,
    clearInvalidConfig: true,
    defaults: !withDefaults ? undefined : defaults(),
  });

  const validStoreKeys = Object.values<string>(AppStoreKey);
  Object.keys(store.store)
    .filter(k => !validStoreKeys.includes(k))
    .forEach(k => store.delete(k as any));

  appStore(store);
}
