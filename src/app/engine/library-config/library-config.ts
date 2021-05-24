import Ajv from 'ajv';
import fs from 'fs';
import yaml from 'js-yaml';
import { EOL } from 'os';
import path from 'path';

import smartPlaylistConfigSchema from './enjinn.schema.json';
import { SmartPlaylist } from './smart-playlist';

export interface LibraryConfigFile {
  path: string;
  smartPlaylists: SmartPlaylist[];
}

export const LIBRARY_CONFIG_FILENAME = 'enjinn.yaml';

const validateConfig = new Ajv().compile<LibraryConfigFile>(
  smartPlaylistConfigSchema,
);

export async function readLibraryConfig(
  libraryFolder: string,
): Promise<LibraryConfigFile> {
  const configPath = path.resolve(libraryFolder, LIBRARY_CONFIG_FILENAME);
  let config;

  try {
    const configString = await fs.promises.readFile(configPath, 'utf-8');
    config = yaml.load(configString);
  } catch (e) {
    throw new Error(
      `Failed to read config, path doesn't exist '${configPath}'`,
    );
  }

  if (!validateConfig(config)) {
    throw new Error(
      [
        `${LIBRARY_CONFIG_FILENAME} is invalid`,
        ...(validateConfig.errors ?? []).map(
          e => `  ${e.instancePath} - ${e.message ?? ''}`,
        ),
      ].join(EOL),
    );
  }

  return {
    ...config,
    path: configPath,
  };
}
