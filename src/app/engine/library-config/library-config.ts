import { checkPathExists } from '@/utils';
import Ajv from 'ajv';
import fs from 'fs';
import yaml from 'js-yaml';
import { EOL } from 'os';
import path from 'path';

import smartPlaylistConfigSchema from './enjinn.schema.json';
import { SmartPlaylist } from './smart-playlist';

export interface LibraryConfig {
  smartPlaylists: SmartPlaylist[];
}

export interface LibraryConfigFile extends LibraryConfig {
  path: string;
}

export const FILENAME = 'enjinn.yaml';

const validate = new Ajv().compile<LibraryConfigFile>(
  smartPlaylistConfigSchema,
);

export function getPath(libraryFolder: string): string {
  return path.resolve(libraryFolder, FILENAME);
}

export async function createDefaultIfNotFound(
  libraryFolder: string,
): Promise<LibraryConfigFile | false> {
  const configPath = getPath(libraryFolder);

  if (await checkPathExists(configPath)) {
    return false;
  }

  return save({
    path: configPath,
    smartPlaylists: [],
  });
}

export async function read(libraryFolder: string): Promise<LibraryConfigFile> {
  const configPath = getPath(libraryFolder);
  let config;

  try {
    const configString = await fs.promises.readFile(configPath, 'utf-8');
    config = yaml.load(configString);
  } catch (e) {
    throw new Error(
      `Failed to read config, path doesn't exist\n    ${configPath}`,
    );
  }

  if (!validate(config)) {
    throw new Error(
      [
        `${FILENAME} is invalid`,
        ...(validate.errors ?? []).map(
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

export async function save(
  configFile: LibraryConfigFile,
): Promise<LibraryConfigFile> {
  const { path: configPath, ...config } = configFile;
  const configYaml = yaml.dump(config, {
    indent: 2,
  });
  await fs.promises.writeFile(configPath, configYaml, 'utf-8');

  return configFile;
}
