import Ajv from 'ajv';
import fs from 'fs';
import yaml from 'js-yaml';
import { EOL } from 'os';
import path from 'path';

import { SmartPlaylistConfigFile } from './definitions';
import smartPlaylistConfigSchema from './smart-playlist-config.schema.json';

export const SMART_PLAYLIST_CONFIG_FILENAME = 'engine-genie.yaml';

const validateConfig = new Ajv().compile<SmartPlaylistConfigFile>(
  smartPlaylistConfigSchema,
);

export async function readSmartPlaylistConfig(
  engineLibraryFolder: string,
): Promise<SmartPlaylistConfigFile> {
  const configPath = path.resolve(
    engineLibraryFolder,
    SMART_PLAYLIST_CONFIG_FILENAME,
  );
  let config;

  try {
    const configString = await fs.promises.readFile(configPath, 'utf-8');
    config = yaml.load(configString);
  } catch (e) {
    throw new Error(
      `Failed to read config, path doesn't exist "${configPath}"`,
    );
  }

  if (!validateConfig(config)) {
    throw new Error(
      [
        `${SMART_PLAYLIST_CONFIG_FILENAME} is invalid`,
        ...(validateConfig.errors ?? []).map(
          e => `\t${e.instancePath} - ${e.message}`,
        ),
      ].join(EOL),
    );
  }

  return config;
}
