import Ajv from 'ajv';
import chalk from 'chalk';
import fs from 'fs';
import yaml from 'js-yaml';
import { EOL } from 'os';
import path from 'path';

import { SmartPlaylist } from '../command-libs/smart';
import smartPlaylistConfigSchema from './enjinn.schema.json';

export interface LibraryConfigFile {
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
      `Failed to read config, path doesn't exist "${configPath}"`,
    );
  }

  if (!validateConfig(config)) {
    throw new Error(
      [
        chalk`{blue ${LIBRARY_CONFIG_FILENAME}} is {red invalid}`,
        ...(validateConfig.errors ?? []).map(
          e => chalk`\t{green.bold ${e.instancePath}} - ${e.message ?? ''}`,
        ),
      ].join(EOL),
    );
  }

  return config;
}
