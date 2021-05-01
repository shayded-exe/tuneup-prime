import { Hook } from '@oclif/config';
import chalk from 'chalk';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';

import { appConf, AppConfKey } from '../../conf';
import * as engine from '../../engine';
import { checkPathExists, checkPathIsFolder } from '../../utils';

export default hook;

export const hook: Hook<'init'> = async function () {
  let folderNeedsUpdate = false;
  let folder = appConf.get(AppConfKey.EngineLibraryFolder);

  if (!folder) {
    folderNeedsUpdate = true;
  } else {
    const validationResult = await validateLibraryFolder(folder);

    if (validationResult !== true) {
      this.warn(`Engine library: ${validationResult} (${folder})`);
      folderNeedsUpdate = true;
    }
  }

  if (folderNeedsUpdate) {
    folder = await promptForLibraryFolder();
    appConf.set(AppConfKey.EngineLibraryFolder, folder);
  }

  const { version } = await engine.detectLibraryVersion(folder);
  this.log('Engine library:');
  this.log(chalk`\t{blue ${folder}} [{green v${version}}]`);
  this.log('');
};

async function promptForLibraryFolder(): Promise<string> {
  let isValid: boolean | string = false;

  const { folder } = await inquirer.prompt<{ folder: string }>({
    type: 'input',
    name: 'folder',
    message: 'Where is your Engine library folder?',
    default: path.join(os.homedir(), 'Music', 'Engine Library'),
    validate: async value => {
      isValid = await validateLibraryFolder(value);
      return isValid;
    },
    filter: value => (!isValid ? value : path.normalize(value)),
  });

  return folder;
}

async function validateLibraryFolder(folder: string): Promise<true | string> {
  if (!(await checkPathExists(folder))) {
    return `Path doesn't exist`;
  }
  if (!(await checkPathIsFolder(folder))) {
    return `Path isn't a folder`;
  }

  try {
    await engine.detectLibraryVersion(folder);
  } catch {
    return `Path isn't an Engine library`;
  }

  return true;
}
