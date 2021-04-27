import Ajv from 'ajv';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

import { SmartPlaylistConfig } from './definitions';
import smartPlaylistConfigSchema from './smart-playlist-config.schema.json';

export const SMART_PLAYLIST_CONFIG_FILENAME = 'engine-genie.yaml';

const validateConfig = new Ajv().compile<SmartPlaylistConfig>(
  smartPlaylistConfigSchema,
);

export async function readSmartPlaylistConfig(
  engineLibraryFolder: string,
): Promise<SmartPlaylistConfig> {
  const configPath = path.resolve(
    engineLibraryFolder,
    SMART_PLAYLIST_CONFIG_FILENAME,
  );
  const configString = await fs.promises.readFile(configPath, 'utf-8');
  const config = yaml.load(configString);

  if (!validateConfig(config)) {
    throw new Error(`${SMART_PLAYLIST_CONFIG_FILENAME}`);
  }

  return config;
}
