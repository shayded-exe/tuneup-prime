import { checkPathExists } from '@/utils';
import Ajv from 'ajv';
import fs from 'fs';
import yaml from 'js-yaml';
import { EOL } from 'os';
import path from 'path';

import { PlaylistNode } from './smart-playlist';
import schema from './tuneup.schema.json';

export interface LibraryConfig {
  smartPlaylists: PlaylistNode[];
}

export interface LibraryConfigFile extends LibraryConfig {
  path: string;
}

export const FILENAME = 'tuneup.yaml';

const validate = new Ajv({
  strictTuples: false,
}).compile<LibraryConfigFile>(schema);

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
  const filePath = getPath(libraryFolder);
  let configStr;
  let config;

  const baseError = 'Failed to read config.';
  try {
    configStr = await fs.promises.readFile(filePath, 'utf-8');
  } catch (e) {
    throw new Error(`${baseError} Path doesn't exist\n  ${filePath}`);
  }
  try {
    config = yaml.load(configStr);
  } catch (e) {
    if (e instanceof yaml.YAMLException && 'mark' in e) {
      const { mark } = e as { mark: { line: number; column: number } };
      throw new Error(
        `${baseError} Please check your formatting and indentation.\n  Line: ${mark.line}  Column: ${mark.column}`,
      );
    } else {
      throw new Error(`${baseError}\n\n${e.message}`);
    }
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
    path: filePath,
  };
}

export async function save(
  configFile: LibraryConfigFile,
): Promise<LibraryConfigFile> {
  const { path: filePath, ...config } = configFile;
  const configYaml = yaml.dump(config, {
    indent: 2,
  });
  await fs.promises.writeFile(filePath, configYaml, 'utf-8');

  return configFile;
}
